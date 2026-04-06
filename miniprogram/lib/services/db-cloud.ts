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
import type { ReportRepository } from "./db-local"

type CloudCollectionName = "dailyTemplates" | "weeklyTemplates" | "dailyReports" | "weeklyReports"

export interface CloudRecordGateway {
  list(collectionName: CloudCollectionName): Promise<Record<string, unknown>[]>
  findOne(
    collectionName: CloudCollectionName,
    matcher: (record: Record<string, unknown>) => boolean
  ): Promise<Record<string, unknown> | null>
  upsert(
    collectionName: CloudCollectionName,
    matcher: (record: Record<string, unknown>) => boolean,
    nextRecord: Record<string, unknown>
  ): Promise<string>
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function asTemplateSections(value: unknown): TemplateSection[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((section, index) => {
      const current = section as Record<string, unknown>

      return {
        id: asString(current.id, `section-${index + 1}`),
        name: asString(current.name),
        order: asNumber(current.order, index + 1)
      }
    })
    .filter((section) => section.name)
}

function asReportSections(value: unknown): ReportDocument["sections"] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((section, index) => {
      const current = section as Record<string, unknown>

      return {
        name: asString(current.name),
        order: asNumber(current.order, index + 1),
        items: asStringArray(current.items)
      }
    })
    .filter((section) => section.name)
}

function toTemplateProfile(
  kind: "daily" | "weekly",
  record: Record<string, unknown> | null
): TemplateProfile {
  if (!record) {
    return createDefaultTemplateProfile(kind)
  }

  const sections = asTemplateSections(record.sections)

  if (sections.length === 0) {
    return createDefaultTemplateProfile(kind)
  }

  return {
    kind,
    sections,
    updatedAt: asString(record.updatedAt, new Date().toISOString())
  }
}

function toDailyReportRecord(record: Record<string, unknown>): DailyReportRecord {
  return {
    id: asString(record._id, asString(record.id)),
    reportDate: asString(record.reportDate),
    title: asString(record.title),
    sections: asReportSections(record.sections),
    finalText: asString(record.finalText),
    templateSnapshot: asTemplateSections(record.templateSnapshot),
    updatedAt: asString(record.updatedAt)
  }
}

function toWeeklyReportRecord(record: Record<string, unknown>): WeeklyReportRecord {
  return {
    id: asString(record._id, asString(record.id)),
    weekKey: asString(record.weekKey),
    year: asNumber(record.year),
    week: asNumber(record.week),
    title: asString(record.title),
    sections: asReportSections(record.sections),
    finalText: asString(record.finalText),
    sourceDailyIds: asStringArray(record.sourceDailyIds),
    templateSnapshot: asTemplateSections(record.templateSnapshot),
    updatedAt: asString(record.updatedAt)
  }
}

function cloneReportSections(document: ReportDocument): ReportDocument["sections"] {
  return document.sections.map((section) => ({
    ...section,
    items: [...section.items]
  }))
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createCloudDbRepository(gateway: CloudRecordGateway): ReportRepository {
  return {
    async getDailyTemplate() {
      return toTemplateProfile("daily", await gateway.findOne("dailyTemplates", () => true))
    },

    async saveDailyTemplate(sections) {
      const profile: TemplateProfile = {
        kind: "daily",
        sections: cloneTemplateSections(sections),
        updatedAt: nowIso()
      }

      await gateway.upsert("dailyTemplates", () => true, profile as unknown as Record<string, unknown>)

      return profile
    },

    async getWeeklyTemplate() {
      return toTemplateProfile("weekly", await gateway.findOne("weeklyTemplates", () => true))
    },

    async saveWeeklyTemplate(sections) {
      const profile: TemplateProfile = {
        kind: "weekly",
        sections: cloneTemplateSections(sections),
        updatedAt: nowIso()
      }

      await gateway.upsert("weeklyTemplates", () => true, profile as unknown as Record<string, unknown>)

      return profile
    },

    async getDailyReportByDate(reportDate) {
      const record = await gateway.findOne(
        "dailyReports",
        (candidate) => asString(candidate.reportDate) === reportDate
      )

      return record ? toDailyReportRecord(record) : null
    },

    async saveDailyReport(reportDate, document, templateSnapshot) {
      const nextRecord = {
        reportDate,
        title: document.title,
        sections: cloneReportSections(document),
        finalText: renderReportDocument(document),
        templateSnapshot: cloneTemplateSections(templateSnapshot),
        updatedAt: nowIso()
      }

      const id = await gateway.upsert(
        "dailyReports",
        (candidate) => asString(candidate.reportDate) === reportDate,
        nextRecord as unknown as Record<string, unknown>
      )

      return {
        ...nextRecord,
        id
      }
    },

    async listDailyHistory() {
      return (await gateway.list("dailyReports"))
        .map(toDailyReportRecord)
        .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
        .map((report): HistoryListItem => ({
          id: report.id,
          title: report.title,
          dateLabel: report.reportDate,
          type: "daily"
        }))
    },

    async getWeeklyReportByWeekKey(weekKey) {
      const record = await gateway.findOne(
        "weeklyReports",
        (candidate) => asString(candidate.weekKey) === weekKey
      )

      return record ? toWeeklyReportRecord(record) : null
    },

    async saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds) {
      const nextRecord = {
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

      const id = await gateway.upsert(
        "weeklyReports",
        (candidate) => asString(candidate.weekKey) === weekKey,
        nextRecord as unknown as Record<string, unknown>
      )

      return {
        ...nextRecord,
        id
      }
    },

    async listWeeklyHistory() {
      return (await gateway.list("weeklyReports"))
        .map(toWeeklyReportRecord)
        .sort((left, right) => right.weekKey.localeCompare(left.weekKey))
        .map((report): HistoryListItem => ({
          id: report.id,
          title: report.title,
          dateLabel: report.weekKey,
          type: "weekly"
        }))
    },

    async listCurrentWeekDailyReports(referenceDate = getTodayDateKey()) {
      const currentWeek = getWeekKey(new Date(`${referenceDate}T00:00:00`)).weekKey

      return (await gateway.list("dailyReports"))
        .map(toDailyReportRecord)
        .filter((report) => {
          const reportWeek = getWeekKey(new Date(`${report.reportDate}T00:00:00`)).weekKey
          return reportWeek === currentWeek
        })
    },

    async getHistoryDetail(type, id) {
      if (type === "daily") {
        const record = await gateway.findOne(
          "dailyReports",
          (candidate) => asString(candidate._id, asString(candidate.id)) === id
        )
        return record ? toDailyReportRecord(record) : null
      }

      const record = await gateway.findOne(
        "weeklyReports",
        (candidate) => asString(candidate._id, asString(candidate.id)) === id
      )
      return record ? toWeeklyReportRecord(record) : null
    }
  }
}
