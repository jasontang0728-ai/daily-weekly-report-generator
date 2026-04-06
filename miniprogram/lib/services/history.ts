import type { HistoryListItem } from "../types/report"
import { getHistoryDetail, listDailyHistory, listWeeklyHistory } from "./db"

export async function listHistory(type: "daily" | "weekly"): Promise<HistoryListItem[]> {
  return type === "daily" ? listDailyHistory() : listWeeklyHistory()
}

export async function getHistoryPreview(type: "daily" | "weekly", id: string): Promise<string> {
  const detail = await getHistoryDetail(type, id)

  return detail ? detail.finalText : ""
}
