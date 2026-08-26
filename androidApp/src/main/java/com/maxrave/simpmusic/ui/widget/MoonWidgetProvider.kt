package com.maxrave.simpmusic.ui.widget

import android.content.Context
import android.graphics.Bitmap
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.ContentScale
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import coil3.ImageLoader
import coil3.request.CachePolicy
import coil3.request.ImageRequest
import coil3.request.SuccessResult
import coil3.request.allowHardware
import coil3.request.error
import coil3.request.placeholder
import coil3.toBitmap
import com.maxrave.common.Config
import com.maxrave.logger.Logger
import com.maxrave.simpmusic.MainActivity
import com.maxrave.simpmusic.R
import com.maxrave.simpmusic.viewModel.SharedViewModel
import com.maxrave.simpmusic.viewModel.UIEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.koin.core.qualifier.named

/**
 * P15 — "0_o sleeping moon" now-playing widget (ودجت القمر النائم).
 *
 * Identity: deep navy night sky (#0B1026/#141B33), golden crescent moon drawn
 * from [R.drawable.ic_moon_sleeping] (the same golden #E8C55A used by the
 * Golden Moon theme and the OoEmptyState sleeping-moon mood), gold accents on
 * the title and the play/pause control, silver artist line.
 *
 * Zero new dependencies: built on androidx.glance, already present in
 * androidApp/build.gradle.kts. Playback state comes from [SharedViewModel]
 * (the same source the mini-player/notification use); updates are pushed on
 * every controller-state or now-playing change.
 */
class MoonWidgetProvider :
    GlanceAppWidget(),
    KoinComponent {
    val sharedViewModel by inject<SharedViewModel>()
    val serviceScope by inject<CoroutineScope>(named(Config.SERVICE_SCOPE))

    companion object {
        /**
         * Guards against stacking duplicate state collectors: every
         * [GlanceAppWidget.update] re-enters [provideGlance], and without this
         * each pass would register two more permanent flow collectors.
         */
        private val collectorsStarted = java.util.concurrent.atomic.AtomicBoolean(false)
    }

    override suspend fun provideGlance(
        context: Context,
        id: GlanceId,
    ) {
        // Pre-resolve localized labels outside the composable tree so we never
        // need a context inside Glance content.
        val idleTitle = context.getString(R.string.moon_widget_idle_title)
        val idleArtist = context.getString(R.string.moon_widget_idle_artist)
        val playLabel = context.getString(R.string.moon_widget_play)
        val pauseLabel = context.getString(R.string.moon_widget_pause)

        // Keep re-rendering while playback state or track changes.
        // Started once per process; they live in the app-lifetime serviceScope.
        if (collectorsStarted.compareAndSet(false, true)) {
            serviceScope.launch {
                launch {
                    sharedViewModel.controllerState.collectLatest { updateAll(context) }
                }
                launch {
                    sharedViewModel.nowPlayingScreenData.collectLatest { updateAll(context) }
                }
            }
        }

        provideContent {
            MoonWidgetContent(
                sharedViewModel = sharedViewModel,
                context = context,
                idleTitle = idleTitle,
                idleArtist = idleArtist,
                playLabel = playLabel,
                pauseLabel = pauseLabel,
            )
        }
    }

    suspend fun updateAll(context: Context) {
        Logger.w("MoonWidget", "State changed")
        runCatching {
            val manager = GlanceAppWidgetManager(context)
            val glanceIds = manager.getGlanceIds(this@MoonWidgetProvider::class.java)
            glanceIds.forEach { glanceId ->
                this@MoonWidgetProvider.update(context, glanceId)
            }
        }.onFailure {
            Logger.e("MoonWidget", "update failed", it)
        }
    }
}

/** 0_o night-sky colors (Golden Moon palette companions). */
private object MoonColors {
    val NavyDeep = Color(0xFF0B1026)
    val NavySky = Color(0xFF141B33)
    val Gold = Color(0xFFE8C55A)
    val Silver = Color(0xFFC9CFDD)
}

