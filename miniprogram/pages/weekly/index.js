"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_1 = require("../../lib/services/ai");
const db_1 = require("../../lib/services/db");
const weekly_workspace_1 = require("../../lib/services/weekly-workspace");
const date_1 = require("../../lib/utils/date");
const render_1 = require("../../lib/utils/render");
function toEditorSections(sections) {
    return sections.map((section) => ({
        name: section.name,
        order: section.order,
        text: section.items.filter((item) => item !== "无").join("\n")
    }));
}
function toDocument(title, editorSections) {
    return {
        title,
        sections: editorSections.map((section) => ({
            name: section.name,
            order: section.order,
            items: section.text
                .split(/\n+/)
                .map((item) => item.trim())
                .filter(Boolean)
        }))
    };
}
Page({
    data: {
        title: "周报工作台",
        hint: "点击生成本周周报，系统会根据本周日报自动提炼内容",
        templateSections: [],
        weekKey: "",
        weekTitle: "",
        sourceCount: 0,
        sourceDailyIds: [],
        document: null,
        previewText: "",
        editorSections: [],
        mode: "empty",
        isEditing: false,
        disableGenerate: false,
        disableFinish: true,
        popupVisible: false,
        popupText: ""
    },
    onShow() {
        void this.safeLoadPage();
    },
    async safeLoadPage() {
        try {
            await this.loadPage();
        }
        catch (error) {
            console.error("Failed to load weekly page.", error);
            wx.showToast({
                title: "周报页面加载失败",
                icon: "none"
            });
        }
    },
    async loadPage() {
        const weekInfo = (0, date_1.getWeekKey)();
        const [template, weeklyReport, sourceReports] = await Promise.all([
            (0, db_1.getWeeklyTemplate)(),
            (0, db_1.getWeeklyReportByWeekKey)(weekInfo.weekKey),
            (0, db_1.listCurrentWeekDailyReports)()
        ]);
        const workspace = (0, weekly_workspace_1.createWeeklyWorkspaceState)();
        this.setData({
            templateSections: template.sections,
            weekKey: weekInfo.weekKey,
            weekTitle: `${weekInfo.year}年第${weekInfo.week}周`,
            sourceCount: sourceReports.length,
            sourceDailyIds: sourceReports.map((report) => report.id),
            document: weeklyReport,
            previewText: weeklyReport ? (0, render_1.renderReportDocument)(weeklyReport) : "",
            editorSections: weeklyReport ? toEditorSections(weeklyReport.sections) : [],
            mode: weeklyReport ? "preview" : workspace.mode,
            isEditing: false,
            disableGenerate: workspace.disableGenerate,
            disableFinish: weeklyReport ? false : workspace.disableFinish
        });
    },
    async handleGenerate() {
        const sourceReports = await (0, db_1.listCurrentWeekDailyReports)();
        if (sourceReports.length === 0) {
            wx.showToast({
                title: "本周暂无可汇总的日报",
                icon: "none"
            });
            return;
        }
        const generatingState = (0, weekly_workspace_1.startWeeklyGeneration)({
            mode: this.data.mode,
            document: this.data.document,
            disableGenerate: this.data.disableGenerate,
            disableFinish: this.data.disableFinish
        });
        this.setData({
            mode: generatingState.mode,
            disableGenerate: generatingState.disableGenerate,
            disableFinish: generatingState.disableFinish,
            sourceCount: sourceReports.length,
            sourceDailyIds: sourceReports.map((report) => report.id),
            isEditing: false
        });
        try {
            const weekInfo = (0, date_1.getWeekKey)();
            const draft = await (0, ai_1.generateWeeklyReport)({
                reports: sourceReports,
                templateSections: this.data.templateSections,
                year: weekInfo.year,
                week: weekInfo.week
            });
            const nextState = (0, weekly_workspace_1.finishWeeklyGeneration)(generatingState, draft);
            this.setData({
                mode: nextState.mode,
                document: draft,
                previewText: (0, render_1.renderReportDocument)(draft),
                editorSections: toEditorSections(draft.sections),
                disableGenerate: nextState.disableGenerate,
                disableFinish: nextState.disableFinish
            });
        }
        catch (error) {
            this.setData({
                mode: "empty",
                disableGenerate: false,
                disableFinish: true
            });
            wx.showToast({
                title: error instanceof Error ? error.message : "周报生成失败，请重试",
                icon: "none"
            });
        }
    },
    handleEdit() {
        if (!this.data.document) {
            return;
        }
        this.setData({
            isEditing: true,
            editorSections: toEditorSections(this.data.document.sections)
        });
    },
    handleEditorInput(event) {
        const index = Number(event.currentTarget.dataset.index);
        const editorSections = [...this.data.editorSections];
        editorSections[index] = {
            ...editorSections[index],
            text: event.detail.value
        };
        this.setData({ editorSections });
    },
    handleCancelEdit() {
        this.setData({
            isEditing: false,
            editorSections: this.data.document ? toEditorSections(this.data.document.sections) : []
        });
    },
    async handleFinish() {
        const document = this.data.isEditing
            ? toDocument(this.data.document ? this.data.document.title : "", this.data.editorSections)
            : this.data.document;
        if (!document) {
            wx.showToast({
                title: "请先生成周报",
                icon: "none"
            });
            return;
        }
        const weekInfo = (0, date_1.getWeekKey)();
        const saved = await (0, db_1.saveWeeklyReport)(weekInfo.weekKey, weekInfo.year, weekInfo.week, document, this.data.templateSections, this.data.sourceDailyIds);
        this.setData({
            document: saved,
            previewText: saved.finalText,
            editorSections: toEditorSections(saved.sections),
            isEditing: false,
            disableFinish: false,
            popupVisible: true,
            popupText: saved.finalText
        });
    },
    handlePopupClose() {
        this.setData({
            popupVisible: false
        });
    },
    noop() {
        return undefined;
    },
    handlePopupCopy() {
        if (!this.data.popupText) {
            return;
        }
        wx.setClipboardData({
            data: this.data.popupText,
            success: () => {
                this.handlePopupCopied();
            }
        });
    },
    handlePopupCopied() {
        wx.showToast({
            title: "已复制",
            icon: "success"
        });
    }
});
