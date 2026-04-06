import { getRuntimeConfig, isCloudDatabaseEnabled } from "../config/runtime"
import type {
  DailyReportRecord,
  HistoryListItem,
  ReportDocument,
  TemplateProfile,
  TemplateSection,
  WeeklyReportRecord
} from "../types/report"
import { createCloudDbRepository, type CloudRecordGateway } from "./db-cloud"
import { createLocalDbRepository, type ReportRepository } from "./db-local"

function createWxCloudGateway(envId: string): CloudRecordGateway {
  const cloudApi = typeof wx === "undefined" ? undefined : wx.cloud

  if (!cloudApi || typeof cloudApi.database !== "function") {
    throw new Error("当前环境未提供微信云开发数据库能力")
  }

  const database = cloudApi.database({ env: envId }) as {
    collection(name: string): {
      get(): Promise<{ data: Record<string, unknown>[] }>
      add(options: { data: WechatMiniprogram.IAnyObject }): Promise<{ _id: string }>
      doc(id: string): {
        update(options: { data: WechatMiniprogram.IAnyObject }): Promise<unknown>
      }
    }
  }

  return {
    async list(collectionName) {
      const result = await database.collection(collectionName).get()
      return result.data
    },

    async findOne(collectionName, matcher) {
      const result = await database.collection(collectionName).get()
      const record = result.data.find((item) => matcher(item))
      return record || null
    },

    async upsert(collectionName, matcher, nextRecord) {
      const collection = database.collection(collectionName)
      const currentRecords = (await collection.get()).data
      const existing = currentRecords.find((record) => matcher(record))

      if (existing && typeof existing._id === "string") {
        await collection.doc(existing._id).update({
          data: nextRecord as WechatMiniprogram.IAnyObject
        })
        return existing._id
      }

      const created = await collection.add({
        data: nextRecord as WechatMiniprogram.IAnyObject
      })
      return created._id
    }
  }
}

function getRepository(): ReportRepository {
  const runtimeConfig = getRuntimeConfig()

  if (isCloudDatabaseEnabled(runtimeConfig)) {
    try {
      return createCloudDbRepository(createWxCloudGateway(runtimeConfig.cloudEnvId))
    } catch (error) {
      console.warn("Cloud database unavailable, fallback to local repository.", error)
    }
  }

  return createLocalDbRepository()
}

export function getCurrentUserOpenId(): string {
  if (typeof getApp === "function") {
    return getApp<IAppOption>().globalData.currentUserOpenId || "demo-openid"
  }

  return "demo-openid"
}

export async function getDailyTemplate(): Promise<TemplateProfile> {
  return getRepository().getDailyTemplate()
}

export async function saveDailyTemplate(sections: TemplateSection[]): Promise<TemplateProfile> {
  return getRepository().saveDailyTemplate(sections)
}

export async function getWeeklyTemplate(): Promise<TemplateProfile> {
  return getRepository().getWeeklyTemplate()
}

export async function saveWeeklyTemplate(sections: TemplateSection[]): Promise<TemplateProfile> {
  return getRepository().saveWeeklyTemplate(sections)
}

export async function getDailyReportByDate(reportDate: string): Promise<DailyReportRecord | null> {
  return getRepository().getDailyReportByDate(reportDate)
}

export async function saveDailyReport(
  reportDate: string,
  document: ReportDocument,
  templateSnapshot: TemplateSection[]
): Promise<DailyReportRecord> {
  return getRepository().saveDailyReport(reportDate, document, templateSnapshot)
}

export async function listDailyHistory(): Promise<HistoryListItem[]> {
  return getRepository().listDailyHistory()
}

export async function getWeeklyReportByWeekKey(weekKey: string): Promise<WeeklyReportRecord | null> {
  return getRepository().getWeeklyReportByWeekKey(weekKey)
}

export async function saveWeeklyReport(
  weekKey: string,
  year: number,
  week: number,
  document: ReportDocument,
  templateSnapshot: TemplateSection[],
  sourceDailyIds: string[]
): Promise<WeeklyReportRecord> {
  return getRepository().saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds)
}

export async function listWeeklyHistory(): Promise<HistoryListItem[]> {
  return getRepository().listWeeklyHistory()
}

export async function listCurrentWeekDailyReports(referenceDate?: string): Promise<DailyReportRecord[]> {
  return getRepository().listCurrentWeekDailyReports(referenceDate)
}

export async function getHistoryDetail(
  type: "daily" | "weekly",
  id: string
): Promise<DailyReportRecord | WeeklyReportRecord | null> {
  return getRepository().getHistoryDetail(type, id)
}
