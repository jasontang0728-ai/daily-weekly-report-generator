export interface RuntimeConfig {
  cloudEnvId: string
  cloudServiceName: string
  useCloudDatabase: boolean
  useCloudRun: boolean
  requestTimeoutMs: number
}

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  cloudEnvId: "cloud1-7g772au1b225ae1b",
  cloudServiceName: "daily-weekly-report-api",
  useCloudDatabase: true,
  useCloudRun: true,
  requestTimeoutMs: 15000
}

export function getRuntimeConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  return {
    ...DEFAULT_RUNTIME_CONFIG,
    ...overrides
  }
}

export function isCloudDatabaseEnabled(config: RuntimeConfig): boolean {
  return config.useCloudDatabase && Boolean(config.cloudEnvId)
}

export function isCloudRunEnabled(config: RuntimeConfig): boolean {
  return config.useCloudRun && Boolean(config.cloudEnvId) && Boolean(config.cloudServiceName)
}
