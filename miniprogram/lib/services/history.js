"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHistory = listHistory;
exports.getHistoryPreview = getHistoryPreview;
const db_1 = require("./db");
async function listHistory(type) {
    return type === "daily" ? (0, db_1.listDailyHistory)() : (0, db_1.listWeeklyHistory)();
}
async function getHistoryPreview(type, id) {
    const detail = await (0, db_1.getHistoryDetail)(type, id);
    return detail ? detail.finalText : "";
}
