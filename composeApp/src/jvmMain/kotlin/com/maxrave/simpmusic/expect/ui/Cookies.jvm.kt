package com.maxrave.simpmusic.expect.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.awt.SwingPanel
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.maxrave.logger.Logger
import com.maxrave.simpmusic.ui.theme.typo
import dev.datlag.kcef.KCEF
import dev.datlag.kcef.KCEFBrowser
import dev.datlag.kcef.KCEFCookieManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.browser.CefRendering
import org.cef.handler.CefLoadHandlerAdapter
import org.cef.network.CefCookieManager
import java.io.File
import java.net.CookieHandler
import java.net.CookieManager
import java.net.URI
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import org.jetbrains.compose.resources.stringResource
import simpmusic.composeapp.generated.resources.Res
import simpmusic.composeapp.generated.resources.cookie_login_desktop_hint

private const val TAG = "Cookies.jvm"

/** Where the CEF bundle (~100 MB, per-OS) is downloaded and cached on first use. */
private fun kcefInstallDir(): File =
    File(System.getProperty("user.home"), ".simpmusic/kcef-bundle")

/**
 * One process-wide KCEF init gate. [KCEF.init] is internally idempotent, but it is suspend and
 * downloads ~100 MB of CEF on first use, so every login screen shares this single state holder
 * instead of each running its own init.
 */
private object KcefBootstrap {
    val state = mutableStateOf<KcefInitState>(KcefInitState.Idle)
}

private sealed interface KcefInitState {
    /** Nothing started yet. */
    data object Idle : KcefInitState

    /** Downloading / extracting / initializing CEF; [progress] is 0..100, -1 while unknown. */
    data class Initializing(val progress: Int) : KcefInitState

    data object Ready : KcefInitState

    data class Failed(val message: String?) : KcefInitState
}

/**
 * Kick off KCEF init once per process and observe its state.
 *
 * Called from the composition root of each login webview — BEFORE any branch — so the effect stays
 * alive across state flips. Only the first caller launches the init coroutine; later callers just
 * collect the shared state, so navigating between login screens never re-triggers a download or
 * races two initializations.
 */
@Composable
private fun rememberKcefInit(): KcefInitState {
    LaunchedEffect(Unit) {
        if (KcefBootstrap.state.value !is KcefInitState.Idle) return@LaunchedEffect
        KcefBootstrap.state.value = KcefInitState.Initializing(-1)
        launch(Dispatchers.IO) {
            try {
                KCEF.init(
                    builder = {
                        installDir(kcefInstallDir())
                        progress {
                            onDownloading { p ->
                                KcefBootstrap.state.value = KcefInitState.Initializing(p.toInt())
                            }
                            onInitialized {
                                KcefBootstrap.state.value = KcefInitState.Ready
                            }
                        }
                    },
                    onError = { t ->
                        Logger.e(TAG, "KCEF init failed: ${t?.message}")
                        if (KcefBootstrap.state.value !is KcefInitState.Ready) {
                            KcefBootstrap.state.value = KcefInitState.Failed(t?.message)
                        }
                    },
                    onRestartRequired = {
                        // All packages downloaded, but the JVM must relaunch to load the natives.
                        // Rare; surfaced to the user instead of failing silently.
                        Logger.w(TAG, "KCEF downloaded but a restart is required to load CEF")
                        if (KcefBootstrap.state.value !is KcefInitState.Ready) {
                            KcefBootstrap.state.value = KcefInitState.Failed("restart_required")
                        }
                    },
                )
            } catch (e: Throwable) {
                Logger.e(TAG, "KCEF init threw: ${e.message}")
                if (KcefBootstrap.state.value !is KcefInitState.Ready) {
                    KcefBootstrap.state.value = KcefInitState.Failed(e.message)
                }
            }
        }
    }
    return KcefBootstrap.state.value
}

/** A created embedded browser plus the AWT component that draws it. */
private class CefLoginWebView(
    val browser: KCEFBrowser,
    val uiComponent: java.awt.Component,
)

/**
 * Create the embedded Chromium browser for [initUrl], reporting finished page loads to
 * [onPageFinished] exactly like Android's WebViewClient.onPageFinished does.
 *
 * Returns null until CEF is ready or if creation fails — callers render their placeholder. Keyed on
 * [ready]/[initUrl]; disposal happens via [DisposableCefBrowser].
 */
