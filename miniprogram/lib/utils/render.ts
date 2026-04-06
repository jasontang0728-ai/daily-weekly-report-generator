import type { ReportDocument, ReportSection } from "../types/report"

const SECTION_NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]

function formatSectionTitle(section: ReportSection, index: number): string {
  const numeral = typeof SECTION_NUMERALS[index] === "string" ? SECTION_NUMERALS[index] : String(index + 1)

  return `${numeral}、${section.name}`
}

function normalizeItems(items: string[]): string[] {
  return items.length > 0 ? items : ["无"]
}

export function renderReportDocument(document: ReportDocument): string {
  const orderedSections = [...document.sections].sort((left, right) => left.order - right.order)

  const blocks = orderedSections.map((section, index) => {
    const lines = normalizeItems(section.items).map((item, itemIndex) => `${itemIndex + 1}. ${item}`)

    return [formatSectionTitle(section, index), ...lines].join("\n")
  })

  return [document.title, ...blocks].join("\n\n")
}
