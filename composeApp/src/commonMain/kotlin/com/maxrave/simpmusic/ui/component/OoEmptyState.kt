package com.maxrave.simpmusic.ui.component

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** The two 0_o empty-state moods, drawn from the brand artworks. */
enum class OoEmptyMood {
    /** A sleeping crescent moon — "nothing here yet". */
    SLEEPING_MOON,

    /** A little creature on a cliff under a starry swirl — "no connection". */
    CLIFF_STARLIGHT,
}

/**
 * 0_o signature empty-state: hand-drawn vector scenes in the golden/ink
 * palette, with a message line. Pure Canvas — no assets to load.
 */
@Composable
fun OoEmptyState(
    mood: OoEmptyMood,
    message: String,
    modifier: Modifier = Modifier,
    iconSize: Dp = 120.dp,
) {
    val golden = Color(0xFFE8C55A)
    val amber = Color(0xFFC4762E)
    val ink = MaterialTheme.colorScheme.onSurfaceVariant

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Canvas(modifier = Modifier.size(iconSize)) {
            val w = size.width
            val h = size.height
            when (mood) {
                OoEmptyMood.SLEEPING_MOON -> {
                    // Crescent: big circle minus an offset circle (drawn as two arcs).
                    val r = w * 0.28f
                    val c = Offset(w * 0.5f, h * 0.42f)
                    drawCircle(color = golden, radius = r, center = c)
                    drawCircle(color = Color(0x00000000), radius = r * 0.92f, center = Offset(c.x + r * 0.42f, c.y - r * 0.18f), blendMode = androidx.compose.ui.graphics.BlendMode.Clear)
                    // Closed sleeping eye: a small curved line.
                    drawLine(
                        color = Color(0xFF6B4A1E),
                        start = Offset(c.x - r * 0.15f, c.y - r * 0.05f),
                        end = Offset(c.x + r * 0.15f, c.y - r * 0.05f),
                        strokeWidth = w * 0.02f,
                        cap = StrokeCap.Round,
                    )
                    // A tiny "z" above.
                    val zc = Offset(w * 0.72f, h * 0.18f)
                    val z = w * 0.06f
                    drawLine(ink.copy(alpha = 0.7f), Offset(zc.x - z, zc.y - z), Offset(zc.x + z, zc.y - z), w * 0.018f, StrokeCap.Round)
                    drawLine(ink.copy(alpha = 0.7f), Offset(zc.x + z, zc.y - z), Offset(zc.x - z, zc.y + z), w * 0.018f, StrokeCap.Round)
                    drawLine(ink.copy(alpha = 0.7f), Offset(zc.x - z, zc.y + z), Offset(zc.x + z, zc.y + z), w * 0.018f, StrokeCap.Round)
                }

                OoEmptyMood.CLIFF_STARLIGHT -> {
                    // Starry swirl: a few scattered stars.
                    val stars =
                        listOf(
                            0.2f to 0.2f, 0.65f to 0.14f, 0.8f to 0.3f,
                            0.35f to 0.32f, 0.55f to 0.42f, 0.15f to 0.45f,
                        )
                    stars.forEach { (fx, fy) ->
                        drawCircle(ink.copy(alpha = 0.65f), radius = w * 0.015f, center = Offset(w * fx, h * fy))
                    }
                    // The swirl arc.
                    drawArc(
                        color = ink.copy(alpha = 0.55f),
                        startAngle = -60f,
                        sweepAngle = 220f,
                        useCenter = false,
                        topLeft = Offset(w * 0.18f, h * 0.05f),
                        size = androidx.compose.ui.geometry.Size(w * 0.64f, w * 0.64f),
                        style = Stroke(width = w * 0.02f, cap = StrokeCap.Round),
                    )
                    // The cliff.
                    val cliff = androidx.compose.ui.graphics.Path()
                    cliff.moveTo(w * 0.15f, h * 0.95f)
                    cliff.lineTo(w * 0.15f, h * 0.62f)
                    cliff.lineTo(w * 0.42f, h * 0.58f)
                    cliff.lineTo(w * 0.48f, h * 0.95f)
                    cliff.close()
                    drawPath(cliff, ink.copy(alpha = 0.85f))
                    // The little creature silhouette.
                    val cx = w * 0.3f
                    val cy = h * 0.58f
                    drawCircle(ink, radius = w * 0.045f, center = Offset(cx, cy - w * 0.055f))
                    drawLine(ink, Offset(cx, cy - w * 0.02f), Offset(cx, cy), strokeWidth = w * 0.03f, cap = StrokeCap.Round)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
