package com.maxrave.logger

import co.touchlab.kermit.Logger

object Logger {
    private val logger = Logger

    /**
     * Master switch for debug-level logging. Production builds keep this off:
     * debug logs here include full HTTP traffic dumps whose strings are built
     * eagerly at the call sites, so even "muted" logging used to cost real
     * memory and jank. Flip to true (or -D0o.debug=true on desktop) only while
     * debugging.
     */
    var verboseLogging: Boolean = false

    // Tags suppressed at all log levels. Add a tag here to silence its logs globally.
    private val mutedTags =
        setOf(
            "DiscordWebSocket",
        )

    private fun isMuted(tag: String): Boolean = tag in mutedTags

    fun d(
        tag: String,
        message: String,
    ) {
        if (!verboseLogging || isMuted(tag)) return
        logger.d(
            tag = tag,
            message = {
                message
            },
        )
    }

    fun i(
        tag: String,
        message: String,
    ) {
        if (isMuted(tag)) return
        logger.i(tag = tag, message = { message })
    }

    fun w(
        tag: String,
        message: String,
    ) {
        if (isMuted(tag)) return
        logger.w(tag = tag, message = { message })
    }

    fun e(
        tag: String,
        message: String,
        e: Throwable? = null,
    ) {
        if (isMuted(tag)) return
        logger.e(throwable = e, tag = tag, message = { message })
    }
}

enum class LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}