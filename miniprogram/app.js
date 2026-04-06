"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = require("./lib/config/runtime");
App({
    globalData: {
        currentUserOpenId: "demo-openid",
        runtimeConfig: (0, runtime_1.getRuntimeConfig)(),
        cloudReady: false
    },
    onLaunch() {
        const runtimeConfig = (0, runtime_1.getRuntimeConfig)();
        const cloudApi = typeof wx !== "undefined" ? wx.cloud : undefined;
        const shouldInitCloud = (0, runtime_1.isCloudDatabaseEnabled)(runtimeConfig) || (0, runtime_1.isCloudRunEnabled)(runtimeConfig);
        this.globalData.runtimeConfig = runtimeConfig;
        if (!shouldInitCloud || !cloudApi || typeof cloudApi.init !== "function") {
            return;
        }
        cloudApi.init({
            env: runtimeConfig.cloudEnvId,
            traceUser: true
        });
        this.globalData.cloudReady = true;
        this.globalData.currentUserOpenId = "cloud-user";
    }
});
