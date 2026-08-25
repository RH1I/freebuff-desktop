package com.my.kizzy

import com.maxrave.domain.data.entities.SongEntity
import com.my.kizzy.rpc.KizzyRPC
import com.my.kizzy.rpc.RpcImage
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

class DiscordRPC(
    token: String,
) : KizzyRPC(token) {
    @OptIn(ExperimentalTime::class)
    suspend fun updateSong(
        currentPlaybackTimeMillis: Long,
        durationMillis: Long,
        playbackSpeed: Float = 1.0f,
        song: SongEntity,
    ) = runCatching {
        val currentTime = Clock.System.now().toEpochMilliseconds()

        val adjustedPlaybackTime = (currentPlaybackTimeMillis / playbackSpeed).toLong()
        val calculatedStartTime = currentTime - adjustedPlaybackTime

        val remainingDuration = durationMillis - currentPlaybackTimeMillis
        val adjustedRemainingDuration = (remainingDuration / playbackSpeed).toLong()

        setActivity(
            name = APP_NAME,
            details = song.title,
            state = song.artistName?.joinToString(", "),
            largeImage = song.thumbnails?.let { RpcImage.ExternalImage(it) },
            smallImage = null,
            largeText = song.albumName,
            buttons =
                listOf(
                    // 0_o: the buttons point at the song itself on YouTube Music —
                    // never at the upstream project's site.
                    "Listen on YouTube" to "https://music.youtube.com/watch?v=${song.videoId}",
                ),
            type = Type.LISTENING,
            since = currentTime,
            startTime = calculatedStartTime,
            endTime = currentTime + adjustedRemainingDuration,
            applicationId = APPLICATION_ID,
        )
    }

    companion object {
        // 0_o personal build. Note: the presence title on Discord's side comes
        // from the registered Discord application behind APPLICATION_ID — to
        // fully rebrand it, create your own Discord application at
        // discord.com/developers and swap the ID here.
        private const val APPLICATION_ID = "1271273225120125040"
        private const val APP_NAME: String = "0_o"
    }
}