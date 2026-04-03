import { DAILY_PROMPT_CONTRACT } from "../prompts/daily"
import type { GeneratedReportPayload } from "../types/report"
import { validateDailyGeneratedPayload } from "../validators/report"

interface DailyGenerateInput {
  templateSections: string[]
  modelOutput: GeneratedReportPayload
}

export function generateDailyRoute(input: DailyGenerateInput) {
  const validation = validateDailyGeneratedPayload(input.modelOutput, input.templateSections)

  return {
    prompt: DAILY_PROMPT_CONTRACT,
    validation,
    payload: validation.valid ? input.modelOutput : null
  }
}
