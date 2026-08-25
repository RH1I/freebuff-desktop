package com.maxrave.simpmusic.ui.component

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import org.jetbrains.compose.resources.painterResource
import simpmusic.composeapp.generated.resources.Res
import simpmusic.composeapp.generated.resources.app_name
import simpmusic.composeapp.generated.resources.circle_app_icon
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

/**
 * 0_o splash — the golden face appears, its little `o` eye opens when the app
 * is ready, then the whole thing dissolves into the main UI.
 */
@Composable
fun OoSplash(
    visible: Boolean,
    modifier: Modifier = Modifier,
) {
    if (!visible) return

    // The eye-opening progress: 0 = closed (a line), 1 = fully open.
    val eyeOpen = remember { Animatable(0f) }
    val fade = remember { Animatable(1f) }

    LaunchedEffect(Unit) {
        eyeOpen.animateTo(
            1f,
            tween(durationMillis = 700, easing = FastOutSlowInEasing),
        )
    }
    LaunchedEffect(visible) {
        if (!visible) {
            fade.animateTo(0f, tween(280))
        }
    }

    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors =
                            listOf(
                                Color(0xFF342818),
                                Color(0xFF241B10),
                                Color(0xFF140F09),
                            ),
                    ),
                ),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.alpha(fade.value),
        ) {
            Image(
                painter = painterResource(Res.drawable.circle_app_icon),
                contentDescription = null,
                contentScale = ContentScale.Fit,
                modifier =
                    Modifier
                        .size(140.dp)
                        .clip(CircleShape)
                        .scale(0.9f + 0.1f * eyeOpen.value),
            )
            Spacer(Modifier.height(18.dp))
            Text(
                text = org.jetbrains.compose.resources.stringResource(Res.string.app_name),
                color = Color(0xFFFCF4DE),
                style =
                    androidx.compose.material3.MaterialTheme.typography.headlineMedium,
                modifier = Modifier.alpha(0.4f + 0.6f * eyeOpen.value),
            )
        }
    }
}
