package org.simpmusic.lyrics.models.response

import kotlinx.serialization.Serializable

@Serializable
data class LrclibObject(
    val id: Int,
    val name: String,
    val trackName: String?,
    val artistName: String?,
    val albumName: String?,
    // LRCLIB occasionally returns "duration": null for a track — a hard
    // non-null Float here made the ENTIRE lyrics response fail to parse.
    val duration: Float? = null,
    val instrumental: Boolean = false,
    val plainLyrics: String? = null,
    val syncedLyrics: String? = null,
)