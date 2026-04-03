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

export interface ValidationResult {
  valid: boolean
  reason?: string
}
