package com.maxrave.simpmusic

actual fun getPlatform(): Platform = Platform.Android

/**
 * Android: the Media3 in-graph PCM tap (VisualizerAudioProcessor) feeds the bus on every device —
 * no capability probe needed.
 */
actual fun visualizerEngineAvailable(): Boolean = true
