import { describe, expect, test } from "vitest"

import type { ReportDocument } from "../../lib/types/report"
import {
  createDailyWorkspaceState,
  startDailyGeneration,
  finishDailyGeneration,
  canFinishDailyReport
} from "../../lib/services/daily-workspace"

function makeDocument(): ReportDocument {
  return {
    title: "2026年4月4日日报",
    sections: [
      {
        name: "今日完成",
        order: 1,
        items: ["完成日报页初版布局"]
      }
    ]
  }
}

describe("daily workspace", () => {
  test("creates an empty workspace when no completed report exists for today", () => {
    const state = createDailyWorkspaceState(null)

    expect(state.mode).toBe("input")
    expect(state.disableGenerate).toBe(false)
    expect(state.disableFinish).toBe(true)
  })

  test("creates a preview workspace when today's completed report already exists", () => {
    const state = createDailyWorkspaceState(makeDocument())

    expect(state.mode).toBe("preview")
    expect(state.document?.title).toBe("2026年4月4日日报")
    expect(state.disableFinish).toBe(false)
  })

  test("disables generation while an AI request is in flight", () => {
    const state = startDailyGeneration(createDailyWorkspaceState(null))

    expect(state.mode).toBe("generating")
    expect(state.disableGenerate).toBe(true)
    expect(state.disableFinish).toBe(true)
  })

  test("enables finish after a valid AI result is returned", () => {
    const state = finishDailyGeneration(startDailyGeneration(createDailyWorkspaceState(null)), makeDocument())

    expect(state.mode).toBe("preview")
    expect(state.disableGenerate).toBe(false)
    expect(state.disableFinish).toBe(false)
  })

  test("does not allow finishing before a generated document exists", () => {
    expect(canFinishDailyReport(createDailyWorkspaceState(null))).toBe(false)
    expect(canFinishDailyReport(finishDailyGeneration(startDailyGeneration(createDailyWorkspaceState(null)), makeDocument()))).toBe(true)
  })
})
