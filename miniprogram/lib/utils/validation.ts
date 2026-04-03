import type { ValidationResult } from "../types/report"

export const DAILY_INPUT_LIMIT = 500
export const TEMPLATE_SECTION_LIMIT = 6

export function validateDailyRawInput(input: string): ValidationResult {
  if (input.length > DAILY_INPUT_LIMIT) {
    return {
      valid: false,
      reason: "日报原始输入不能超过500字"
    }
  }

  return { valid: true }
}

export function validateTemplateSections(sectionNames: string[]): ValidationResult {
  if (sectionNames.length > TEMPLATE_SECTION_LIMIT) {
    return {
      valid: false,
      reason: "最多只能添加 6 个栏目"
    }
  }

  const normalizedNames = sectionNames.map((name) => name.trim())
  const uniqueNames = new Set(normalizedNames)

  if (uniqueNames.size !== normalizedNames.length) {
    return {
      valid: false,
      reason: "栏目名称不能重复"
    }
  }

  return { valid: true }
}
