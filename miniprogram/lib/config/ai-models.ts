export type AIModelKey = "deepseek" | "hunyuan"
export type AIScenario = "daily_generate" | "weekly_generate"

export interface AIModelPreset {
  provider: string
  model: string
  label: string
}

const MODEL_PRESETS: Record<AIModelKey, AIModelPreset> = {
  deepseek: {
    provider: "deepseek",
    model: "deepseek-v3.2",
    label: "DeepSeek"
  },
  hunyuan: {
    provider: "hunyuan-exp",
    model: "hunyuan-2.0-instruct-20251111",
    label: "腾讯混元"
  }
}

const SCENARIO_MODEL_KEYS: Record<AIScenario, AIModelKey> = {
  daily_generate: "deepseek",
  weekly_generate: "deepseek"
}

export function getScenarioModelPreset(scenario: AIScenario): AIModelPreset {
  return MODEL_PRESETS[SCENARIO_MODEL_KEYS[scenario]]
}

export function getModelPreset(modelKey: AIModelKey): AIModelPreset {
  return MODEL_PRESETS[modelKey]
}
