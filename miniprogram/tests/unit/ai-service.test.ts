import { describe, expect, test } from "vitest"

import type { ReportDocument, TemplateSection } from "../../lib/types/report"
import {
  generateDailyReportDraft,
  generateWeeklyReportDraft,
  validateGeneratedDocument
} from "../../lib/services/ai"

const dailyTemplate: TemplateSection[] = [
  { id: "s1", name: "今日完成", order: 1 },
  { id: "s2", name: "问题风险", order: 2 },
  { id: "s3", name: "明日计划", order: 3 }
]

const weeklyTemplate: TemplateSection[] = [
  { id: "s1", name: "本周完成", order: 1 },
  { id: "s2", name: "问题风险", order: 2 },
  { id: "s3", name: "下周计划", order: 3 }
]

function makeDailyDocument(
  title: string,
  completed: string[],
  risks: string[],
  plans: string[]
): ReportDocument {
  return {
    title,
    sections: [
      { name: "今日完成", order: 1, items: completed },
      { name: "问题风险", order: 2, items: risks },
      { name: "明日计划", order: 3, items: plans }
    ]
  }
}

describe("ai service", () => {
  test("builds a daily draft that matches the active template sections", () => {
    const draft = generateDailyReportDraft(
      "今天完成登录页调整，联调了两个接口，遇到权限报错，明天继续测试登录流程。",
      dailyTemplate,
      "2026-04-04"
    )

    expect(draft.title).toBe("2026年4月4日日报")
    expect(draft.sections.map((section) => section.name)).toEqual([
      "今日完成",
      "问题风险",
      "明日计划"
    ])
    expect(draft.sections[0].items[0]).toContain("登录页")
    expect(draft.sections[1].items[0]).toContain("权限")
    expect(draft.sections[2].items[0]).toContain("测试")
  })

  test("rejects generated documents that do not match template structure", () => {
    const result = validateGeneratedDocument(
      {
        title: "2026年4月4日日报",
        sections: [{ name: "今日完成", order: 1, items: ["完成日报页"] }]
      },
      dailyTemplate
    )

    expect(result.valid).toBe(false)
  })

  test("excludes items from next week plan when they are completed later in the same week", () => {
    const draft = generateWeeklyReportDraft(
      [
        makeDailyDocument(
          "2026年4月1日日报",
          ["完成登录页调整"],
          ["定位登录接口权限问题"],
          ["继续联调权限接口"]
        ),
        makeDailyDocument(
          "2026年4月2日日报",
          ["继续联调权限接口", "整理测试用例"],
          [],
          ["整理测试用例", "补充异常场景验证"]
        )
      ],
      weeklyTemplate,
      2026,
      14
    )

    const nextPlanSection = draft.sections.find((section) => section.name === "下周计划")

    expect(draft.title).toBe("2026年第14周周报")
    expect(nextPlanSection?.items).not.toContain("继续联调权限接口")
    expect(nextPlanSection?.items).toContain("补充异常场景验证")
  })
})
