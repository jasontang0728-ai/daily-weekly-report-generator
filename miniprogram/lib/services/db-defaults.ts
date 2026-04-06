import type { TemplateProfile, TemplateSection } from "../types/report"

export const DEFAULT_DAILY_TEMPLATE_SECTIONS: TemplateSection[] = [
  { id: "daily-1", name: "今日完成", order: 1 },
  { id: "daily-2", name: "问题风险", order: 2 },
  { id: "daily-3", name: "明日计划", order: 3 }
]

export const DEFAULT_WEEKLY_TEMPLATE_SECTIONS: TemplateSection[] = [
  { id: "weekly-1", name: "本周完成", order: 1 },
  { id: "weekly-2", name: "问题风险", order: 2 },
  { id: "weekly-3", name: "下周计划", order: 3 }
]

export function cloneTemplateSections(sections: TemplateSection[]): TemplateSection[] {
  return sections.map((section) => ({ ...section }))
}

export function createDefaultTemplateProfile(kind: "daily" | "weekly"): TemplateProfile {
  return {
    kind,
    sections: cloneTemplateSections(
      kind === "daily" ? DEFAULT_DAILY_TEMPLATE_SECTIONS : DEFAULT_WEEKLY_TEMPLATE_SECTIONS
    ),
    updatedAt: new Date().toISOString()
  }
}
