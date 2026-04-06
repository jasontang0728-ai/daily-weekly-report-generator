export interface TemplateSection {
  id?: string
  name: string
  order: number
}

export interface GeneratedSection {
  name: string
  order: number
  items: string[] | string
}

export interface GeneratedReportPayload {
  title: string
  sections: GeneratedSection[]
}

export interface ReportDocument {
  title: string
  sections: Array<{
    name: string
    order: number
    items: string[]
  }>
}

export interface DailyGenerateRequest {
  rawInput: string
  reportDate: string
  templateSections: TemplateSection[]
}

export interface WeeklyGenerateRequest {
  reports: ReportDocument[]
  year: number
  week: number
  templateSections: TemplateSection[]
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}
