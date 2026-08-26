package com.maxrave.simpmusic.ui.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/** Hosts the P15 "0_o sleeping moon" now-playing widget. */
class MoonWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = MoonWidgetProvider()
}
