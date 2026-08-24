package com.maxrave.simpmusic.expect

import androidx.compose.runtime.Composable

expect fun copyToClipboard(
    label: String,
    text: String,
)

/**
 * Reads plain text from the system clipboard, or null when it is empty or
 * holds non-text content.
 */
expect fun pasteFromClipboard(): String?