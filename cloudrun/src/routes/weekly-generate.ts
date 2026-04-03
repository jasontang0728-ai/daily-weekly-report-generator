import { WEEKLY_PROMPT_CONTRACT } from "../prompts/weekly"
import type { GeneratedReportPayload } from "../types/report"
import { validateWeeklyGeneratedPayload } from "../validators/report"

interface WeeklyGenerateInput {
  templateSections: string[]
  modelOutput: GeneratedReportPayload
}

export function generateWeeklyRoute(input: WeeklyGenerateInput) {
  const validation = validateWeeklyGeneratedPayload(input.modelOutput, input.templateSections)

  return {
    prompt: WEEKLY_PROMPT_CONTRACT,
    validation,
    payload: validation.valid ? input.modelOutput : null
  }
}
