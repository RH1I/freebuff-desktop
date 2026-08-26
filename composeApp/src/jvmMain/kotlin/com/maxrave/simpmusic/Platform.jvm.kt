package com.maxrave.simpmusic


actual fun getPlatform(): Platform = Platform.Desktop

/**
 * Desktop: the mpv visualizer engine probes libmpv's filter support on first call and caches the
 * verdict process-wide. On the custom Linux slice (ffmpeg built with a filter whitelist without
 * showfreqs) this reports false; stock Windows/macOS libmpv builds report true.
 */
actual fun visualizerEngineAvailable(): Boolean =
    runCatching { com.simpmusic.media_jvm.mpv.MpvVisualizerEngine.isSupported() }.getOrDefault(false)