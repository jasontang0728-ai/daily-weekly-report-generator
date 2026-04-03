import type { ReportDocument, WeeklyWorkspaceState } from "../types/report"

export function createWeeklyWorkspaceState(): WeeklyWorkspaceState {
  return {
    mode: "empty",
    document: null,
    disableGenerate: false,
    disableFinish: true
  }
}

export function startWeeklyGeneration(
  state: WeeklyWorkspaceState
): WeeklyWorkspaceState {
  return {
    ...state,
    mode: "generating",
    disableGenerate: true,
    disableFinish: true
  }
}

export function finishWeeklyGeneration(
  state: WeeklyWorkspaceState,
  document: ReportDocument
): WeeklyWorkspaceState {
  return {
    ...state,
    mode: "preview",
    document,
    disableGenerate: false,
    disableFinish: false
  }
}
