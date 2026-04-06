"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGeneratedDocument = validateGeneratedDocument;
exports.generateDailyReportDraft = generateDailyReportDraft;
exports.generateWeeklyReportDraft = generateWeeklyReportDraft;
exports.generateDailyReport = generateDailyReport;
exports.generateWeeklyReport = generateWeeklyReport;
const runtime_1 = require("../config/runtime");
const date_1 = require("../utils/date");
const COMPLETED_KEYWORDS = ["完成", "联调", "整理", "上线", "实现", "修复", "调整", "推进", "提交", "同步"];
const RISK_KEYWORDS = ["问题", "风险", "阻塞", "异常", "报错", "卡住", "权限", "延迟", "待确认"];
const PLAN_KEYWORDS = ["明天", "明日", "后续", "继续", "计划", "待推进", "下周", "跟进", "补充", "验证"];
function splitRawInput(rawInput) {
    return rawInput
        .split(/[\n。！？；;，]/)
        .map((item) => item.trim().replace(/^[，、.\s]+|[，、.\s]+$/g, ""))
        .filter(Boolean);
}
function hasAnyKeyword(input, keywords) {
    return keywords.some((keyword) => input.includes(keyword));
}
function categorizeDailySentence(sentence) {
    if (hasAnyKeyword(sentence, PLAN_KEYWORDS)) {
        return "plan";
    }
    if (hasAnyKeyword(sentence, RISK_KEYWORDS)) {
        return "risk";
    }
    return "completed";
}
function defaultEmptyItems() {
    return ["无"];
}
function createSection(name, order, items) {
    return {
        name,
        order,
        items: items.length > 0 ? items : defaultEmptyItems()
    };
}
function getSectionCategory(name) {
    if (hasAnyKeyword(name, ["问题", "风险", "阻塞"])) {
        return "risk";
    }
    if (hasAnyKeyword(name, ["计划", "待推进", "安排", "跟进"])) {
        return "plan";
    }
    return "completed";
}
function normalizeItem(input) {
    return input.replace(/[，。、；;,.!?！？\s]/g, "");
}
function uniqueItems(items) {
    const seen = new Set();
    return items.filter((item) => {
        const key = normalizeItem(item);
        if (!key || seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
function getDefaultCallContainer() {
    const cloudApi = typeof wx === "undefined"
        ? undefined
        : wx.cloud;
    if (!cloudApi || !cloudApi.callContainer) {
        throw new Error("当前环境未提供 wx.cloud.callContainer");
    }
    return cloudApi.callContainer;
}
function extractDocumentFromResponse(response) {
    if (response && response.data && "document" in response.data && response.data.document) {
        return response.data.document;
    }
    if (response && response.data && "title" in response.data && "sections" in response.data) {
        return response.data;
    }
    throw new Error("云托管返回的文档结构无效");
}
async function callCloudRun(path, input, templateSections, options = {}) {
    const runtimeConfig = (0, runtime_1.getRuntimeConfig)(options.runtimeConfig);
    const callContainer = options.callContainer ? options.callContainer : getDefaultCallContainer();
    const response = await callContainer({
        config: {
            env: runtimeConfig.cloudEnvId
        },
        path,
        method: "POST",
        header: {
            "X-WX-SERVICE": runtimeConfig.cloudServiceName,
            "content-type": "application/json"
        },
        data: input
    });
    const document = extractDocumentFromResponse(response);
    const validation = validateGeneratedDocument(document, templateSections);
    if (!validation.valid) {
        throw new Error(validation.reason ? validation.reason : "云托管返回的内容不符合模板结构");
    }
    return document;
}
function validateGeneratedDocument(document, templateSections) {
    if (document.sections.length !== templateSections.length) {
        return {
            valid: false,
            reason: "生成结果与模板栏目数量不一致"
        };
    }
    const sectionNames = document.sections.map((section) => section.name);
    const templateNames = templateSections
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((section) => section.name);
    const matches = templateNames.every((name, index) => name === sectionNames[index]);
    if (!matches) {
        return {
            valid: false,
            reason: "生成结果与模板栏目名称不一致"
        };
    }
    const hasBadItems = document.sections.some((section) => !Array.isArray(section.items));
    if (hasBadItems) {
        return {
            valid: false,
            reason: "生成结果栏目条目格式不正确"
        };
    }
    return { valid: true };
}
function generateDailyReportDraft(rawInput, templateSections, reportDate) {
    const sentences = splitRawInput(rawInput);
    const completed = [];
    const risks = [];
    const plans = [];
    sentences.forEach((sentence) => {
        const category = categorizeDailySentence(sentence);
        if (category === "plan") {
            plans.push(sentence);
            return;
        }
        if (category === "risk") {
            risks.push(sentence);
            return;
        }
        completed.push(sentence);
    });
    const sections = templateSections
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((section) => {
        const category = getSectionCategory(section.name);
        if (category === "risk") {
            return createSection(section.name, section.order, uniqueItems(risks));
        }
        if (category === "plan") {
            return createSection(section.name, section.order, uniqueItems(plans));
        }
        return createSection(section.name, section.order, uniqueItems(completed));
    });
    return {
        title: (0, date_1.formatDailyTitle)(reportDate),
        sections
    };
}
function collectItemsByCategory(reports, category) {
    return reports.flatMap((report) => report.sections
        .filter((section) => getSectionCategory(section.name) === category)
        .flatMap((section) => section.items)
        .filter((item) => item !== "无"));
}
function generateWeeklyReportDraft(reports, templateSections, year, week) {
    const completedItems = uniqueItems(collectItemsByCategory(reports, "completed"));
    const riskItems = uniqueItems(collectItemsByCategory(reports, "risk"));
    const rawPlanItems = uniqueItems(collectItemsByCategory(reports, "plan"));
    const completedKeys = new Set(completedItems.map((item) => normalizeItem(item)));
    const planItems = rawPlanItems.filter((item) => !completedKeys.has(normalizeItem(item)));
    const sections = templateSections
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((section) => {
        const category = getSectionCategory(section.name);
        if (category === "risk") {
            return createSection(section.name, section.order, riskItems);
        }
        if (category === "plan") {
            return createSection(section.name, section.order, planItems);
        }
        return createSection(section.name, section.order, completedItems);
    });
    return {
        title: (0, date_1.formatWeeklyTitle)(year, week),
        sections
    };
}
async function generateDailyReport(input, options = {}) {
    const runtimeConfig = (0, runtime_1.getRuntimeConfig)(options.runtimeConfig);
    if ((0, runtime_1.isCloudRunEnabled)(runtimeConfig)) {
        return callCloudRun("/api/reports/daily/generate", input, input.templateSections, options);
    }
    return generateDailyReportDraft(input.rawInput, input.templateSections, input.reportDate);
}
async function generateWeeklyReport(input, options = {}) {
    const runtimeConfig = (0, runtime_1.getRuntimeConfig)(options.runtimeConfig);
    if ((0, runtime_1.isCloudRunEnabled)(runtimeConfig)) {
        return callCloudRun("/api/reports/weekly/generate", input, input.templateSections, options);
    }
    return generateWeeklyReportDraft(input.reports, input.templateSections, input.year, input.week);
}
