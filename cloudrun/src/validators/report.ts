import type { GeneratedReportPayload, ValidationResult } from "../types/report"

function validatePayloadShape(
  payload: GeneratedReportPayload,
  templateSections: string[]
): ValidationResult {
  if (!payload.title.trim()) {
    return {
      valid: false,
      reason: "标题不能为空"
    }
  }

  if (payload.sections.length !== templateSections.length) {
    return {
      valid: false,
      reason: "栏目数量与模板不一致"
    }
  }

  const sectionNames = payload.sections.map((section) => section.name)
  const matches = templateSections.every((name, index) => sectionNames[index] === name)

  if (!matches) {
    return {
      valid: false,
      reason: "栏目名称与模板不一致"
    }
  }

  const hasBadItems = payload.sections.some((section) => !Array.isArray(section.items))

  if (hasBadItems) {
    return {
      valid: false,
      reason: "栏目条目必须是数组"
    }
  }

  return { valid: true }
}

export function validateDailyGeneratedPayload(
  payload: GeneratedReportPayload,
  templateSections: string[]
): ValidationResult {
  return validatePayloadShape(payload, templateSections)
}

export function validateWeeklyGeneratedPayload(
  payload: GeneratedReportPayload,
  templateSections: string[]
): ValidationResult {
  return validatePayloadShape(payload, templateSections)
}
