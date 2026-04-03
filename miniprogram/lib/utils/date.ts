export function formatDailyTitle(reportDate: string): string {
  const [year, month, day] = reportDate.split("-").map((part) => Number(part))

  return `${year}年${month}月${day}日日报`
}

export function formatWeeklyTitle(year: number, week: number): string {
  return `${year}年第${week}周周报`
}

export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getWeekStart(date: Date = new Date()): Date {
  const nextDate = new Date(date)
  const day = nextDate.getDay()
  const diff = day === 0 ? -6 : 1 - day

  nextDate.setDate(nextDate.getDate() + diff)
  nextDate.setHours(0, 0, 0, 0)

  return nextDate
}

export function getWeekKey(date: Date = new Date()): { year: number; week: number; weekKey: string } {
  const nextDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  nextDate.setUTCDate(nextDate.getUTCDate() + 4 - (nextDate.getUTCDay() || 7))

  const yearStart = new Date(Date.UTC(nextDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((nextDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  const year = nextDate.getUTCFullYear()

  return {
    year,
    week,
    weekKey: `${year}-W${`${week}`.padStart(2, "0")}`
  }
}
