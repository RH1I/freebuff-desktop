package com.maxrave.simpmusic.expect

import java.awt.Toolkit
import java.awt.datatransfer.DataFlavor

/**
 * Reads plain text from the system clipboard, or null when the clipboard is
 * empty or holds something that is not text.
 */
actual fun pasteFromClipboard(): String? =
    try {
        val transferable = Toolkit.getDefaultToolkit().systemClipboard.getContents(null)
        if (transferable != null && transferable.isDataFlavorSupported(DataFlavor.stringFlavor)) {
            transferable.getTransferData(DataFlavor.stringFlavor) as? String
        } else {
            null
        }
    } catch (_: Exception) {
        null
    }
