import { getRuntimeConfig, isCloudDatabaseEnabled, isCloudRunEnabled } from "./lib/config/runtime"

App<IAppOption>({
  globalData: {
    currentUserOpenId: "demo-openid",
    runtimeConfig: getRuntimeConfig(),
    cloudReady: false
  },

  onLaunch() {
    const runtimeConfig = getRuntimeConfig()
    const cloudApi = typeof wx !== "undefined" ? wx.cloud : undefined
    const shouldInitCloud = isCloudDatabaseEnabled(runtimeConfig) || isCloudRunEnabled(runtimeConfig)

    this.globalData.runtimeConfig = runtimeConfig

    if (!shouldInitCloud || !cloudApi || typeof cloudApi.init !== "function") {
      return
    }

    cloudApi.init({
      env: runtimeConfig.cloudEnvId,
      traceUser: true
    })

    this.globalData.cloudReady = true
    this.globalData.currentUserOpenId = "cloud-user"
  }
})