@Composable
private fun rememberCefLoginWebViewOrNull(
    ready: Boolean,
    initUrl: String,
    onPageFinished: (String) -> Unit,
): CefLoginWebView? =
    remember(ready, initUrl) {
        if (!ready) {
            null
        } else {
            runCatching {
                val client = KCEF.newClientBlocking()
                // onLoadEnd fires on a CEF IPC thread; the commonMain callers hop into coroutines
                // before touching state, mirroring how they treat Android's WebView callbacks.
                client.addLoadHandler(
                    object : CefLoadHandlerAdapter() {
                        override fun onLoadEnd(
                            browser: CefBrowser?,
                            frame: CefFrame?,
                            statusCode: Int,
                        ) {
                            val url = frame?.url ?: browser?.url ?: return
                            try {
                                onPageFinished(url)
                            } catch (e: Throwable) {
                                Logger.e(TAG, "onPageFinished handler threw: ${e.message}")
                            }
                        }
                    },
                )
                val browser = client.createBrowser(initUrl, CefRendering.DEFAULT, false)
                CefLoginWebView(browser, browser.uiComponent)
            }.onFailure {
                Logger.e(TAG, "Failed to create CEF browser: ${it.message}")
            }.getOrNull()
        }
    }

/** Dispose the browser when the login screen goes away. */
@Composable
private fun DisposableCefBrowser(webView: CefLoginWebView?) {
    DisposableEffect(webView) {
        onDispose {
            webView?.let {
                runCatching { it.browser.dispose() }
                    .onFailure { e -> Logger.d(TAG, "CEF browser dispose: ${e.message}") }
            }
        }
    }
}

/**
 * Fallback shown when KCEF can't initialize (download failed, unsupported platform...). Keeps the
 * paste-cookie flow reachable — the developer-mode sheet lives above this composable either way.
 */
@Composable
private fun KcefUnavailableHint(reason: String?) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                stringResource(Res.string.cookie_login_desktop_hint),
                style = typo().labelMedium,
                color = Color.White,
                textAlign = TextAlign.Center,
            )
            if (reason != null) {
                Text(
                    text = reason,
                    style = typo().labelSmall,
                    color = Color.White.copy(alpha = 0.6f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun KcefLoadingIndicator(progressPercent: Int) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Text(
                text =
                    if (progressPercent >= 0) {
                        "Downloading browser components… $progressPercent%"
                    } else {
                        "Preparing browser components…"
                    },
                style = typo().labelMedium,
                color = Color.White.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 12.dp),
            )
        }
    }
}

