import type { ReportDocument, ReportSection, TemplateSection, ValidationResult } from "../types/report"
import { formatDailyTitle, formatWeeklyTitle } from "../utils/date"

const COMPLETED_KEYWORDS = ["完成", "联调", "整理", "上线", "实现", "修复", "调整", "推进", "提交", "同步"]
const RISK_KEYWORDS = ["问题", "风险", "阻塞", "异常", "报错", "卡住", "权限", "延迟", "待确认"]
const PLAN_KEYWORDS = ["明天", "明日", "后续", "继续", "计划", "待推进", "下周", "跟进", "补充", "验证"]

function splitRawInput(rawInput: string): string[] {
  return rawInput
    .split(/[\n。！？；;，,]/)
    .map((item) => item.trim().replace(/^[，、,.\s]+|[，、,.\s]+$/g, ""))
    .filter(Boolean)
}

function hasAnyKeyword(input: string, keywords: string[]): boolean {
  return keywords.some((keyword) => input.includes(keyword))
}

function categorizeDailySentence(sentence: string): "risk" | "plan" | "completed" {
  if (hasAnyKeyword(sentence, PLAN_KEYWORDS)) {
    return "plan"
  }

  if (hasAnyKeyword(sentence, RISK_KEYWORDS)) {
    return "risk"
  }

  if (hasAnyKeyword(sentence, COMPLETED_KEYWORDS)) {
    return "completed"
  }

  return "completed"
}

function defaultEmptyItems(): string[] {
  return ["无"]
}

function createSection(name: string, order: number, items: string[]): ReportSection {
  return {
    name,
    order,
    items: items.length > 0 ? items : defaultEmptyItems()
  }
}

function getSectionCategory(name: string): "risk" | "plan" | "completed" {
  if (hasAnyKeyword(name, ["问题", "风险", "阻塞"])) {
    return "risk"
  }

  if (hasAnyKeyword(name, ["计划", "待推进", "安排", "跟进"])) {
    return "plan"
  }

  return "completed"
}

function normalizeItem(input: string): string {
  return input.replace(/[，。、；：,.!?！？\s]/g, "")
}

function uniqueItems(items: string[]): string[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeItem(item)

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function validateGeneratedDocument(
  document: ReportDocument,
  templateSections: TemplateSection[]
): ValidationResult {
  if (document.sections.length !== templateSections.length) {
    return {
      valid: false,
      reason: "生成结果与模板栏目数量不一致"
    }
  }

  const sectionNames = document.sections.map((section) => section.name)
  const templateNames = templateSections
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => section.name)

  const matches = templateNames.every((name, index) => name === sectionNames[index])

  if (!matches) {
    return {
      valid: false,
      reason: "生成结果与模板栏目名称不一致"
    }
  }

  const hasBadItems = document.sections.some((section) => !Array.isArray(section.items))

  if (hasBadItems) {
    return {
      valid: false,
      reason: "生成结果栏目条目格式不正确"
    }
  }

  return { valid: true }
}

export function generateDailyReportDraft(
  rawInput: string,
  templateSections: TemplateSection[],
  reportDate: string
): ReportDocument {
  const sentences = splitRawInput(rawInput)
  const completed: string[] = []
  const risks: string[] = []
  const plans: string[] = []

  sentences.forEach((sentence) => {
    const category = categorizeDailySentence(sentence)

    if (category === "plan") {
      plans.push(sentence)
      return
    }

    if (category === "risk") {
      risks.push(sentence)
      return
    }

    completed.push(sentence)
  })

  const sections = templateSections
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => {
      const category = getSectionCategory(section.name)

      if (category === "risk") {
        return createSection(section.name, section.order, uniqueItems(risks))
      }

      if (category === "plan") {
        return createSection(section.name, section.order, uniqueItems(plans))
      }

      return createSection(section.name, section.order, uniqueItems(completed))
    })

  return {
    title: formatDailyTitle(reportDate),
    sections
  }
}

function collectItemsByCategory(
  reports: ReportDocument[],
  category: "risk" | "plan" | "completed"
): string[] {
  return reports.flatMap((report) =>
    report.sections
      .filter((section) => getSectionCategory(section.name) === category)
      .flatMap((section) => section.items)
      .filter((item) => item !== "无")
  )
}

export function generateWeeklyReportDraft(
  reports: ReportDocument[],
  templateSections: TemplateSection[],
  year: number,
  week: number
): ReportDocument {
  const completedItems = uniqueItems(collectItemsByCategory(reports, "completed"))
  const riskItems = uniqueItems(collectItemsByCategory(reports, "risk"))
  const rawPlanItems = uniqueItems(collectItemsByCategory(reports, "plan"))
  const completedKeys = new Set(completedItems.map((item) => normalizeItem(item)))
  const planItems = rawPlanItems.filter((item) => !completedKeys.has(normalizeItem(item)))

  const sections = templateSections
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => {
      const category = getSectionCategory(section.name)

      if (category === "risk") {
        return createSection(section.name, section.order, riskItems)
      }

      if (category === "plan") {
        return createSection(section.name, section.order, planItems)
      }

      return createSection(section.name, section.order, completedItems)
    })

  return {
    title: formatWeeklyTitle(year, week),
    sections
  }
}
