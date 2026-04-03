export interface GeneratedSection {
  name: string
  order: number
  items: string[] | string
}

export interface GeneratedReportPayload {
  title: string
  sections: GeneratedSection[]
}

export interface ValidationResult {
  valid: boolean
  reason?: string
}
