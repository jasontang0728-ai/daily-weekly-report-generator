import type {
  DailyReportRecord,
  HistoryListItem,
  ReportDocument,
  TemplateProfile,
  TemplateSection,
  WeeklyReportRecord
} from "../types/report"
import { getTodayDateKey, getWeekKey } from "../utils/date"
import { renderReportDocument } from "../utils/render"
import {
  cloneTemplateSections,
  createDefaultTemplateProfile
} from "./db-defaults"

interface LocalDatabaseState {
  dailyTemplate: TemplateProfile
  weeklyTemplate: TemplateProfile
  dailyReports: DailyReportRecord[]
  weeklyReports: WeeklyReportRecord[]
}

export interface ReportRepository {
  getDailyTemplate(): Promise<TemplateProfile>
  saveDailyTemplate(sections: TemplateSection[]): Promise<TemplateProfile>
  getWeeklyTemplate(): Promise<TemplateProfile>
  saveWeeklyTemplate(sections: TemplateSection[]): Promise<TemplateProfile>
  getDailyReportByDate(reportDate: string): Promise<DailyReportRecord | null>
  saveDailyReport(
    reportDate: string,
    document: ReportDocument,
    templateSnapshot: TemplateSection[]
  ): Promise<DailyReportRecord>
  listDailyHistory(): Promise<HistoryListItem[]>
  getWeeklyReportByWeekKey(weekKey: string): Promise<WeeklyReportRecord | null>
  saveWeeklyReport(
    weekKey: string,
    year: number,
    week: number,
    document: ReportDocument,
    templateSnapshot: TemplateSection[],
    sourceDailyIds: string[]
  ): Promise<WeeklyReportRecord>
  listWeeklyHistory(): Promise<HistoryListItem[]>
  listCurrentWeekDailyReports(referenceDate?: string): Promise<DailyReportRecord[]>
  getHistoryDetail(type: "daily" | "weekly", id: string): Promise<DailyReportRecord | WeeklyReportRecord | null>
}

const STORAGE_KEY = "daily-weekly-report-generator:local-db"
const memoryStorage = new Map<string, string>()

function nowIso(): string {
  return new Date().toISOString()
}

function cloneReportSections(document: ReportDocument): ReportDocument["sections"] {
  return document.sections.map((section) => ({
    ...section,
    items: [...section.items]
  }))
}

function createDemoState(): LocalDatabaseState {
  const dailyTemplate = createDefaultTemplateProfile("daily")
  const weeklyTemplate = createDefaultTemplateProfile("weekly")

  const dailyReports: DailyReportRecord[] = [
    {
      id: "daily-2026-04-01",
      reportDate: "2026-04-01",
      title: "2026年4月1日日报",
      sections: [
        { name: "今日完成", order: 1, items: ["完成登录页样式调整", "推进登录接口联调"] },
        { name: "问题风险", order: 2, items: ["定位登录接口权限异常"] },
        { name: "明日计划", order: 3, items: ["继续联调权限接口"] }
      ],
      finalText: "",
      templateSnapshot: cloneTemplateSections(dailyTemplate.sections),
      updatedAt: nowIso()
    },
    {
      id: "daily-2026-04-02",
      reportDate: "2026-04-02",
      title: "2026年4月2日日报",
      sections: [
        { name: "今日完成", order: 1, items: ["继续联调权限接口", "整理测试用例"] },
        { name: "问题风险", order: 2, items: ["无"] },
        { name: "明日计划", order: 3, items: ["补充异常场景验证"] }
      ],
      finalText: "",
      templateSnapshot: cloneTemplateSections(dailyTemplate.sections),
      updatedAt: nowIso()
    }
  ].map((report) => ({
    ...report,
    finalText: renderReportDocument(report)
  }))

  const weeklyReports: WeeklyReportRecord[] = [
    {
      id: "weekly-2026-W13",
      weekKey: "2026-W13",
      year: 2026,
      week: 13,
      title: "2026年第13周周报",
      sections: [
        { name: "本周完成", order: 1, items: ["完成产品需求梳理并确定阶段一模板能力"] },
        { name: "问题风险", order: 2, items: ["无"] },
        { name: "下周计划", order: 3, items: ["启动小程序工作台和云接入实现"] }
      ],
      finalText: "",
      sourceDailyIds: [],
      templateSnapshot: cloneTemplateSections(weeklyTemplate.sections),
      updatedAt: nowIso()
    }
  ].map((report) => ({
    ...report,
    finalText: renderReportDocument(report)
  }))

  return {
    dailyTemplate,
    weeklyTemplate,
    dailyReports,
    weeklyReports
  }
}

