package com.meowtec.lansend_launcher

import app.tauri.plugin.PluginManager

class MainActivity : TauriActivity() {
  var pluginManager: PluginManager = PluginManager(this)
}
