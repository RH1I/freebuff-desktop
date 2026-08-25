package com.maxrave.simpmusic.utils

import org.jetbrains.compose.resources.getString
import simpmusic.composeapp.generated.resources.Res
import simpmusic.composeapp.generated.resources.explicit_content_blocked
import simpmusic.composeapp.generated.resources.player_error_sign_in_required
import simpmusic.composeapp.generated.resources.new_albums
import simpmusic.composeapp.generated.resources.new_singles
import simpmusic.composeapp.generated.resources.this_app_needs_to_access_your_notification
import simpmusic.composeapp.generated.resources.time_out_check_internet_connection_or_change_piped_instance_in_settings

object ComposeResUtils {
    suspend fun getResString(
        type: StringType,
        vararg format: String,
    ): String =
        when (type) {
            StringType.EXPLICIT_CONTENT_BLOCKED -> {
                getString(Res.string.explicit_content_blocked)
            }

            StringType.NOTIFICATION_REQUEST -> {
                getString(Res.string.this_app_needs_to_access_your_notification)
            }

            StringType.TIME_OUT_ERROR -> {
                getString(Res.string.time_out_check_internet_connection_or_change_piped_instance_in_settings, *format)
            }

            StringType.PLAYER_ERROR_SIGN_IN_REQUIRED -> {
                getString(Res.string.player_error_sign_in_required)
            }

            StringType.NEW_SINGLES -> {
                getString(Res.string.new_singles)
            }

            StringType.NEW_ALBUMS -> {
                getString(Res.string.new_albums)
            }
        }

    enum class StringType {
        EXPLICIT_CONTENT_BLOCKED,
        NOTIFICATION_REQUEST,
        TIME_OUT_ERROR,
        PLAYER_ERROR_SIGN_IN_REQUIRED,
        NEW_SINGLES,
        NEW_ALBUMS,
    }
}