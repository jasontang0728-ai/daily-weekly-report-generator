declare global {
  interface IAppOption {
    globalData: {
      currentUserOpenId: string
      runtimeConfig: {
        cloudEnvId: string
        cloudServiceName: string
        useCloudDatabase: boolean
        useCloudRun: boolean
        useCloudAI: boolean
        requestTimeoutMs: number
      }
      cloudReady: boolean
    }
  }
}

export {}
