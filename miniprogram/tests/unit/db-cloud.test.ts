import { describe, expect, test } from "vitest"

import { createCloudDbRepository, type CloudRecordGateway } from "../../lib/services/db-cloud"
import type { ReportDocument, TemplateSection } from "../../lib/types/report"

interface GatewayState {
  dailyTemplates: Array<Record<string, unknown>>
  weeklyTemplates: Array<Record<string, unknown>>
  dailyReports: Array<Record<string, unknown>>
  weeklyReports: Array<Record<string, unknown>>
}

function createGateway(initial: Partial<GatewayState> = {}): {
  gateway: CloudRecordGateway
  state: GatewayState
} {
  const state: GatewayState = {
    dailyTemplates: initial.dailyTemplates ?? [],
    weeklyTemplates: initial.weeklyTemplates ?? [],
    dailyReports: initial.dailyReports ?? [],
    weeklyReports: initial.weeklyReports ?? []
  }

  const gateway: CloudRecordGateway = {
    async list(collectionName) {
      return [...state[collectionName]]
    },
    async findOne(collectionName, matcher) {
      return state[collectionName].find((record) => matcher(record)) ?? null
    },
    async upsert(collectionName, matcher, nextRecord) {
      const index = state[collectionName].findIndex((record) => matcher(record))

      if (index >= 0) {
        const currentId = state[collectionName][index]._id
        state[collectionName][index] = {
          ...nextRecord,
          _id: currentId
        }
        return currentId as string
      }

      const id = `${collectionName}-${state[collectionName].length + 1}`
      state[collectionName].push({
        ...nextRecord,
        _id: id
      })
      return id
    }
  }

  return { gateway, state }
}

const dailyTemplateSections: TemplateSection[] = [
  { id: "daily-1", name: "今日完成", order: 1 },
  { id: "daily-2", name: "问题风险", order: 2 },
  { id: "daily-3", name: "明日计划", order: 3 }
]

function makeDailyDocument(title: string): ReportDocument {
  return {
    title,
    sections: [
      { name: "今日完成", order: 1, items: ["完成真实接入联调"] },
      { name: "问题风险", order: 2, items: ["无"] },
      { name: "明日计划", order: 3, items: ["补充验收验证"] }
    ]
  }
}

describe("cloud db repository", () => {
  test("returns default template when cloud collection is empty", async () => {
    const { gateway } = createGateway()
    const repository = createCloudDbRepository(gateway)

    const template = await repository.getDailyTemplate()

    expect(template.sections).toEqual(dailyTemplateSections)
  })

  test("upserts a daily report into cloud records", async () => {
    const { gateway, state } = createGateway({
      dailyReports: [
        {
          _id: "dailyReports-1",
          reportDate: "2026-04-04",
          title: "旧日报",
          sections: [],
          finalText: "旧内容",
          templateSnapshot: dailyTemplateSections,
          updatedAt: "2026-04-04T08:00:00.000Z"
        }
      ]
    })
    const repository = createCloudDbRepository(gateway)

    const saved = await repository.saveDailyReport(
      "2026-04-04",
      makeDailyDocument("2026年4月4日日报"),
      dailyTemplateSections
    )

    expect(saved.id).toBe("dailyReports-1")
    expect(state.dailyReports).toHaveLength(1)
    expect(state.dailyReports[0].title).toBe("2026年4月4日日报")
  })

  test("lists only current week daily reports from cloud records", async () => {
    const { gateway } = createGateway({
      dailyReports: [
        {
          _id: "dailyReports-1",
          reportDate: "2026-04-01",
          title: "2026年4月1日日报",
          sections: makeDailyDocument("2026年4月1日日报").sections,
          finalText: "A",
          templateSnapshot: dailyTemplateSections,
          updatedAt: "2026-04-01T18:00:00.000Z"
        },
        {
          _id: "dailyReports-2",
          reportDate: "2026-03-27",
          title: "2026年3月27日日报",
          sections: makeDailyDocument("2026年3月27日日报").sections,
          finalText: "B",
          templateSnapshot: dailyTemplateSections,
          updatedAt: "2026-03-27T18:00:00.000Z"
        }
      ]
    })
    const repository = createCloudDbRepository(gateway)

    const reports = await repository.listCurrentWeekDailyReports("2026-04-04")

    expect(reports).toHaveLength(1)
    expect(reports[0].reportDate).toBe("2026-04-01")
  })
})
