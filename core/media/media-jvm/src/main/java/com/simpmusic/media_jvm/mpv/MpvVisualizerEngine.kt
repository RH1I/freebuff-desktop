package com.simpmusic.media_jvm.mpv

import com.maxrave.domain.visualization.VisualizerBus
import com.maxrave.logger.Logger
import java.awt.image.BufferedImage
import java.awt.image.DataBufferInt
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.pow

private const val TAG = "MpvVisualizerEngine"

/**
 * Desktop visualizer engine: reads the spectrum image that an mpv `lavfi=[showfreqs]` video filter
 * renders into the handle's hidden video output, converts each pixel column into one magnitude
 * value and publishes [VisualizerBus.BAND_COUNT] bands for the shared Compose visualizer.
 *
 * ## Why showfreqs instead of tapping PCM
 * libmpv has no audio-tap API. The audio graph IS a filter chain, though, so a video-output filter
 * can ride on it (`lavfi` inside `af` carries a `vsink`); `showfreqs` then draws the live FFT as
 * pixels we own completely — no window, no audible side effects. It is the same trick Android
 * plays with an in-graph AudioProcessor, expressed in mpv's vocabulary.
 *
 * ## Why pixel sampling is honest here
 * `showfreqs` paints frequency left-to-right (log-spaced when [CHAIN] asks for `freq_scale=log`)
 * and magnitude bottom-to-top, one full spectrum per frame. Reading the lit height of each band's
 * centre column therefore reproduces the same approximate log-rebinning the Android tap computes
 * from raw FFT bins. Magnitudes arrive in the filter's amplitude scale normalized against full
 * scale — good enough for decorative bars, and the smoothing in [VisualizerBus.publish] hides the
 * residual quantization of a 32-pixel-high source.
 *
 * ## Lifecycle
 * One engine per playing handle. [start] appends the chain onto whatever `af` value the adapter had
 * installed (crossfade sweeps / rubberband are preserved), [stop] restores exactly that captured
 * string. Frames are pushed in by the owning adapter from the video frame source.
 */
class MpvVisualizerEngine private constructor(
    private val player: MpvPlayer,
) {
    fun start(): Boolean {
        if (!player.canHostVisualizerChain) return false
        val existing = player.getAudioFilterChain()
        if (!player.setAudioFilterChain(withVisualizer(existing))) {
            Logger.w(TAG, "mpv rejected the visualizer chain — bars stay off")
            return false
        }
        installedOriginalChain = existing
        return true
    }

    @Volatile
    private var installedOriginalChain: String? = null

    /** Restore the exact `af` string captured at [start]. Safe to call twice. */
    fun stop() {
        val original = installedOriginalChain ?: return
        installedOriginalChain = null
        player.setAudioFilterChain(original)
    }

    /** Called by the owning adapter whenever the handle publishes a new rendered frame. */
    fun onFrame(image: BufferedImage?) {
        if (image == null || !VisualizerBus.isEnabled) return
        extractBands(image)
    }

    /**
     * Map one spectrum frame onto [VisualizerBus.BAND_COUNT] log-spaced bands.
     *
     * With `freq_scale=log` the drawn width maps 20 Hz..nyquist logarithmically, so band b lives
     * around the same relative x position the Android tap's edge math produces. We sample each
     * band's centre column top-down and read the first lit row — the drawn line's height.
     */
    private fun extractBands(image: BufferedImage) {
        val pixels =
            try {
                (image.raster.dataBuffer as DataBufferInt).data
            } catch (_: ClassCastException) {
                // Not an INT-packed image (never happens for the bgr0 pipeline, but stay safe).
                return
            }
        val w = image.width
        val h = image.height
        if (w <= 0 || h <= 0 || pixels.size < w * h) return

        val bands = FloatArray(VisualizerBus.BAND_COUNT)
        var prevEdge = 20.0
        val nyquist = 22050.0 // matches the assumption baked into the Android tap
        for (b in 0 until VisualizerBus.BAND_COUNT) {
            // Log-spaced edges 20 Hz..nyquist — identical math to VisualizerAudioProcessor.
            val nextEdge = 20.0 * 10.0.pow((b + 1) * log10(nyquist / 20.0) / VisualizerBus.BAND_COUNT)
            val x =
                (((prevEdge + nextEdge) / 2.0 / nyquist) * w).toInt().coerceIn(0, w - 1)
            var peakRow = -1
            for (y in 0 until h) {
                val argb = pixels[y * w + x]
                // The frame is TYPE_INT_RGB (bgr0 bytes). showfreqs draws its line/bars in a bright
                // foreground over a black background; any clearly non-black pixel counts.
                val r = (argb shr 16) and 0xFF
                val g = (argb shr 8) and 0xFF
                val bl = argb and 0xFF
                if (max(r, max(g, bl)) > 40) {
                    peakRow = y
                    break
                }
            }
            bands[b] =
                if (peakRow < 0) {
                    0f
                } else {
                    // Row 0 (top) == full scale, bottom row == silence.
                    ((h - 1 - peakRow).toFloat() / (h - 1).coerceAtLeast(1)).coerceIn(0f, 1f)
                }
            prevEdge = nextEdge
        }
        VisualizerBus.publish(bands)
    }

    companion object {
        /**
         * Probe whether THIS bundled libmpv can host the visualizer chain.
         *
         * Two independent things can fail, and both must pass:
         *  1. A `vo=libmpv` software render context must exist (the Linux slice builds mpv without
         *     X11/Wayland/GL VOs on purpose — but `libmpv` itself is always available).
         *  2. libavfilter must know `showfreqs`. The custom Linux ffmpeg compiles a whitelist
         *     (`--enable-filter=...`) that does NOT include it; stock Windows/macOS builds do.
         *
         * Both are checked with one throwaway handle, and the verdict is cached process-wide.
         */
        fun isSupported(): Boolean {
            supported?.let { return it }
            synchronized(this) {
                supported?.let { return it }
                // audioOnly = false pins vo=libmpv and attaches the render context; if that
                // fallback path engaged, videoFrames is null and there is no sink to draw into.
                val probe = MpvPlayer.create(audioOnly = false)
                val ok =
                    if (probe == null || !probe.canHostVisualizerChain) {
                        false
                    } else {
                        try {
                            probe.setAudioFilterChain(CHAIN)
                        } finally {
                            probe.release()
                        }
                    }
                supported = ok
                Logger.d(TAG, "Visualizer support probe: $ok")
                return ok
            }
        }

        @Volatile
        private var supported: Boolean? = null

        /**
         * The visualizer entry appended to the adapter's `af` chain.
         *
         * `showfreqs`, not `showspectrum`: showspectrum's scrolling slides put TIME on the x-axis;
         * showfreqs keeps FREQUENCY there every frame, which is what the band mapper below walks.
         * `freq_scale=log` aligns the drawn axis with VisualizerBus's log-spaced bands. A small
         * canvas keeps the SW renderer cheap — 64x32 pixels per frame.
         */
        internal const val CHAIN = "lavfi=[showfreqs=size=64x32:mode=line:freq_scale=log]"

        /** Append [CHAIN] to an existing `af` string (or replace an older visualizer entry). */
        internal fun withVisualizer(existing: String?): String {
            val base =
                existing.orEmpty()
                    .split(",")
                    .filter { it.isNotBlank() && !it.contains("showfreqs") }
                    .joinToString(",")
            return listOf(base.trimEnd(','), CHAIN)
                .filter { it.isNotBlank() }
                .joinToString(",")
        }
    }
}
