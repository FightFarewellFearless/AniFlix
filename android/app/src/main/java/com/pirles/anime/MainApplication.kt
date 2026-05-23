package com.pirles.anime
import android.content.res.Configuration
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ExpoReactHostFactory

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactPackage

import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.common.ReleaseLevel

import org.wonday.orientation.OrientationActivityLifecycle

import com.nitrodns.NitroOkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    ExpoReactHostFactory.getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        }
    )
  }

  override fun onCreate() {
    DefaultNewArchitectureEntryPoint.releaseLevel = ReleaseLevel.EXPERIMENTAL
    super.onCreate()
    // Inject Nitro DNS factory for global fetch/XHR interception
    OkHttpClientProvider.setOkHttpClientFactory(NitroOkHttpClientFactory())
    loadReactNative(this)
    registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance())
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
