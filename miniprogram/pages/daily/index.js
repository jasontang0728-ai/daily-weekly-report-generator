"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ai_1 = require("../../lib/services/ai");
const daily_workspace_1 = require("../../lib/services/daily-workspace");
const db_1 = require("../../lib/services/db");
const date_1 = require("../../lib/utils/date");
const render_1 = require("../../lib/utils/render");
const validation_1 = require("../../lib/utils/validation");
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
        title: "日报工作台",
        hint: "输入今天的工作内容，点击 AI 整理，即可生成日报",
        rawInput: "",
        reportDate: "",
        limit: validation_1.DAILY_INPUT_LIMIT,
        rawInputCount: 0,
        templateSections: [],
        document: null,
        previewText: "",
        editorSections: [],
        mode: "input",
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
            console.error("Failed to load daily page.", error);
            wx.showToast({
                title: "日报页面加载失败",
                icon: "none"
            });
        }
    },
    async loadPage() {
        const reportDate = (0, date_1.getTodayDateKey)();
        const [template, todayReport] = await Promise.all([
            (0, db_1.getDailyTemplate)(),
            (0, db_1.getDailyReportByDate)(reportDate)
        ]);
        const workspace = (0, daily_workspace_1.createDailyWorkspaceState)(todayReport);
        this.setData({
            reportDate,
            templateSections: template.sections,
            document: workspace.document,
            previewText: workspace.document ? (0, render_1.renderReportDocument)(workspace.document) : "",
            editorSections: workspace.document ? toEditorSections(workspace.document.sections) : [],
            mode: workspace.mode,
            isEditing: false,
            disableGenerate: workspace.disableGenerate,
            disableFinish: workspace.disableFinish
        });
    },
    handleInput(event) {
        const rawInput = event.detail.value;
        this.setData({
            rawInput,
            rawInputCount: rawInput.length
        });
    },
    async handleGenerate() {
        const validation = (0, validation_1.validateDailyRawInput)(this.data.rawInput);
        if (!validation.valid) {
            wx.showToast({
                title: validation.reason ? validation.reason : "输入不合法",
                icon: "none"
            });
            return;
        }
        if (!this.data.rawInput.trim()) {
            wx.showToast({
                title: "请先输入今天的工作内容",
                icon: "none"
            });
            return;
        }
        const generatingState = (0, daily_workspace_1.startDailyGeneration)({
            mode: this.data.mode,
            document: this.data.document,
            disableGenerate: this.data.disableGenerate,
            disableFinish: this.data.disableFinish
        });
        this.setData({
            mode: generatingState.mode,
            disableGenerate: generatingState.disableGenerate,
            disableFinish: generatingState.disableFinish,
            isEditing: false
        });
        try {
            const draft = await (0, ai_1.generateDailyReport)({
                rawInput: this.data.rawInput,
                templateSections: this.data.templateSections,
                reportDate: this.data.reportDate
            });
            const nextState = (0, daily_workspace_1.finishDailyGeneration)(generatingState, draft);
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
                mode: "input",
                disableGenerate: false,
                disableFinish: true
            });
            wx.showToast({
                title: error instanceof Error ? error.message : "AI 整理失败，请重试",
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
                title: "请先进行 AI 整理",
                icon: "none"
            });
            return;
        }
        const saved = await (0, db_1.saveDailyReport)(this.data.reportDate, document, this.data.templateSections);
        this.setData({
            document: saved,
            previewText: saved.finalText,
            editorSections: toEditorSections(saved.sections),
            isEditing: false,
            rawInput: "",
            rawInputCount: 0,
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
