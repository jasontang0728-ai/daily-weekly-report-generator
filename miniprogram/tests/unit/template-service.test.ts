import { describe, expect, test } from "vitest"

import {
  addTemplateSection,
  removeTemplateSection,
  renameTemplateSection,
  reorderTemplateSections
} from "../../lib/services/template"

const baseSections = [
  { id: "s1", name: "今日完成", order: 1 },
  { id: "s2", name: "问题风险", order: 2 },
  { id: "s3", name: "明日计划", order: 3 }
]

describe("template service", () => {
  test("adds a new section to the end of the template", () => {
    const result = addTemplateSection(baseSections, "协作事项")

    expect(result).toHaveLength(4)
    expect(result[3]).toMatchObject({
      name: "协作事项",
      order: 4
    })
  })

  test("removes a section and reorders the remaining sections", () => {
    const result = removeTemplateSection(baseSections, "s2")

    expect(result).toEqual([
      { id: "s1", name: "今日完成", order: 1 },
      { id: "s3", name: "明日计划", order: 2 }
    ])
  })

  test("renames a target section without changing order", () => {
    const result = renameTemplateSection(baseSections, "s3", "待推进事项")

    expect(result[2]).toEqual({
      id: "s3",
      name: "待推进事项",
      order: 3
    })
  })

  test("reorders sections by moving one entry into a new position", () => {
    const result = reorderTemplateSections(baseSections, 2, 0)

    expect(result).toEqual([
      { id: "s3", name: "明日计划", order: 1 },
      { id: "s1", name: "今日完成", order: 2 },
      { id: "s2", name: "问题风险", order: 3 }
    ])
  })
})
