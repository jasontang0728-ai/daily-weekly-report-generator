"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserOpenId = getCurrentUserOpenId;
exports.getDailyTemplate = getDailyTemplate;
exports.saveDailyTemplate = saveDailyTemplate;
exports.getWeeklyTemplate = getWeeklyTemplate;
exports.saveWeeklyTemplate = saveWeeklyTemplate;
exports.getDailyReportByDate = getDailyReportByDate;
exports.saveDailyReport = saveDailyReport;
exports.listDailyHistory = listDailyHistory;
exports.getWeeklyReportByWeekKey = getWeeklyReportByWeekKey;
exports.saveWeeklyReport = saveWeeklyReport;
exports.listWeeklyHistory = listWeeklyHistory;
exports.listCurrentWeekDailyReports = listCurrentWeekDailyReports;
exports.getHistoryDetail = getHistoryDetail;
const runtime_1 = require("../config/runtime");
const db_cloud_1 = require("./db-cloud");
const db_local_1 = require("./db-local");
function createWxCloudGateway(envId) {
    const cloudApi = typeof wx === "undefined" ? undefined : wx.cloud;
    if (!cloudApi || typeof cloudApi.database !== "function") {
        throw new Error("当前环境未提供微信云开发数据库能力");
    }
    const database = cloudApi.database({ env: envId });
    return {
        async list(collectionName) {
            const result = await database.collection(collectionName).get();
            return result.data;
        },
        async findOne(collectionName, matcher) {
            const result = await database.collection(collectionName).get();
            const record = result.data.find((item) => matcher(item));
            return record || null;
        },
        async upsert(collectionName, matcher, nextRecord) {
            const collection = database.collection(collectionName);
            const currentRecords = (await collection.get()).data;
            const existing = currentRecords.find((record) => matcher(record));
            if (existing && typeof existing._id === "string") {
                await collection.doc(existing._id).update({
                    data: nextRecord
                });
                return existing._id;
            }
            const created = await collection.add({
                data: nextRecord
            });
            return created._id;
        }
    };
}
function getRepository() {
    const runtimeConfig = (0, runtime_1.getRuntimeConfig)();
    if ((0, runtime_1.isCloudDatabaseEnabled)(runtimeConfig)) {
        try {
            return (0, db_cloud_1.createCloudDbRepository)(createWxCloudGateway(runtimeConfig.cloudEnvId));
        }
        catch (error) {
            console.warn("Cloud database unavailable, fallback to local repository.", error);
        }
    }
    return (0, db_local_1.createLocalDbRepository)();
}
function getCurrentUserOpenId() {
    if (typeof getApp === "function") {
        return getApp().globalData.currentUserOpenId || "demo-openid";
    }
    return "demo-openid";
}
async function getDailyTemplate() {
    return getRepository().getDailyTemplate();
}
async function saveDailyTemplate(sections) {
    return getRepository().saveDailyTemplate(sections);
}
async function getWeeklyTemplate() {
    return getRepository().getWeeklyTemplate();
}
async function saveWeeklyTemplate(sections) {
    return getRepository().saveWeeklyTemplate(sections);
}
async function getDailyReportByDate(reportDate) {
    return getRepository().getDailyReportByDate(reportDate);
}
async function saveDailyReport(reportDate, document, templateSnapshot) {
    return getRepository().saveDailyReport(reportDate, document, templateSnapshot);
}
async function listDailyHistory() {
    return getRepository().listDailyHistory();
}
async function getWeeklyReportByWeekKey(weekKey) {
    return getRepository().getWeeklyReportByWeekKey(weekKey);
}
async function saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds) {
    return getRepository().saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds);
}
async function listWeeklyHistory() {
    return getRepository().listWeeklyHistory();
}
async function listCurrentWeekDailyReports(referenceDate) {
    return getRepository().listCurrentWeekDailyReports(referenceDate);
}
async function getHistoryDetail(type, id) {
    return getRepository().getHistoryDetail(type, id);
}
