package com.maxrave.simpmusic

import platform.UIKit.UIDevice

actual fun getPlatform(): Platform = Platform.iOS

/**
 * iOS: no playback engine wired for visualization yet — the toggle stays hidden.
 */
actual fun visualizerEngineAvailable(): Boolean = false
