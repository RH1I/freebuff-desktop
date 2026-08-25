package com.maxrave.media3.audio

/**
 * Minimal Radix-2 Cooley-Tukey FFT for the 0_o visualizer — no external
 * dependencies, commonMain, allocation-free after warm-up (reuses buffers).
 *
 * Input: 512 mono PCM samples in [-1f, 1f] → output: 256 complex bins
 * (we only consume magnitudes of the lower half).
 */
class Fft(private val size: Int = 512) {

    init {
        require(size and (size - 1) == 0) { "FFT size must be a power of two" }
    }

    private val cosTable = FloatArray(size / 2) { kotlin.math.cos(-2.0 * Math.PI * it / size).toFloat() }
    private val sinTable = FloatArray(size / 2) { kotlin.math.sin(-2.0 * Math.PI * it / size).toFloat() }
    private val reverse = IntArray(size) { Integer.reverse(it) / (Integer.SIZE - Integer.numberOfTrailingZeros(size)) }

    private val re = FloatArray(size)
    private val im = FloatArray(size)

    /**
     * Computes magnitudes for the first [size]/2 bins into [out]
     * (normalised 0..1-ish; caller scales). Returns the number of bins written.
     */
    fun magnitudes(samples: FloatArray, out: FloatArray): Int {
        require(samples.size >= size) { "need at least $size samples" }
        for (i in 0 until size) {
            re[i] = samples[reverse[i]]
            im[i] = 0f
        }
        // Iterative in-place FFT
        var half = 1
        while (half < size) {
            val step = size / (half * 2)
            var i = 0
            while (i < size) {
                var k = 0
                for (j in 0 until half) {
                    val cos = cosTable[k]
                    val sin = sinTable[k]
                    val tRe = re[i + j + half] * cos - im[i + j + half] * sin
                    val tIm = re[i + j + half] * sin + im[i + j + half] * cos
                    re[i + j + half] = re[i + j] - tRe
                    im[i + j + half] = im[i + j] - tIm
                    re[i + j] += tRe
                    im[i + j] += tIm
                    k += step
                }
                i += half * 2
            }
            half *= 2
        }
        val bins = size / 2
        val norm = 2f / size
        for (i in 0 until bins.coerceAtMost(out.size)) {
            out[i] = kotlin.math.hypot(re[i], im[i]) * norm
        }
        return bins.coerceAtMost(out.size)
    }
}
