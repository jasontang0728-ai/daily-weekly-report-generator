export interface ReportSection {
  name: string
  order: number
  items: string[]
}

export interface TemplateSection {
  id: string
  name: string
  order: number
}

export interface ReportDocument {
  title: string
  sections: ReportSection[]
}

export interface TemplateProfile {
  kind: "daily" | "weekly"
  sections: TemplateSection[]
  updatedAt: string
}

export interface DailyReportRecord extends ReportDocument {
  id: string
  reportDate: string
  finalText: string
  templateSnapshot: TemplateSection[]
  updatedAt: string
}

export interface WeeklyReportRecord extends ReportDocument {
  id: string
  weekKey: string
  year: number
  week: number
  sourceDailyIds: string[]
  finalText: string
  templateSnapshot: TemplateSection[]
  updatedAt: string
}

export interface HistoryListItem {
  id: string
  title: string
  dateLabel: string
  type: "daily" | "weekly"
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export type DailyWorkspaceMode = "input" | "generating" | "preview"

export interface DailyWorkspaceState {
  mode: DailyWorkspaceMode
  document: ReportDocument | null
  disableGenerate: boolean
  disableFinish: boolean
}

export type WeeklyWorkspaceMode = "empty" | "generating" | "preview"

export interface WeeklyWorkspaceState {
  mode: WeeklyWorkspaceMode
  document: ReportDocument | null
  disableGenerate: boolean
  disableFinish: boolean
}
