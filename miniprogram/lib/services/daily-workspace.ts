import type { DailyWorkspaceState, ReportDocument } from "../types/report"

export function createDailyWorkspaceState(
  todayReport: ReportDocument | null
): DailyWorkspaceState {
  if (todayReport) {
    return {
      mode: "preview",
      document: todayReport,
      disableGenerate: false,
      disableFinish: false
    }
  }

  return {
    mode: "input",
    document: null,
    disableGenerate: false,
    disableFinish: true
  }
}

export function startDailyGeneration(
  state: DailyWorkspaceState
): DailyWorkspaceState {
  return {
    ...state,
    mode: "generating",
    disableGenerate: true,
    disableFinish: true
  }
}

export function finishDailyGeneration(
  state: DailyWorkspaceState,
  document: ReportDocument
): DailyWorkspaceState {
  return {
    ...state,
    mode: "preview",
    document,
    disableGenerate: false,
    disableFinish: false
  }
}

export function canFinishDailyReport(state: DailyWorkspaceState): boolean {
  return Boolean(state.document) && state.disableFinish === false
}
