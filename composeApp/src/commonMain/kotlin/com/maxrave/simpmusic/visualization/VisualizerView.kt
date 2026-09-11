package com.maxrave.simpmusic.visualization

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.dp
import kotlin.math.min

/** The 0_o visualizer flavours. */
enum class VisualizerMode {
    /** Visualizer disabled. */
    OFF,

    /** Classic energy columns. */
    BARS,

    /** A circular wave hugging the album art (vudio-style). */
    WAVE_AROUND_ART,

    /** A radial spectrum swirl (butterchurn-spirit). */
    RADIAL,

    /** Bass-reactive heartbeat halo with orbiting sparks. */
    PULSE,
}

/**
 * The 0_o visualizer. Draws smooth, theme-tinted audio reactivity from a
 * normalised band array (0f..1f, ~32 bands). Pure Canvas — works on every
 * platform, no permissions, no web views.
 */
@Composable
fun VisualizerView(
    bands: FloatArray,
    mode: VisualizerMode,
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    albumCenterFraction: Float = 0.35f,
) {
    // Smooth the bars so the motion breathes instead of strobing.
    val animated = bands.map { b ->
        val v by animateFloatAsState(
            targetValue = b.coerceIn(0f, 1f),
            animationSpec = tween(durationMillis = 90),
            label = "viz",
        )
        v
    }
    // Orbit clock for PULSE sparks (common-safe: no platform clock API).
    // Created only in PULSE mode so other modes pay nothing.
    val orbitPhase =
        if (mode == VisualizerMode.PULSE) {
            val phase by rememberInfiniteTransition(label = "pulse").animateFloat(
                initialValue = 0f,
                targetValue = 2f * Math.PI.toFloat(),
                animationSpec = infiniteRepeatable(tween(durationMillis = 2800, easing = LinearEasing), RepeatMode.Restart),
                label = "orbit",
            )
            phase
        } else {
            0f
        }

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        when (mode) {
            VisualizerMode.OFF -> return@Canvas
            VisualizerMode.BARS -> {
                val count = animated.size
                if (count == 0) return@Canvas
                val gap = w * 0.012f
                val barW = (w - gap * (count - 1)) / count
                val brush = Brush.verticalGradient(listOf(color, color.copy(alpha = 0.55f)))
                animated.forEachIndexed { i, v ->
                    val barH = (h * 0.85f) * v.coerceAtLeast(0.03f)
                    drawRoundRect(
                        brush = brush,
                        topLeft = Offset(i * (barW + gap), h - barH),
                        size = Size(barW, barH),
                        cornerRadius = CornerRadius(barW / 2f, barW / 2f),
                    )
                }
            }

            VisualizerMode.WAVE_AROUND_ART -> {
                // A circular wave hugging the album art circle.
                val center = Offset(w / 2f, h / 2f)
                val baseR = min(w, h) / 2f * albumCenterFraction
                val maxAmp = min(w, h) / 2f * (1f - albumCenterFraction) * 0.9f
                val points = 128
                val circleR = baseR * 1.12f
                // Smooth ring (filled, low alpha)
                val ring = androidx.compose.ui.graphics.Path()
                for (p in 0 until points) {
                    val t = p.toFloat() / points
                    val bandIdx = (t * animated.size).toInt().coerceIn(0, (animated.size - 1).coerceAtLeast(0))
                    val amp = animated.getOrNull(bandIdx) ?: 0f
                    val angle = t * 2f * Math.PI.toFloat() - Math.PI.toFloat() / 2f
                    val r = circleR + amp * maxAmp
                    val x = center.x + r * kotlin.math.cos(angle)
                    val y = center.y + r * kotlin.math.sin(angle)
                    if (p == 0) ring.moveTo(x, y) else ring.lineTo(x, y)
                }
                ring.close()
                drawPath(ring, color.copy(alpha = 0.16f))
                drawPath(ring, color.copy(alpha = 0.75f), style = Stroke(width = 2.dp.toPx()))
            }

            VisualizerMode.RADIAL -> {
                // Radial spectrum rays swirling out from behind the album art.
                val center = Offset(w / 2f, h / 2f)
                val baseR = min(w, h) / 2f * albumCenterFraction
                val maxLen = min(w, h) / 2f * (1f - albumCenterFraction) * 1.05f
                val rays = 72
                for (i in 0 until rays) {
                    val t = i.toFloat() / rays
                    val bandIdx = (t * animated.size).toInt().coerceIn(0, (animated.size - 1).coerceAtLeast(0))
                    val v = (animated.getOrNull(bandIdx) ?: 0f).coerceAtLeast(0.02f)
                    val angle = t * 360f - 90f
                    rotate(angle, pivot = center) {
                        drawLine(
                            brush = Brush.verticalGradient(
                                listOf(color.copy(alpha = 0.8f), color.copy(alpha = 0.05f)),
                                startY = center.y - baseR,
                                endY = center.y - baseR - maxLen * v,
                            ),
                            start = Offset(center.x, center.y - baseR),
                            end = Offset(center.x, center.y - baseR - maxLen * v),
                            strokeWidth = 3.dp.toPx(),
                            alpha = 0.35f + 0.65f * v,
                        )
                    }
                }
            }

            VisualizerMode.PULSE -> {
                // Bass-reactive heartbeat: a breathing halo, a rim riding the
                // kick, and three sparks orbiting the art. The 90ms tween on
                // `animated` is the envelope — no extra clocks needed.
                val center = Offset(w / 2f, h / 2f)
                val baseR = min(w, h) / 2f * albumCenterFraction
                val bassN = (animated.size / 5).coerceAtLeast(1)
                var bassSum = 0f
                for (i in 0 until bassN) bassSum += animated.getOrNull(i) ?: 0f
                val pulse = (bassSum / bassN).coerceIn(0f, 1f)
                val haloR = baseR * (1.35f + 0.45f * pulse)
                drawCircle(
                    brush =
                        Brush.radialGradient(
                            0f to color.copy(alpha = 0.10f + 0.30f * pulse),
                            0.7f to color.copy(alpha = 0.05f + 0.12f * pulse),
                            1f to Color.Transparent,
                            center = center,
                            radius = haloR,
                        ),
                    radius = haloR,
                    center = center,
                )
                drawCircle(
                    color = color.copy(alpha = 0.45f + 0.45f * pulse),
                    radius = baseR * (1.06f + 0.14f * pulse),
                    center = center,
                    style = Stroke(width = (2f + 2f * pulse).dp.toPx()),
                )
                val t = orbitPhase
                for (k in 0 until 3) {
                    val a = t + k * (2f * Math.PI.toFloat() / 3f)
                    val r = baseR * (1.28f + 0.22f * pulse)
                    drawCircle(
                        color = color.copy(alpha = 0.85f),
                        radius = 3.dp.toPx(),
                        center = Offset(center.x + r * kotlin.math.cos(a), center.y + r * kotlin.math.sin(a)),
                    )
                }
            }
        }
    }
}
