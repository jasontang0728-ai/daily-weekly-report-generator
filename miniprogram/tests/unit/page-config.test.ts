import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, test } from "vitest"

function readJson(relativePath: string) {
  return JSON.parse(
    readFileSync(join(process.cwd(), relativePath), "utf8")
  ) as { usingComponents?: Record<string, string> }
}

function readText(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

function fileExists(relativePath: string) {
  try {
    readFileSync(join(process.cwd(), relativePath), "utf8")
    return true
  } catch {
    return false
  }
}

describe("page config", () => {
  test("daily page keeps matching ts and js entrypoints", () => {
    expect(fileExists("pages/daily/index.ts")).toBe(true)
    expect(fileExists("pages/daily/index.js")).toBe(true)
    expect(readText("pages/daily/index.js")).toContain("handleGenerate")
  })

  test("my and template pages keep matching runtime js entrypoints", () => {
    const pageAssertions = [
      { root: "pages/me/index", marker: "entries" },
      { root: "pages/template-daily/index", marker: "handleDragStart" },
      { root: "pages/template-weekly/index", marker: "handleDragStart" }
    ]

    for (const pageAssertion of pageAssertions) {
      expect(fileExists(`${pageAssertion.root}.ts`)).toBe(true)
      expect(fileExists(`${pageAssertion.root}.js`)).toBe(true)
      expect(readText(`${pageAssertion.root}.js`)).toContain(pageAssertion.marker)
    }
  })

  test("report pages do not depend on custom preview or popup components", () => {
    const daily = readJson("pages/daily/index.json")
    const weekly = readJson("pages/weekly/index.json")
    const historyDetail = readJson("pages/history-detail/index.json")

    expect(daily.usingComponents ?? {}).toEqual({})
    expect(weekly.usingComponents ?? {}).toEqual({})
    expect(historyDetail.usingComponents ?? {}).toEqual({})
  })

  test("daily and weekly template pages own their compact toolbar layouts", () => {
    const dailyTemplate = readJson("pages/template-daily/index.json")
    const weeklyTemplate = readJson("pages/template-weekly/index.json")
    const dailyTemplateMarkup = readText("pages/template-daily/index.wxml")
    const weeklyTemplateMarkup = readText("pages/template-weekly/index.wxml")

    expect(dailyTemplate.usingComponents ?? {}).toEqual({})
    expect(dailyTemplateMarkup).toContain("template-toolbar")
    expect(dailyTemplateMarkup).toContain("template-drag-handle")
    expect(dailyTemplateMarkup).not.toContain("template-editor")
    expect(weeklyTemplate.usingComponents ?? {}).toEqual({})
    expect(weeklyTemplateMarkup).toContain("template-toolbar")
    expect(weeklyTemplateMarkup).toContain("template-drag-handle")
    expect(weeklyTemplateMarkup).not.toContain("template-editor")
  })

  test("template editor keeps the stacked shared-button layout", () => {
    const templateEditorMarkup = readText("components/template-editor/index.wxml")
    const templateEditorStyles = readText("components/template-editor/index.wxss")
    const templateEditorRuntime = readText("components/template-editor/index.js")

    expect(templateEditorMarkup).toContain("template-action-stack")
    expect(templateEditorMarkup).toContain("ghost-button template-action-button")
    expect(templateEditorMarkup).not.toContain("mini-button")
    expect(templateEditorStyles).toContain(".template-action-stack")
    expect(templateEditorStyles).toContain(".template-action-button")
    expect(templateEditorRuntime).toContain('this.triggerEvent("moveup"')
  })
})