/** Shared body for both desktop login webviews. */
@Composable
private fun KcefWebContent(
    initUrl: String,
    onPageFinished: (String) -> Unit,
    aboveContent: @Composable (BoxScope.() -> Unit),
    onBrowserCreated: (KCEFBrowser?) -> Unit = {},
) {
    val initState = rememberKcefInit()

    Box(modifier = Modifier.fillMaxSize()) {
        when (initState) {
            is KcefInitState.Ready -> {
                val webView =
                    rememberCefLoginWebViewOrNull(
                        ready = true,
                        initUrl = initUrl,
                        onPageFinished = onPageFinished,
                    )
                DisposableCefBrowser(webView)
                LaunchedEffect(webView) { onBrowserCreated(webView?.browser) }
                val webUi = webView?.uiComponent
                if (webUi != null) {
                    // SwingPanel's factory must return a JComponent; CEF hands back an AWT
                    // Component (a heavyweight canvas). Wrap non-JComponents so layout/repaint
                    // have a proper Swing parent.
                    SwingPanel(
                        factory = {
                            webUi as? javax.swing.JComponent
                                ?: javax.swing.JPanel(java.awt.BorderLayout()).apply {
                                    add(webUi, java.awt.BorderLayout.CENTER)
                                }
                        },
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    KcefUnavailableHint(null)
                }
            }

            is KcefInitState.Initializing -> KcefLoadingIndicator(initState.progress)
            is KcefInitState.Failed -> KcefUnavailableHint(initState.message)
            is KcefInitState.Idle -> Unit // one frame before the init effect flips the state
        }
        aboveContent()
    }
}

/**
 * Synchronous "name=value; name=value" header for [url] out of Chromium's cookie jar, or null when
 * CEF has never been initialized (no session to read).
 *
 * CEF's visitor API delivers cookies asynchronously on an IPC thread, so this bridges with a latch:
 * the visitor reports how many cookies will arrive ([totalCount]); we wait until all of them did,
 * capped at a few seconds. Callers invoke this from coroutines that are allowed to block (same
 * contract as Android's CookieManager.getCookie, which also blocks).
 */
private fun cefCookieHeader(url: String): String? {
    val manager =
        runCatching { CefCookieManager.getGlobalManager() }
            .onFailure { Logger.d(TAG, "No CEF cookie manager (${it.message})") }
            .getOrNull() ?: return null

    val collected = StringBuilder()
    val latch = CountDownLatch(1)
    var total = -1
    var arrived = 0
    val ok =
        runCatching {
            manager.visitUrlCookies(
                url,
                false,
            ) { cookie, _, totalCount, _ ->
                cookie?.let {
                    if (collected.isNotEmpty()) collected.append("; ")
                    collected.append(it.name).append('=').append(it.value)
                }
                synchronized(latch) {
                    total = totalCount
                    arrived++
                    if (total in 0..arrived) latch.countDown()
                }
                false
            }
        }.getOrNull() ?: return null
    if (!ok) return null

    // When CEF could not report the count up front (-1), give the visitor a short bounded grace
    // period rather than blocking indefinitely.
    if (!latch.await(if (total >= 0) 5 else 1, TimeUnit.SECONDS)) {
        Logger.w(TAG, "CEF cookie visit incomplete after timeout for $url")
    }
    return collected.toString()
}

/**
 * Desktop cookie store for the embedded browser: backed by Chromium's own jar, so cookies captured
 * from a Google sign-in inside the app flow straight into the same string format the Android
 * WebView path produces ("name=value; name=value").
 *
 * The Java [CookieHandler] fallback stays because this expect is process-global: when no CEF
 * session exists yet (login screens never opened), it behaves exactly like the old stub did.
 */
actual fun createWebViewCookieManager(): WebViewCookieManager =
    object : WebViewCookieManager {
        override fun getCookie(url: String): String =
            cefCookieHeader(url)
                ?: CookieHandler
                    .getDefault()
                    .get(URI(url), emptyMap())["Cookie"]
                    ?.joinToString("; ")
                    .orEmpty()

        override fun removeAllCookies() {
            // Only touch the CEF jar when a global manager actually exists; otherwise this is the
            // pre-login state and there is nothing to clear. KCEFCookieManager's no-arg
            // constructor wraps CefCookieManager.getGlobalManager(); its blocking variant runs
            // CEF's delete-all on the proper message loop (the raw manager only offers
            // deleteCookies(name, path) per cookie).
            runCatching { KCEFCookieManager().deleteAllCookiesBlocking() }
            CookieHandler.setDefault(CookieManager())
        }
    }

@OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class, androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
actual fun PlatformWebView(
    state: MutableState<WebViewState>,
    initUrl: String,
    aboveContent: @Composable (BoxScope.() -> Unit),
    onPageFinished: (String) -> Unit,
) {
    KcefWebContent(initUrl, onPageFinished, aboveContent)
}

@OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class, androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
actual fun DiscordWebView(
    state: MutableState<WebViewState>,
    aboveContent: @Composable (BoxScope.() -> Unit),
    onLoginDone: (token: String) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var delivered by remember { mutableStateOf(false) }

    // Discord's token lives in localStorage under "token", serialized WITH its surrounding quotes.
    // CEF's cookie API cannot see localStorage, so once the post-login redirect lands on the app
    // shell we ask the page for it over the JS bridge — the same trick the Android actual plays
    // with alert().
    KcefWebContent(
        initUrl = "https://discord.com/login",
        onPageFinished = { url ->
            state.value = WebViewState.Finished
            Logger.d(TAG, "Discord login URL: $url")
        },
        aboveContent = aboveContent,
        onBrowserCreated = { browser ->
            if (browser == null) return@KcefWebContent
            scope.launch {
                while (isActive && !delivered) {
                    val url =
                        runCatching { browser.url }
                            .onFailure { Logger.d(TAG, "browser.url unavailable: ${it.message}") }
                            .getOrNull().orEmpty()
                    if (url.startsWith("https://discord.com/channels") ||
                        url.endsWith("/app")
                    ) {
                        // evaluateJavaScript expects a function BODY (a return statement).
                        browser.evaluateJavaScript(
                            "return (window.localStorage && window.localStorage.getItem('token')) || null;",
                        ) { response ->
                            val token = response?.trim().orEmpty().removeSurrounding("\"")
                            if (!token.isNullOrEmpty() && !delivered) {
                                delivered = true
                                scope.launch(Dispatchers.Main) { onLoginDone(token) }
                            }
                        }
                    }
                    delay(2500)
                }
            }
        },
    )
}