function hasWxStorage(): boolean {
  return typeof wx !== "undefined" && typeof wx.getStorageSync === "function"
}

function readStorage(): string | undefined {
  if (hasWxStorage()) {
    const value = wx.getStorageSync(STORAGE_KEY)
    return typeof value === "string" ? value : undefined
  }

  return memoryStorage.get(STORAGE_KEY)
}

function writeStorage(value: string): void {
  if (hasWxStorage()) {
    wx.setStorageSync(STORAGE_KEY, value)
    return
  }

  memoryStorage.set(STORAGE_KEY, value)
}

function loadState(): LocalDatabaseState {
  const raw = readStorage()

  if (!raw) {
    const seeded = createDemoState()
    writeStorage(JSON.stringify(seeded))
    return seeded
  }

  return JSON.parse(raw) as LocalDatabaseState
}

function saveState(state: LocalDatabaseState): void {
  writeStorage(JSON.stringify(state))
}

export function createLocalDbRepository(): ReportRepository {
  return {
    async getDailyTemplate() {
      return loadState().dailyTemplate
    },

    async saveDailyTemplate(sections) {
      const state = loadState()
      const profile: TemplateProfile = {
        kind: "daily",
        sections: cloneTemplateSections(sections),
        updatedAt: nowIso()
      }

      state.dailyTemplate = profile
      saveState(state)

      return profile
    },

    async getWeeklyTemplate() {
      return loadState().weeklyTemplate
    },

    async saveWeeklyTemplate(sections) {
      const state = loadState()
      const profile: TemplateProfile = {
        kind: "weekly",
        sections: cloneTemplateSections(sections),
        updatedAt: nowIso()
      }

      state.weeklyTemplate = profile
      saveState(state)

      return profile
    },

    async getDailyReportByDate(reportDate) {
      const report = loadState().dailyReports.find((item) => item.reportDate === reportDate)
      return report || null
    },

    async saveDailyReport(reportDate, document, templateSnapshot) {
      const state = loadState()
      const nextRecord: DailyReportRecord = {
        id: `daily-${reportDate}`,
        reportDate,
        title: document.title,
        sections: cloneReportSections(document),
        finalText: renderReportDocument(document),
        templateSnapshot: cloneTemplateSections(templateSnapshot),
        updatedAt: nowIso()
      }

      state.dailyReports = state.dailyReports.filter((report) => report.reportDate !== reportDate)
      state.dailyReports.push(nextRecord)
      state.dailyReports.sort((left, right) => right.reportDate.localeCompare(left.reportDate))
      saveState(state)

      return nextRecord
    },

    async listDailyHistory() {
      return loadState().dailyReports
        .slice()
        .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
        .map((report) => ({
          id: report.id,
          title: report.title,
          dateLabel: report.reportDate,
          type: "daily" as const
        }))
    },

    async getWeeklyReportByWeekKey(weekKey) {
      const report = loadState().weeklyReports.find((item) => item.weekKey === weekKey)
      return report || null
    },

    async saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds) {
      const state = loadState()
      const nextRecord: WeeklyReportRecord = {
        id: `weekly-${weekKey}`,
        weekKey,
        year,
        week,
        title: document.title,
        sections: cloneReportSections(document),
        finalText: renderReportDocument(document),
        sourceDailyIds: [...sourceDailyIds],
        templateSnapshot: cloneTemplateSections(templateSnapshot),
        updatedAt: nowIso()
      }

      state.weeklyReports = state.weeklyReports.filter((report) => report.weekKey !== weekKey)
      state.weeklyReports.push(nextRecord)
      state.weeklyReports.sort((left, right) => right.weekKey.localeCompare(left.weekKey))
      saveState(state)

      return nextRecord
    },

    async listWeeklyHistory() {
      return loadState().weeklyReports
        .slice()
        .sort((left, right) => right.weekKey.localeCompare(left.weekKey))
        .map((report) => ({
          id: report.id,
          title: report.title,
          dateLabel: report.weekKey,
          type: "weekly" as const
        }))
    },

    async listCurrentWeekDailyReports(referenceDate = getTodayDateKey()) {
      const currentWeek = getWeekKey(new Date(`${referenceDate}T00:00:00`)).weekKey

      return loadState().dailyReports.filter((report) => {
        const reportWeek = getWeekKey(new Date(`${report.reportDate}T00:00:00`)).weekKey
        return reportWeek === currentWeek
      })
    },

    async getHistoryDetail(type, id) {
      const state = loadState()

      if (type === "daily") {
        const report = state.dailyReports.find((item) => item.id === id)
        return report || null
      }

      const report = state.weeklyReports.find((item) => item.id === id)
      return report || null
    }
  }
}
