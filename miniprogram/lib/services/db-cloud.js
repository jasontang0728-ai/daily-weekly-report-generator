"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCloudDbRepository = createCloudDbRepository;
const date_1 = require("../utils/date");
const render_1 = require("../utils/render");
const db_defaults_1 = require("./db-defaults");
function asString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
function asNumber(value, fallback = 0) {
    return typeof value === "number" ? value : fallback;
}
function asStringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function asTemplateSections(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((section, index) => {
        const current = section;
        return {
            id: asString(current.id, `section-${index + 1}`),
            name: asString(current.name),
            order: asNumber(current.order, index + 1)
        };
    })
        .filter((section) => section.name);
}
function asReportSections(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((section, index) => {
        const current = section;
        return {
            name: asString(current.name),
            order: asNumber(current.order, index + 1),
            items: asStringArray(current.items)
        };
    })
        .filter((section) => section.name);
}
function toTemplateProfile(kind, record) {
    if (!record) {
        return (0, db_defaults_1.createDefaultTemplateProfile)(kind);
    }
    const sections = asTemplateSections(record.sections);
    if (sections.length === 0) {
        return (0, db_defaults_1.createDefaultTemplateProfile)(kind);
    }
    return {
        kind,
        sections,
        updatedAt: asString(record.updatedAt, new Date().toISOString())
    };
}
function toDailyReportRecord(record) {
    return {
        id: asString(record._id, asString(record.id)),
        reportDate: asString(record.reportDate),
        title: asString(record.title),
        sections: asReportSections(record.sections),
        finalText: asString(record.finalText),
        templateSnapshot: asTemplateSections(record.templateSnapshot),
        updatedAt: asString(record.updatedAt)
    };
}
function toWeeklyReportRecord(record) {
    return {
        id: asString(record._id, asString(record.id)),
        weekKey: asString(record.weekKey),
        year: asNumber(record.year),
        week: asNumber(record.week),
        title: asString(record.title),
        sections: asReportSections(record.sections),
        finalText: asString(record.finalText),
        sourceDailyIds: asStringArray(record.sourceDailyIds),
        templateSnapshot: asTemplateSections(record.templateSnapshot),
        updatedAt: asString(record.updatedAt)
    };
}
function cloneReportSections(document) {
    return document.sections.map((section) => ({
        ...section,
        items: [...section.items]
    }));
}
function nowIso() {
    return new Date().toISOString();
}
function createCloudDbRepository(gateway) {
    return {
        async getDailyTemplate() {
            return toTemplateProfile("daily", await gateway.findOne("dailyTemplates", () => true));
        },
        async saveDailyTemplate(sections) {
            const profile = {
                kind: "daily",
                sections: (0, db_defaults_1.cloneTemplateSections)(sections),
                updatedAt: nowIso()
            };
            await gateway.upsert("dailyTemplates", () => true, profile);
            return profile;
        },
        async getWeeklyTemplate() {
            return toTemplateProfile("weekly", await gateway.findOne("weeklyTemplates", () => true));
        },
        async saveWeeklyTemplate(sections) {
            const profile = {
                kind: "weekly",
                sections: (0, db_defaults_1.cloneTemplateSections)(sections),
                updatedAt: nowIso()
            };
            await gateway.upsert("weeklyTemplates", () => true, profile);
            return profile;
        },
        async getDailyReportByDate(reportDate) {
            const record = await gateway.findOne("dailyReports", (candidate) => asString(candidate.reportDate) === reportDate);
            return record ? toDailyReportRecord(record) : null;
        },
        async saveDailyReport(reportDate, document, templateSnapshot) {
            const nextRecord = {
                reportDate,
                title: document.title,
                sections: cloneReportSections(document),
                finalText: (0, render_1.renderReportDocument)(document),
                templateSnapshot: (0, db_defaults_1.cloneTemplateSections)(templateSnapshot),
                updatedAt: nowIso()
            };
            const id = await gateway.upsert("dailyReports", (candidate) => asString(candidate.reportDate) === reportDate, nextRecord);
            return {
                ...nextRecord,
                id
            };
        },
        async listDailyHistory() {
            return (await gateway.list("dailyReports"))
                .map(toDailyReportRecord)
                .sort((left, right) => right.reportDate.localeCompare(left.reportDate))
                .map((report) => ({
                id: report.id,
                title: report.title,
                dateLabel: report.reportDate,
                type: "daily"
            }));
        },
        async getWeeklyReportByWeekKey(weekKey) {
            const record = await gateway.findOne("weeklyReports", (candidate) => asString(candidate.weekKey) === weekKey);
            return record ? toWeeklyReportRecord(record) : null;
        },
        async saveWeeklyReport(weekKey, year, week, document, templateSnapshot, sourceDailyIds) {
            const nextRecord = {
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
            const id = await gateway.upsert("weeklyReports", (candidate) => asString(candidate.weekKey) === weekKey, nextRecord);
            return {
                ...nextRecord,
                id
            };
        },
        async listWeeklyHistory() {
            return (await gateway.list("weeklyReports"))
                .map(toWeeklyReportRecord)
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
            return (await gateway.list("dailyReports"))
                .map(toDailyReportRecord)
                .filter((report) => {
                const reportWeek = (0, date_1.getWeekKey)(new Date(`${report.reportDate}T00:00:00`)).weekKey;
                return reportWeek === currentWeek;
            });
        },
        async getHistoryDetail(type, id) {
            if (type === "daily") {
                const record = await gateway.findOne("dailyReports", (candidate) => asString(candidate._id, asString(candidate.id)) === id);
                return record ? toDailyReportRecord(record) : null;
            }
            const record = await gateway.findOne("weeklyReports", (candidate) => asString(candidate._id, asString(candidate.id)) === id);
            return record ? toWeeklyReportRecord(record) : null;
        }
    };
}
