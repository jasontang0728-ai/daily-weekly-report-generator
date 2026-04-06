import type {
  DailyGenerateRequest,
  ReportDocument,
  TemplateSection,
  WeeklyGenerateRequest
} from "./types/report"

const COMPLETED_KEYWORDS = ["完成", "联调", "整理", "上线", "实现", "修复", "调整", "推进", "提交", "同步"]
const RISK_KEYWORDS = ["问题", "风险", "阻塞", "异常", "报错", "卡住", "权限", "延迟", "待确认"]
const PLAN_KEYWORDS = ["明天", "明日", "后续", "继续", "计划", "待推进", "下周", "跟进", "补充", "验证"]

function formatDailyTitle(reportDate: string): string {
  const [year, month, day] = reportDate.split("-").map((part) => Number(part))
  return `${year}年${month}月${day}日日报`
}

function formatWeeklyTitle(year: number, week: number): string {
  return `${year}年第${week}周周报`
}

function splitRawInput(rawInput: string): string[] {
  return rawInput
    .split(/[\n。！？；;，]/)
    .map((item) => item.trim().replace(/^[，、.\s]+|[，、.\s]+$/g, ""))
    .filter(Boolean)
}

function hasAnyKeyword(input: string, keywords: string[]): boolean {
  return keywords.some((keyword) => input.includes(keyword))
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

function normalizeItem(input: string): string {
  return input.replace(/[，。、；;,.!?！？\s]/g, "")
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

function createSection(name: string, order: number, items: string[]): ReportDocument["sections"][number] {
  return {
    name,
    order,
    items: items.length > 0 ? items : defaultEmptyItems()
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

function buildSectionsFromGroups(
  templateSections: TemplateSection[],
  completedItems: string[],
  riskItems: string[],
  planItems: string[]
): ReportDocument["sections"] {
  return templateSections
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
}

export function buildDailyDraft(request: DailyGenerateRequest): ReportDocument {
  const completed: string[] = []
  const risks: string[] = []
  const plans: string[] = []

  splitRawInput(request.rawInput).forEach((sentence) => {
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

  return {
    title: formatDailyTitle(request.reportDate),
    sections: buildSectionsFromGroups(
      request.templateSections,
      uniqueItems(completed),
      uniqueItems(risks),
      uniqueItems(plans)
    )
  }
}

export function buildWeeklyDraft(request: WeeklyGenerateRequest): ReportDocument {
  const completedItems = uniqueItems(collectItemsByCategory(request.reports, "completed"))
  const riskItems = uniqueItems(collectItemsByCategory(request.reports, "risk"))
  const rawPlanItems = uniqueItems(collectItemsByCategory(request.reports, "plan"))
  const completedKeys = new Set(completedItems.map((item) => normalizeItem(item)))
  const planItems = rawPlanItems.filter((item) => !completedKeys.has(normalizeItem(item)))

  return {
    title: formatWeeklyTitle(request.year, request.week),
    sections: buildSectionsFromGroups(request.templateSections, completedItems, riskItems, planItems)
  }
}
