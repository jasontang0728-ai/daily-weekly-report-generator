import type { HistoryListItem } from "../types/report"
import { getHistoryDetail, listDailyHistory, listWeeklyHistory } from "./db"

export function listHistory(type: "daily" | "weekly"): HistoryListItem[] {
  return type === "daily" ? listDailyHistory() : listWeeklyHistory()
}

export function getHistoryPreview(type: "daily" | "weekly", id: string): string {
  const detail = getHistoryDetail(type, id)

  return detail?.finalText ?? ""
}
