"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocalDbRepository = createLocalDbRepository;
const date_1 = require("../utils/date");
const render_1 = require("../utils/render");
const db_defaults_1 = require("./db-defaults");
const STORAGE_KEY = "daily-weekly-report-generator:local-db";
const memoryStorage = new Map();
function nowIso() {
    return new Date().toISOString();
}
function cloneReportSections(document) {
    return document.sections.map((section) => ({
        ...section,
        items: [...section.items]
    }));
}
function createDemoState() {
    const dailyTemplate = (0, db_defaults_1.createDefaultTemplateProfile)("daily");
    const weeklyTemplate = (0, db_defaults_1.createDefaultTemplateProfile)("weekly");
    const dailyReports = [
        {
            id: "daily-2026-04-01",
            reportDate: "2026-04-01",
            title: "2026年4月1日日报",
            sections: [
                { name: "今日完成", order: 1, items: ["完成登录页样式调整", "推进登录接口联调"] },
                { name: "问题风险", order: 2, items: ["定位登录接口权限异常"] },
                { name: "明日计划", order: 3, items: ["继续联调权限接口"] }
            ],
            finalText: "",
            templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(dailyTemplate.sections),
            updatedAt: nowIso()
        },
        {
            id: "daily-2026-04-02",
            reportDate: "2026-04-02",
            title: "2026年4月2日日报",
            sections: [
                { name: "今日完成", order: 1, items: ["继续联调权限接口", "整理测试用例"] },
                { name: "问题风险", order: 2, items: ["无"] },
                { name: "明日计划", order: 3, items: ["补充异常场景验证"] }
            ],
            finalText: "",
            templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(dailyTemplate.sections),
            updatedAt: nowIso()
        }
    ].map((report) => ({
        ...report,
        finalText: (0, render_1.renderReportDocument)(report)
    }));
    const weeklyReports = [
        {
            id: "weekly-2026-W13",
            weekKey: "2026-W13",
            year: 2026,
            week: 13,
            title: "2026年第13周周报",
            sections: [
                { name: "本周完成", order: 1, items: ["完成产品需求梳理并确定阶段一模板能力"] },
                { name: "问题风险", order: 2, items: ["无"] },
                { name: "下周计划", order: 3, items: ["启动小程序工作台和云接入实现"] }
            ],
            finalText: "",
            sourceDailyIds: [],
            templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(weeklyTemplate.sections),
            updatedAt: nowIso()
        }
    ].map((report) => ({
        ...report,
        finalText: (0, render_1.renderReportDocument)(report)
    }));
    return {
        dailyTemplate,
        weeklyTemplate,
        dailyReports,
        weeklyReports
    };
}
function hasWxStorage() {
    return typeof wx !== "undefined" && typeof wx.getStorageSync === "function";
}
function readStorage() {
    if (hasWxStorage()) {
        const value = wx.getStorageSync(STORAGE_KEY);
        return typeof value === "string" ? value : undefined;
    }
    return memoryStorage.get(STORAGE_KEY);
}
function writeStorage(value) {
    if (hasWxStorage()) {
        wx.setStorageSync(STORAGE_KEY, value);
        return;
    }
    memoryStorage.set(STORAGE_KEY, value);
}
function loadState() {
    const raw = readStorage();
    if (!raw) {
        const seeded = createDemoState();
        writeStorage(JSON.stringify(seeded));
        return seeded;
    }
    return JSON.parse(raw);
}
function saveState(state) {
    writeStorage(JSON.stringify(state));
}
function createLocalDbRepository() {
    return {
        async getDailyTemplate() {
            return loadState().dailyTemplate;
        },
        async saveDailyTemplate(sections) {
            const state = loadState();
            const profile = {
                kind: "daily",
                sections: (0, db_defaults_1.cloneTemplateSections)(sections),
                updatedAt: nowIso()
            };
            state.dailyTemplate = profile;
            saveState(state);
            return profile;
        },
        async getWeeklyTemplate() {
            return loadState().weeklyTemplate;
        },
        async saveWeeklyTemplate(sections) {
            const state = loadState();
            const profile = {
                kind: "weekly",
                sections: (0, db_defaults_1.cloneTemplateSections)(sections),
                updatedAt: nowIso()
            };
            state.weeklyTemplate = profile;
            saveState(state);
            return profile;
        },
        async getDailyReportByDate(reportDate) {
            const report = loadState().dailyReports.find((item) => item.reportDate === reportDate);
            return report || null;
        },
        async saveDailyReport(reportDate, document, templateSnapshot) {
            const state = loadState();
            const nextRecord = {
                id: `daily-${reportDate}`,
                reportDate,
                title: document.title,
                sections: cloneReportSections(document),
                finalText: (0, render_1.renderReportDocument)(document),
                templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(templateSnapshot),
                updatedAt: nowIso()
            };
            state.dailyReports = state.dailyReports.filter((report) => report.reportDate !== reportDate);
            state.dailyReports.push(nextRecord);
            state.dailyReports.sort((left, right) => right.reportDate.localeCompare(left.reportDate));
            saveState(state);
            return nextRecord;
        },
        async listDailyHistory() {
            return loadState().dailyReports
                .slice()
                .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
                .map((report) => ({
                id: report.id,
                title: report.title,
                dateLabel: report.reportDate,
                type: "daily"
            }));
        },
        async getWeeklyReportByWeekKey(weekKey) {
            const report = loadState().weeklyReports.find((item) => item.weekKey === weekKey);
            return report || null;
        },
        async saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds) {
            const state = loadState();
            const nextRecord = {
                id: `weekly-${weekKey}`,
                weekKey,
                year,
                week,
                title: document.title,
                sections: cloneReportSections(document),
                finalText: (0, render_1.renderReportDocument)(document),
                sourceDailyIds: [...sourceDailyIds],
                templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(templateSnapshot),
                updatedAt: nowIso()
            };
            state.weeklyReports = state.weeklyReports.filter((report) => report.weekKey !== weekKey);
            state.weeklyReports.push(nextRecord);
            state.weeklyReports.sort((left, right) => right.weekKey.localeCompare(left.weekKey));
            saveState(state);
            return nextRecord;
        },
        async listWeeklyHistory() {
            return loadState().weeklyReports
                .slice()
                .sort((left, right) => right.weekKey.localeCompare(left.weekKey))
                .map((report) => ({
                id: report.id,
                title: report.title,
                dateLabel: report.weekKey,
                type: "weekly"
            }));
        },
        async listCurrentWeekDailyReports(referenceDate = (0, date_1.getTodayDateKey)()) {
            const currentWeek = (0, date_1.getWeekKey)(new Date(`${referenceDate}T00:00:00`)).weekKey;
            return loadState().dailyReports.filter((report) => {
                const reportWeek = (0, date_1.getWeekKey)(new Date(`${report.reportDate}T00:00:00`)).weekKey;
                return reportWeek === currentWeek;
            });
        },
        async getHistoryDetail(type, id) {
            const state = loadState();
            if (type === "daily") {
                const report = state.dailyReports.find((item) => item.id === id);
                return report || null;
            }
            const report = state.weeklyReports.find((item) => item.id === id);
            return report || null;
        }
    };
}
