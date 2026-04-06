import { describe, expect, test, vi } from "vitest"

import type { ReportDocument, TemplateSection } from "../../lib/types/report"
import {
  AIContentValidationError,
  generateDailyReport,
  generateDailyReportDraft,
  generateWeeklyReport,
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
  test("uses cloud ai when runtime config enables cloud ai", async () => {
    const generateText = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "AI daily report",
              sections: [
                { name: "今日完成", order: 1, items: ["完成真实 AI 接入"] },
                { name: "问题风险", order: 2, items: ["无"] },
                { name: "明日计划", order: 3, items: ["继续验证周报生成"] }
              ]
            })
          }
        }
      ]
    })

    const createModel = vi.fn().mockReturnValue({ generateText })

    const document = await generateDailyReport(
      {
        rawInput: "今天完成真实 AI 接入，明天继续验证周报生成。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-06"
      },
      {
        runtimeConfig: {
          cloudEnvId: "cloud1-7g772au1b225ae1b",
          useCloudAI: true,
          useCloudRun: false
        },
        createModel
      }
    )

    expect(createModel).toHaveBeenCalledWith("deepseek")
    expect(generateText).toHaveBeenCalledWith({
      model: "deepseek-v3.2",
      messages: expect.any(Array)
    })
    expect(document.title).toBe("AI daily report")
  })

  test("parses json wrapped in code fences from cloud ai", async () => {
    const generateText = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              "```json",
              JSON.stringify({
                title: "AI fenced report",
                sections: [
                  { name: "今日完成", order: 1, items: ["完成联调"] },
                  { name: "问题风险", order: 2, items: ["无"] },
                  { name: "明日计划", order: 3, items: ["继续验证"] }
                ]
              }),
              "```"
            ].join("\n")
          }
        }
      ]
    })

    const createModel = vi.fn().mockReturnValue({ generateText })

    const document = await generateDailyReport(
      {
        rawInput: "今天完成联调，明天继续验证。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-06"
      },
      {
        runtimeConfig: {
          cloudEnvId: "cloud1-7g772au1b225ae1b",
          useCloudAI: true,
          useCloudRun: false
        },
        createModel
      }
    )

    expect(document.title).toBe("AI fenced report")
    expect(document.sections).toHaveLength(3)
  })

  test("rejects cloud ai output that is valid json but does not match template", async () => {
    const generateText = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Invalid template output",
              sections: [
                { name: "完成事项", order: 1, items: ["完成联调"] }
              ]
            })
          }
        }
      ]
    })

    const createModel = vi.fn().mockReturnValue({ generateText })

    await expect(
      generateDailyReport(
        {
          rawInput: "今天完成联调。",
          templateSections: dailyTemplate,
          reportDate: "2026-04-06"
        },
        {
          runtimeConfig: {
            cloudEnvId: "cloud1-7g772au1b225ae1b",
            useCloudAI: true,
            useCloudRun: true,
            cloudServiceName: "report-ai"
          },
          createModel,
          callContainer: vi.fn()
        }
      )
    ).rejects.toBeInstanceOf(AIContentValidationError)
  })

  test("falls back to cloud run when cloud ai is unavailable", async () => {
    const callContainer = vi.fn().mockResolvedValue({
      data: {
        document: {
          title: "CloudRun fallback report",
          sections: [
            { name: "今日完成", order: 1, items: ["CloudRun 兜底成功"] },
            { name: "问题风险", order: 2, items: ["无"] },
            { name: "明日计划", order: 3, items: ["继续验证"] }
          ]
        }
      }
    })

    const createModel = vi.fn(() => {
      throw new Error("当前环境未提供 wx.cloud.extend.AI")
    })

    const document = await generateDailyReport(
      {
        rawInput: "今天完成联调，明天继续验证。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-06"
      },
      {
        runtimeConfig: {
          cloudEnvId: "cloud1-7g772au1b225ae1b",
          cloudServiceName: "report-ai",
          useCloudAI: true,
          useCloudRun: true
        },
        createModel,
        callContainer
      }
    )

    expect(callContainer).toHaveBeenCalled()
    expect(document.title).toBe("CloudRun fallback report")
  })

  test("falls back to cloud run when cloud ai returns empty content", async () => {
    const callContainer = vi.fn().mockResolvedValue({
      data: {
        document: {
          title: "CloudRun empty fallback",
          sections: [
            { name: "今日完成", order: 1, items: ["回退成功"] },
            { name: "问题风险", order: 2, items: ["无"] },
            { name: "明日计划", order: 3, items: ["继续验证"] }
          ]
        }
      }
    })

    const createModel = vi.fn().mockReturnValue({
      generateText: vi.fn().mockResolvedValue({ choices: [] })
    })

    const document = await generateDailyReport(
      {
        rawInput: "今天完成联调，明天继续验证。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-06"
      },
      {
        runtimeConfig: {
          cloudEnvId: "cloud1-7g772au1b225ae1b",
          cloudServiceName: "report-ai",
          useCloudAI: true,
          useCloudRun: true
        },
        createModel,
        callContainer
      }
    )

    expect(callContainer).toHaveBeenCalled()
    expect(document.sections[0].items[0]).toBe("回退成功")
  })

  test("calls cloud run through callContainer when runtime config enables cloud mode", async () => {
    const callContainer = vi.fn().mockResolvedValue({
      data: {
        document: {
          title: "2026年4月4日日报",
          sections: [
            { name: "今日完成", order: 1, items: ["完成真实接入"] },
            { name: "问题风险", order: 2, items: ["无"] },
            { name: "明日计划", order: 3, items: ["补充开发者工具验证"] }
          ]
        }
      }
    })

    const document = await generateDailyReport(
      {
        rawInput: "今天完成真实接入，明天补充开发者工具验证。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-04"
      },
      {
        runtimeConfig: {
          cloudEnvId: "test-123",
          cloudServiceName: "report-ai",
          useCloudRun: true,
          useCloudAI: false
        },
        callContainer
      }
    )

    expect(callContainer).toHaveBeenCalledWith({
      config: { env: "test-123" },
      path: "/api/reports/daily/generate",
      method: "POST",
      header: {
        "X-WX-SERVICE": "report-ai",
        "content-type": "application/json"
      },
      data: {
        rawInput: "今天完成真实接入，明天补充开发者工具验证。",
        templateSections: dailyTemplate,
        reportDate: "2026-04-04"
      }
    })
    expect(document.title).toBe("2026年4月4日日报")
  })

  test("falls back to the local draft generator when cloud run is not configured", async () => {
    const document = await generateWeeklyReport(
      {
        reports: [
          makeDailyDocument(
            "2026年4月3日日报",
            ["完成 CloudBase 联调"],
            ["无"],
            ["补充 acceptance checklist"]
          )
        ],
        templateSections: weeklyTemplate,
        year: 2026,
        week: 14
      },
      {
        runtimeConfig: {
          cloudEnvId: "",
          cloudServiceName: "",
          useCloudAI: false,
          useCloudRun: false
        }
      }
    )

    expect(document.title).toBe("2026年第14周周报")
    expect(document.sections).toHaveLength(3)
  })

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
        sections: [{ name: "今日完成", order: 1, items: ["完成日报页面"] }]
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
