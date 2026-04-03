import { describe, expect, test } from "vitest"

import type { ReportDocument } from "../../lib/types/report"
import {
  createWeeklyWorkspaceState,
  startWeeklyGeneration,
  finishWeeklyGeneration
} from "../../lib/services/weekly-workspace"

function makeWeeklyDocument(): ReportDocument {
  return {
    title: "2026年第14周周报",
    sections: [
      {
        name: "本周完成",
        order: 1,
        items: ["完成日报与周报结构化文档工具层"]
      }
    ]
  }
}

describe("weekly workspace", () => {
  test("shows empty state before generation", () => {
    const state = createWeeklyWorkspaceState()

    expect(state.mode).toBe("empty")
    expect(state.disableGenerate).toBe(false)
    expect(state.disableFinish).toBe(true)
  })

  test("disables generation while AI is generating the weekly draft", () => {
    const state = startWeeklyGeneration(createWeeklyWorkspaceState())

    expect(state.mode).toBe("generating")
    expect(state.disableGenerate).toBe(true)
  })

  test("keeps preview visible after weekly report generation completes", () => {
    const state = finishWeeklyGeneration(startWeeklyGeneration(createWeeklyWorkspaceState()), makeWeeklyDocument())

    expect(state.mode).toBe("preview")
    expect(state.document?.title).toBe("2026年第14周周报")
    expect(state.disableFinish).toBe(false)
  })
})
