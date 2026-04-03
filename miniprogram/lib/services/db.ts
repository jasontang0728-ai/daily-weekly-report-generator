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

interface LocalDatabaseState {
  dailyTemplate: TemplateProfile
  weeklyTemplate: TemplateProfile
  dailyReports: DailyReportRecord[]
  weeklyReports: WeeklyReportRecord[]
}

const STORAGE_KEY = "daily-weekly-report-generator:local-db"
const memoryStorage = new Map<string, string>()

const DEFAULT_DAILY_TEMPLATE: TemplateSection[] = [
  { id: "daily-1", name: "今日完成", order: 1 },
  { id: "daily-2", name: "问题风险", order: 2 },
  { id: "daily-3", name: "明日计划", order: 3 }
]

const DEFAULT_WEEKLY_TEMPLATE: TemplateSection[] = [
  { id: "weekly-1", name: "本周完成", order: 1 },
  { id: "weekly-2", name: "问题风险", order: 2 },
  { id: "weekly-3", name: "下周计划", order: 3 }
]

function nowIso(): string {
  return new Date().toISOString()
}

function cloneSections(sections: TemplateSection[]): TemplateSection[] {
  return sections.map((section) => ({ ...section }))
}

function cloneReportSections(document: ReportDocument): ReportDocument["sections"] {
  return document.sections.map((section) => ({
    ...section,
    items: [...section.items]
  }))
}

function createDemoState(): LocalDatabaseState {
  const dailyTemplateSections = cloneSections(DEFAULT_DAILY_TEMPLATE)
  const weeklyTemplateSections = cloneSections(DEFAULT_WEEKLY_TEMPLATE)

  const demoDailyReports: DailyReportRecord[] = [
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
      templateSnapshot: cloneSections(dailyTemplateSections),
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
      templateSnapshot: cloneSections(dailyTemplateSections),
      updatedAt: nowIso()
    }
  ].map((report) => ({
    ...report,
    finalText: renderReportDocument(report)
  }))

  const demoWeeklyReports: WeeklyReportRecord[] = [
    {
      id: "weekly-2026-W13",
      weekKey: "2026-W13",
      year: 2026,
      week: 13,
      title: "2026年第13周周报",
      sections: [
        { name: "本周完成", order: 1, items: ["完成日报工具需求梳理", "整理一期边界与模板规则"] },
        { name: "问题风险", order: 2, items: ["无"] },
        { name: "下周计划", order: 3, items: ["开始搭建小程序前端骨架"] }
      ],
      finalText: "",
      sourceDailyIds: [],
      templateSnapshot: cloneSections(weeklyTemplateSections),
      updatedAt: nowIso()
    }
  ].map((report) => ({
    ...report,
    finalText: renderReportDocument(report)
  }))

  return {
    dailyTemplate: {
      kind: "daily",
      sections: dailyTemplateSections,
      updatedAt: nowIso()
    },
    weeklyTemplate: {
      kind: "weekly",
      sections: weeklyTemplateSections,
      updatedAt: nowIso()
    },
    dailyReports: demoDailyReports,
    weeklyReports: demoWeeklyReports
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

export function getCurrentUserOpenId(): string {
  if (typeof getApp === "function") {
    return getApp<IAppOption>().globalData.currentUserOpenId || "demo-openid"
  }

  return "demo-openid"
}

export function getDailyTemplate(): TemplateProfile {
  return loadState().dailyTemplate
}

export function saveDailyTemplate(sections: TemplateSection[]): TemplateProfile {
  const state = loadState()
  const profile: TemplateProfile = {
    kind: "daily",
    sections: cloneSections(sections),
    updatedAt: nowIso()
  }

  state.dailyTemplate = profile
  saveState(state)

  return profile
}

export function getWeeklyTemplate(): TemplateProfile {
  return loadState().weeklyTemplate
}

export function saveWeeklyTemplate(sections: TemplateSection[]): TemplateProfile {
  const state = loadState()
  const profile: TemplateProfile = {
    kind: "weekly",
    sections: cloneSections(sections),
    updatedAt: nowIso()
  }

  state.weeklyTemplate = profile
  saveState(state)

  return profile
}

export function getDailyReportByDate(reportDate: string): DailyReportRecord | null {
  const report = loadState().dailyReports.find((item) => item.reportDate === reportDate)
  return report ?? null
}

export function saveDailyReport(
  reportDate: string,
  document: ReportDocument,
  templateSnapshot: TemplateSection[]
): DailyReportRecord {
  const state = loadState()
  const nextRecord: DailyReportRecord = {
    id: `daily-${reportDate}`,
    reportDate,
    title: document.title,
    sections: cloneReportSections(document),
    finalText: renderReportDocument(document),
    templateSnapshot: cloneSections(templateSnapshot),
    updatedAt: nowIso()
  }

  state.dailyReports = state.dailyReports.filter((item) => item.reportDate !== reportDate)
  state.dailyReports.push(nextRecord)
  state.dailyReports.sort((left, right) => right.reportDate.localeCompare(left.reportDate))
  saveState(state)

  return nextRecord
}

export function listDailyHistory(): HistoryListItem[] {
  return loadState().dailyReports
    .slice()
    .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
    .map((report) => ({
      id: report.id,
      title: report.title,
      dateLabel: report.reportDate,
      type: "daily"
    }))
}

export function getWeeklyReportByWeekKey(weekKey: string): WeeklyReportRecord | null {
  const report = loadState().weeklyReports.find((item) => item.weekKey === weekKey)
  return report ?? null
}

export function saveWeeklyReport(
  weekKey: string,
  year: number,
  week: number,
  document: ReportDocument,
  templateSnapshot: TemplateSection[],
  sourceDailyIds: string[]
): WeeklyReportRecord {
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
    templateSnapshot: cloneSections(templateSnapshot),
    updatedAt: nowIso()
  }

  state.weeklyReports = state.weeklyReports.filter((item) => item.weekKey !== weekKey)
  state.weeklyReports.push(nextRecord)
  state.weeklyReports.sort((left, right) => right.weekKey.localeCompare(left.weekKey))
  saveState(state)

  return nextRecord
}

export function listWeeklyHistory(): HistoryListItem[] {
  return loadState().weeklyReports
    .slice()
    .sort((left, right) => right.weekKey.localeCompare(left.weekKey))
    .map((report) => ({
      id: report.id,
      title: report.title,
      dateLabel: report.weekKey,
      type: "weekly"
    }))
}

export function listCurrentWeekDailyReports(referenceDate: string = getTodayDateKey()): DailyReportRecord[] {
  const state = loadState()
  const currentDate = new Date(`${referenceDate}T00:00:00`)
  const currentWeek = getWeekKey(currentDate).weekKey

  return state.dailyReports.filter((report) => {
    const reportWeek = getWeekKey(new Date(`${report.reportDate}T00:00:00`)).weekKey
    return reportWeek === currentWeek
  })
}

export function getHistoryDetail(type: "daily" | "weekly", id: string): DailyReportRecord | WeeklyReportRecord | null {
  const state = loadState()

  if (type === "daily") {
    return state.dailyReports.find((report) => report.id === id) ?? null
  }

  return state.weeklyReports.find((report) => report.id === id) ?? null
}
