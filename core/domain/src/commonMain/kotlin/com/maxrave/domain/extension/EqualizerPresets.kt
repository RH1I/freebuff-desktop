package com.maxrave.domain.extension

/**
 * The ten centre frequencies of the desktop equalizer, in Hz.
 *
 * Classic ISO one-third-octave spacing (31.25 Hz … 16 kHz), the layout every hardware/graphic EQ
 * uses, so presets written for one transfer to the other.
 */
val EQ_BAND_HZ =
    doubleArrayOf(
        31.25,
        62.5,
        125.0,
        250.0,
        500.0,
        1000.0,
        2000.0,
        4000.0,
        8000.0,
        16000.0,
    )

/** Per-band gain limits shared by the UI sliders and the DataStore sanitizer. */
const val EQ_MIN_GAIN_DB = -12.0
const val EQ_MAX_GAIN_DB = 12.0

/**
 * Named equalizer presets. [gains] must have exactly [EQ_BAND_HZ].size entries; `null` means
 * "flat" and is stored/compared as all zeros.
 */
enum class EqualizerPreset(
    val gains: DoubleArray?,
) {
    FLAT(null),
    BASS_BOOST(doubleArrayOf(8.0, 7.0, 5.5, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0)),
    VOCAL(doubleArrayOf(-2.5, -2.0, 0.0, 2.5, 4.5, 4.5, 3.0, 1.5, 0.0, -1.0)),
    ROCK(doubleArrayOf(5.0, 4.5, 2.5, 0.0, -1.5, -0.5, 1.5, 3.5, 4.5, 4.5)),
    ELECTRONIC(doubleArrayOf(6.0, 5.5, 2.5, 0.0, -1.5, 1.5, 1.0, 2.0, 4.5, 5.0)),
    ;

    companion object {
        /** True when every entry of [gains] is within rounding distance of zero. */
        fun isFlat(gains: DoubleArray): Boolean = gains.all { kotlin.math.abs(it) < 0.05 }

        /**
         * The preset whose table matches [gains] (±0.25 dB per band), or null when the current
         * curve was hand-tuned — which the UI then shows as a custom state.
         */
        fun matching(gains: DoubleArray): EqualizerPreset? =
            entries.firstOrNull { preset ->
                val table = preset.gains ?: return@firstOrNull isFlat(gains)
                table.indices.all { kotlin.math.abs(table[it] - gains[it]) < 0.25 }
            }
    }
}
