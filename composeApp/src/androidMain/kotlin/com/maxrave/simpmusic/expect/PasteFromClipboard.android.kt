package com.maxrave.simpmusic.expect

import android.content.ClipboardManager
import android.content.Context
import org.koin.mp.KoinPlatform.getKoin

/**
 * Reads plain text from the Android clipboard, or null when it is empty.
 */
actual fun pasteFromClipboard(): String? =
    try {
        val context: Context = getKoin().get()
        val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboardManager.primaryClip?.getItemAt(0)?.text?.toString()
    } catch (_: Exception) {
        null
    }
