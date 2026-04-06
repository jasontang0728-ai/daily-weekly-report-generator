import { WEEKLY_PROMPT_CONTRACT } from "../prompts/weekly"
import { buildWeeklyDraft } from "../mock-generator"
import type { WeeklyGenerateRequest } from "../types/report"
import { validateWeeklyGeneratedPayload } from "../validators/report"

function isWeeklyGenerateRequest(input: unknown): input is WeeklyGenerateRequest {
  if (!input || typeof input !== "object") {
    return false
  }

  const current = input as Record<string, unknown>
  return Array.isArray(current.reports) &&
    typeof current.year === "number" &&
    typeof current.week === "number" &&
    Array.isArray(current.templateSections) &&
    current.templateSections.length > 0
}

export function validateWeeklyRequest(input: unknown): string | null {
  if (!isWeeklyGenerateRequest(input)) {
    return "request must include reports, year, week, and templateSections"
  }

  if (input.reports.length === 0) {
    return "reports must not be empty"
  }

  return null
}

export function generateWeeklyRoute(input: WeeklyGenerateRequest) {
  const document = buildWeeklyDraft(input)
  const validation = validateWeeklyGeneratedPayload(
    document,
    input.templateSections
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((section) => section.name)
  )

  return {
    prompt: WEEKLY_PROMPT_CONTRACT,
    validation,
    document: validation.valid ? document : null
  }
}
