import type { TemplateSection } from "../types/report"

function normalizeSectionOrder(sections: TemplateSection[]): TemplateSection[] {
  return sections.map((section, index) => ({
    ...section,
    order: index + 1
  }))
}

export function addTemplateSection(
  sections: TemplateSection[],
  name: string
): TemplateSection[] {
  const nextSection: TemplateSection = {
    id: `section-${sections.length + 1}`,
    name,
    order: sections.length + 1
  }

  return [...sections, nextSection]
}

export function removeTemplateSection(
  sections: TemplateSection[],
  id: string
): TemplateSection[] {
  return normalizeSectionOrder(sections.filter((section) => section.id !== id))
}

export function renameTemplateSection(
  sections: TemplateSection[],
  id: string,
  nextName: string
): TemplateSection[] {
  return sections.map((section) =>
    section.id === id
      ? {
          ...section,
          name: nextName
        }
      : section
  )
}

export function reorderTemplateSections(
  sections: TemplateSection[],
  fromIndex: number,
  toIndex: number
): TemplateSection[] {
  const nextSections = [...sections]
  const [moved] = nextSections.splice(fromIndex, 1)

  nextSections.splice(toIndex, 0, moved)

  return normalizeSectionOrder(nextSections)
}
