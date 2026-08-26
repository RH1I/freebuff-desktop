package com.maxrave.simpmusic

/**
 * Whether this platform's playback engine can feed the shared visualizer bus.
 *
 * Android taps PCM inside the Media3 audio graph, so it is always true. On desktop the answer
 * depends on the bundled libmpv (the lavfi `showfreqs` filter must exist in its ffmpeg), which the
 * media layer probes once at runtime — see `MpvVisualizerEngine.isSupported()`.
 */
expect fun visualizerEngineAvailable(): Boolean
