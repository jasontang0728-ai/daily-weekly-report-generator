"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDailyTitle = formatDailyTitle;
exports.formatWeeklyTitle = formatWeeklyTitle;
exports.getTodayDateKey = getTodayDateKey;
exports.getWeekStart = getWeekStart;
exports.getWeekKey = getWeekKey;
function formatDailyTitle(reportDate) {
    const [year, month, day] = reportDate.split("-").map((part) => Number(part));
    return `${year}年${month}月${day}日日报`;
}
function formatWeeklyTitle(year, week) {
    return `${year}年第${week}周周报`;
}
function getTodayDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function getWeekStart(date = new Date()) {
    const nextDate = new Date(date);
    const day = nextDate.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    nextDate.setDate(nextDate.getDate() + diff);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
}
function getWeekKey(date = new Date()) {
    const nextDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    nextDate.setUTCDate(nextDate.getUTCDate() + 4 - (nextDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(nextDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((nextDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const year = nextDate.getUTCFullYear();
    return {
        year,
        week,
        weekKey: `${year}-W${`${week}`.padStart(2, "0")}`
    };
}