@androidx.compose.runtime.Composable
private fun MoonWidgetContent(
    sharedViewModel: SharedViewModel,
    context: Context,
    idleTitle: String,
    idleArtist: String,
    playLabel: String,
    pauseLabel: String,
) {
    val controllerState by sharedViewModel.controllerState.collectAsState()
    val screenDataState by sharedViewModel.nowPlayingScreenData.collectAsState()

    val title = screenDataState.nowPlayingTitle.ifBlank { idleTitle }
    val artist = screenDataState.artistName
    val thumbUrl = screenDataState.thumbnailURL

    var albumArt by remember(thumbUrl) { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(thumbUrl) {
        if (thumbUrl.isNullOrBlank()) {
            albumArt = null
        } else {
            val request =
                ImageRequest
                    .Builder(context)
                    .data(thumbUrl)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .diskCacheKey(thumbUrl + "BIGGER")
                    .placeholder(R.drawable.holder)
                    .error(R.drawable.holder)
                    .allowHardware(false)
                    .build()
            albumArt =
                when (val result = ImageLoader(context).execute(request)) {
                    is SuccessResult -> result.image.toBitmap()
                    else -> null
                }
        }
    }

    GlanceTheme {
        Box(
            GlanceModifier
                .fillMaxSize()
                .background(MoonColors.NavyDeep)
                .clickable(actionStartActivity<MainActivity>()),
            contentAlignment = Alignment.CenterStart,
        ) {
            // Night-sky wash layered over the deep navy base.
            Box(
                GlanceModifier
                    .fillMaxSize()
                    .background(MoonColors.NavySky),
            ) {}

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier =
                    GlanceModifier
                        .fillMaxSize()
                        .padding(horizontal = 14.dp),
            ) {
                // The sleeping moon — brand mark doubling as album-art frame.
                Box(contentAlignment = Alignment.Center, modifier = GlanceModifier.size(56.dp)) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_moon_sleeping),
                        contentDescription = "0_o",
                        contentScale = ContentScale.FillBounds,
                        modifier = GlanceModifier.fillMaxSize(),
                    )
                    albumArt?.let { art ->
                        Image(
                            provider = ImageProvider(art),
                            contentDescription = null,
                            contentScale = ContentScale.FillBounds,
                            modifier =
                                GlanceModifier
                                    .size(34.dp)
                                    .cornerRadius(17.dp),
                        )
                    }
                }
                Spacer(GlanceModifier.width(10.dp))
                Column(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = GlanceModifier.defaultWeight().fillMaxWidth(),
                ) {
                    Text(
                        text = title,
                        style =
                            TextStyle(
                                color = ColorProvider(MoonColors.Gold),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Start,
                            ),
                        maxLines = 1,
                        modifier = GlanceModifier.fillMaxWidth(),
                    )
                    Spacer(GlanceModifier.height(2.dp))
                    Text(
                        text = artist.ifBlank { idleArtist },
                        style =
                            TextStyle(
                                color = ColorProvider(MoonColors.Silver),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Normal,
                                textAlign = TextAlign.Start,
                            ),
                        maxLines = 1,
                        modifier = GlanceModifier.fillMaxWidth(),
                    )
                }
                Spacer(GlanceModifier.width(8.dp))
                androidx.glance.appwidget.components.CircleIconButton(
                    modifier = GlanceModifier.size(44.dp),
                    imageProvider =
                        if (controllerState.isPlaying) {
                            ImageProvider(R.drawable.baseline_pause_circle_24)
                        } else {
                            ImageProvider(R.drawable.baseline_play_circle_24)
                        },
                    contentDescription = if (controllerState.isPlaying) pauseLabel else playLabel,
                    contentColor = ColorProvider(MoonColors.Gold),
                    backgroundColor = ColorProvider(Color.Transparent),
                    onClick = {
                        sharedViewModel.onUIEvent(UIEvent.PlayPause)
                    },
                )
            }
        }
    }
}
