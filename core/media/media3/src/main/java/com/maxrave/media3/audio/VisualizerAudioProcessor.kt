package com.maxrave.media3.audio

import androidx.media3.common.C
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.audio.BaseAudioProcessor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.nio.ByteBuffer
import kotlin.math.abs
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.pow

/**
 * 0_o visualizer bus — the shared pipe between the audio graph and the UI.
 * [bands] holds ~32 normalised (0f..1f) log-spaced magnitude bands, updated
 * live by [VisualizerAudioProcessor] on Android. Desktop feeds the same shape
 * from its own engine.
 */
object VisualizerBus {
    private val _bands = MutableStateFlow(FloatArray(BAND_COUNT))
    val bands = _bands.asStateFlow()

    /** Only analyse while something is actually watching — saves CPU. */
    @Volatile
    var isEnabled: Boolean = false

    internal fun publish(newBands: FloatArray) {
        if (!isEnabled) return
        val dst = _bands.value
        // Smooth toward the new values for a calmer, more premium motion.
        for (i in dst.indices) {
            val src = newBands.getOrNull(i) ?: 0f
            dst[i] = dst[i] * 0.55f + src * 0.45f
        }
    }

    const val BAND_COUNT = 32
}

/**
 * Taps the 16-bit PCM passing through the audio sink, runs a small FFT and
 * publishes log-spaced magnitude bands to [VisualizerBus]. The audio itself is
 * passed through untouched — this is a read-only tap.
 */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class VisualizerAudioProcessor : BaseAudioProcessor() {

    private val fft = Fft(FFT_SIZE)
    private val window = FloatArray(FFT_SIZE) { i ->
        // Hann window — kills spectral leakage at the edges.
        0.5f * (1f - kotlin.math.cos(2.0 * Math.PI * i / (FFT_SIZE - 1)).toFloat())
    }
    private val sampleBuf = FloatArray(FFT_SIZE)
    private val bins = FloatArray(FFT_SIZE / 2)
    private val bands = FloatArray(VisualizerBus.BAND_COUNT)

    private var sampleRate = 44_100
    private var channels = 2
    private var samplesSinceLastAnalysis = 0

    override fun onConfigure(inputAudioFormat: AudioProcessor.AudioFormat): AudioProcessor.AudioFormat {
        sampleRate = max(1, inputAudioFormat.sampleRate)
        channels = max(1, inputAudioFormat.channelCount)
        if (inputAudioFormat.encoding != C.ENCODING_PCM_16BIT) {
            // Only tap 16-bit PCM; other encodings pass through unanalysed.
            return AudioProcessor.AudioFormat(
                inputAudioFormat.sampleRate,
                inputAudioFormat.channelCount,
                C.ENCODING_PCM_16BIT,
            )
        }
        return inputAudioFormat
    }

    override fun queueInput(inputBuffer: ByteBuffer) {
        val remaining = inputBuffer.remaining()
        if (!VisualizerBus.isEnabled) {
            // Passthrough, zero cost.
            replaceOutputBuffer(remaining).put(inputBuffer).flip()
            return
        }
        val position = inputBuffer.position()
        val frameBytes = 2 * channels
        val frames = remaining / frameBytes
        var f = 0
        while (f < frames) {
            val base = position + f * frameBytes
            // Average channels to mono.
            var acc = 0
            for (c in 0 until channels) {
                acc += inputBuffer.getShort(base + c * 2)
            }
            val mono = (acc / channels) / 32768f
            sampleBuf[samplesSinceLastAnalysis % FFT_SIZE] = mono
            samplesSinceLastAnalysis++
            f++
        }
        // Analyse ~every 46ms at 44.1kHz (2048 samples) — cheap and smooth.
        if (samplesSinceLastAnalysis >= FFT_SIZE &&
            samplesSinceLastAnalysis - lastAnalyzedAt >= ANALYSIS_STRIDE
        ) {
            lastAnalyzedAt = samplesSinceLastAnalysis
            for (i in 0 until FFT_SIZE) {
                sampleBuf[i] *= window[i]
            }
            fft.magnitudes(sampleBuf, bins)
            aggregateBands()
            VisualizerBus.publish(bands)
        }
        replaceOutputBuffer(remaining).put(inputBuffer).flip()
    }

    private var lastAnalyzedAt = 0

    /** Fold linear FFT bins into [VisualizerBus.BAND_COUNT] log-spaced bands. */
    private fun aggregateBands() {
        val nyquist = sampleRate / 2f
        val binCount = FFT_SIZE / 2
        var prevEdge = 20.0
        for (b in 0 until VisualizerBus.BAND_COUNT) {
            // Log-spaced edges from 20Hz to nyquist.
            val nextEdge = 20.0 * 10.0.pow((b + 1) * log10(nyquist / 20.0) / VisualizerBus.BAND_COUNT)
            val lo = max(1, (prevEdge / nyquist * binCount).toInt())
            val hi = max(lo + 1, (nextEdge / nyquist * binCount).toInt().coerceAtMost(binCount))
            var peak = 0f
            for (i in lo until hi) {
                peak = max(peak, abs(bins[i]))
            }
            // Perceptual scaling: dB-ish compression into 0..1.
            val db = 20f * log10(max(peak, 1e-4f))
            bands[b] = ((db + 60f) / 60f).coerceIn(0f, 1f)
            prevEdge = nextEdge
        }
    }

    companion object {
        private const val FFT_SIZE = 512
        private const val ANALYSIS_STRIDE = 1024 // ~23ms at 44.1kHz per window slide
    }
}
