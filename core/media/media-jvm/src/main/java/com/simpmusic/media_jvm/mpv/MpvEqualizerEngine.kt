package com.simpmusic.media_jvm.mpv

import com.maxrave.domain.extension.EQ_BAND_HZ
import com.maxrave.logger.Logger
import java.util.Locale

private const val TAG = "MpvEqualizerEngine"

/**
 * Desktop 10-band equalizer: installs a labelled `@simpEQ:` entry of cascaded libavfilter
 * `equalizer` biquads onto the handle's `af` chain.
 *
 * ## Why `equalizer`, not `superequalizer`
 * Both ship with every FFmpeg. `superequalizer` exposes fixed 18 bands whose centres do not line
 * up with the classic ISO 31.25 Hz…16 kHz row, and it has no per-band runtime command. The plain
 * `equalizer` peaking filter is parameterized by centre frequency directly, so ten cascaded
 * stages reproduce exactly the band layout the UI shows, and the whole entry can be swapped by
 * rewriting one property string — the same mechanism the crossfade sweep and the visualizer chain
 * already use.
 *
 * ## Chain cohabitation
 * Like [MpvVisualizerEngine], this engine only ever APPENDS: [start] captures whatever `af`
 * string is installed (crossfade sweeps, rubberband pitch, a running visualizer) and writes it
 * back with the EQ entry added; [stop] restores exactly that captured string. Flat curves install
 * nothing at all, so an all-zero EQ never touches the audio path.
 *
 * ## Probe gating
 * The visualizer probe (`MpvVisualizerEngine.isSupported()`) is the single verdict on whether
 * this build's libmpv/ffmpeg accepts lavfi graphs inside `af`: it exercises the identical
 * `@label:lavfi=[...]` syntax this engine uses, and mpv either accepts lavfi graphs or rejects
 * them wholesale — there is no known build that takes `showfreqs` but not `equalizer`. Gating the
 * EQ on that same probe keeps one source of truth and hides both features together on the custom
 * Linux ffmpeg slice (whose filter whitelist omits them); stock Windows/macOS builds expose both.
 */
class MpvEqualizerEngine internal constructor(
    internal val player: MpvPlayer,
) {
    @Volatile
    private var installedOriginalChain: String? = null

    /**
     * Install (or retune) the equalizer for [gains] — ten dB values matching [EQ_BAND_HZ].
     * A flat curve removes any previously installed EQ entry instead.
     */
    fun start(gains: DoubleArray): Boolean {
        if (!MpvVisualizerEngine.isSupported()) return false
        val base =
            if (installedOriginalChain != null) {
                // Retune while running: build on the base captured at first start so stop()
                // still restores the pre-EQ chain verbatim.
                installedOriginalChain!!
            } else {
                player.getAudioFilterChain().also { installedOriginalChain = it }
            }
        if (!player.setAudioFilterChain(withEqualizer(base, chainEntry(gains)))) {
            Logger.w(TAG, "mpv rejected the equalizer chain — EQ stays off")
            installedOriginalChain = null
            return false
        }
        return true
    }

    /** Restore the exact `af` string captured at [start]. Safe to call twice. */
    fun stop() {
        val original = installedOriginalChain ?: return
        installedOriginalChain = null
        player.setAudioFilterChain(original)
    }

    companion object {
        /**
         * Build the labelled `@simpEQ:` af entry for [gains] — one cascaded `equalizer` peaking
         * stage per non-flat band. Empty when every band is flat: an all-zero EQ installs
         * nothing, so the audio path stays untouched.
         *
         * The graph is wrapped in `[ ]` because it contains `,` and `=` — the same quoting rule
         * MpvPlayer's crossfade chain follows per mpv's vf.rst.
         */
        internal fun chainEntry(gains: DoubleArray): String {
            val stages =
                gains.mapIndexed { index, gain ->
                    if (kotlin.math.abs(gain) < 0.05) {
                        null
                    } else {
                        "equalizer=f=${EQ_BAND_HZ[index]}:t=q:w=1.0:g=" +
                            String.format(Locale.ROOT, "%.2f", gain)
                    }
                }.filterNotNull()
            if (stages.isEmpty()) return ""
            return "@simpEQ:lavfi=[${stages.joinToString(",")}]"
        }

        /**
         * Prepend the EQ entry to an existing `af` string.
         *
         * EQ goes FIRST so later entries (crossfade sweeps, rubberband, the visualizer sink) see
         * already-shaped audio, and so removing the visualizer via its own capture/restore logic
         * keeps the EQ alive. Any previous `@simpEQ:` entry is stripped before adding, which
         * makes this idempotent for gain changes. An empty [eqEntry] means "flat" → strip only,
         * leaving everything else untouched.
         */
        internal fun withEqualizer(existing: String?, eqEntry: String): String {
            val base =
                existing.orEmpty()
                    .split(",")
                    .filter { it.isNotBlank() && !it.contains("simpEQ") }
                    .joinToString(",")
            if (eqEntry.isEmpty()) return base.trimEnd(',')
            return listOf(eqEntry, base.trimEnd(','))
                .filter { it.isNotBlank() }
                .joinToString(",")
        }
    }
}
