import { DAILY_PROMPT_CONTRACT } from "../prompts/daily"
import { buildDailyDraft } from "../mock-generator"
import type { DailyGenerateRequest } from "../types/report"
import { validateDailyGeneratedPayload } from "../validators/report"

function isDailyGenerateRequest(input: unknown): input is DailyGenerateRequest {
  if (!input || typeof input !== "object") {
    return false
  }

  const current = input as Record<string, unknown>
  return typeof current.rawInput === "string" &&
    typeof current.reportDate === "string" &&
    Array.isArray(current.templateSections) &&
    current.templateSections.length > 0
}

export function validateDailyRequest(input: unknown): string | null {
  if (!isDailyGenerateRequest(input)) {
    return "request must include rawInput, reportDate, and templateSections"
  }

  if (!input.reportDate.trim()) {
    return "reportDate is required"
  }

  if (!input.rawInput.trim()) {
    return "rawInput is required"
  }

  return null
}

export function generateDailyRoute(input: DailyGenerateRequest) {
  const document = buildDailyDraft(input)
  const validation = validateDailyGeneratedPayload(
    document,
    input.templateSections
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((section) => section.name)
  )

  return {
    prompt: DAILY_PROMPT_CONTRACT,
    validation,
    document: validation.valid ? document : null
  }
}
