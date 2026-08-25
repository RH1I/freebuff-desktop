package com.maxrave.domain.visualization

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * 0_o visualizer bus — the shared pipe between the audio graph and the UI.
 * [bands] holds ~32 normalised (0f..1f) log-spaced magnitude bands.
 * Android feeds it from the in-graph PCM tap; desktop will feed it from the
 * mpv lavfi engine.
 */
object VisualizerBus {
    private val _bands = MutableStateFlow(FloatArray(BAND_COUNT))
    val bands = _bands.asStateFlow()

    /** Only analyse while something is actually watching — saves CPU. */
    @Volatile
    var isEnabled: Boolean = false

    fun publish(newBands: FloatArray) {
        if (!isEnabled) return
        val dst = _bands.value
        for (i in dst.indices) {
            val src = newBands.getOrNull(i) ?: 0f
            dst[i] = dst[i] * 0.55f + src * 0.45f
        }
    }

    const val BAND_COUNT = 32
}
