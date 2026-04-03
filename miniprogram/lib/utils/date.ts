export function formatDailyTitle(reportDate: string): string {
  const [year, month, day] = reportDate.split("-").map((part) => Number(part))

  return `${year}年${month}月${day}日日报`
}

export function formatWeeklyTitle(year: number, week: number): string {
  return `${year}年第${week}周周报`
}
