import { generateWeeklyReport } from "../../lib/services/ai"
import { listCurrentWeekDailyReports, getWeeklyReportByWeekKey, getWeeklyTemplate, saveWeeklyReport } from "../../lib/services/db"
import { createWeeklyWorkspaceState, finishWeeklyGeneration, startWeeklyGeneration } from "../../lib/services/weekly-workspace"
import type { ReportDocument, ReportSection, TemplateSection } from "../../lib/types/report"
import { getWeekKey } from "../../lib/utils/date"
import { renderReportDocument } from "../../lib/utils/render"

interface EditorSection {
  name: string
  order: number
  text: string
}

function toEditorSections(sections: ReportSection[]): EditorSection[] {
  return sections.map((section) => ({
    name: section.name,
    order: section.order,
    text: section.items.filter((item) => item !== "无").join("\n")
  }))
}

function toDocument(title: string, editorSections: EditorSection[]): ReportDocument {
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
  }
}

Page({
  data: {
    title: "周报工作台",
    hint: "点击生成本周周报，系统会根据本周日报自动提炼内容",
    templateSections: [] as TemplateSection[],
    weekKey: "",
    weekTitle: "",
    sourceCount: 0,
    sourceDailyIds: [] as string[],
    document: null as ReportDocument | null,
    previewText: "",
    editorSections: [] as EditorSection[],
    mode: "empty",
    isEditing: false,
    disableGenerate: false,
    disableFinish: true,
    popupVisible: false,
    popupText: ""
  },

  onShow() {
    void this.safeLoadPage()
  },

  async safeLoadPage() {
    try {
      await this.loadPage()
    } catch (error) {
      console.error("Failed to load weekly page.", error)
      wx.showToast({
        title: "周报页面加载失败",
        icon: "none"
      })
    }
  },

  async loadPage() {
    const weekInfo = getWeekKey()
    const [template, weeklyReport, sourceReports] = await Promise.all([
      getWeeklyTemplate(),
      getWeeklyReportByWeekKey(weekInfo.weekKey),
      listCurrentWeekDailyReports()
    ])
    const workspace = createWeeklyWorkspaceState()

    this.setData({
      templateSections: template.sections,
      weekKey: weekInfo.weekKey,
      weekTitle: `${weekInfo.year}年第${weekInfo.week}周`,
      sourceCount: sourceReports.length,
      sourceDailyIds: sourceReports.map((report) => report.id),
      document: weeklyReport,
      previewText: weeklyReport ? renderReportDocument(weeklyReport) : "",
      editorSections: weeklyReport ? toEditorSections(weeklyReport.sections) : [],
      mode: weeklyReport ? "preview" : workspace.mode,
      isEditing: false,
      disableGenerate: workspace.disableGenerate,
      disableFinish: weeklyReport ? false : workspace.disableFinish
    })
  },

  async handleGenerate() {
    const sourceReports = await listCurrentWeekDailyReports()

    if (sourceReports.length === 0) {
      wx.showToast({
        title: "本周暂无可汇总的日报",
        icon: "none"
      })
      return
    }

    const generatingState = startWeeklyGeneration({
      mode: this.data.mode as "empty" | "generating" | "preview",
      document: this.data.document,
      disableGenerate: this.data.disableGenerate,
      disableFinish: this.data.disableFinish
    })

    this.setData({
      mode: generatingState.mode,
      disableGenerate: generatingState.disableGenerate,
      disableFinish: generatingState.disableFinish,
      sourceCount: sourceReports.length,
      sourceDailyIds: sourceReports.map((report) => report.id),
      isEditing: false
    })

    try {
      const weekInfo = getWeekKey()
      const draft = await generateWeeklyReport({
        reports: sourceReports,
        templateSections: this.data.templateSections,
        year: weekInfo.year,
        week: weekInfo.week
      })
      const nextState = finishWeeklyGeneration(generatingState, draft)

      this.setData({
        mode: nextState.mode,
        document: draft,
        previewText: renderReportDocument(draft),
        editorSections: toEditorSections(draft.sections),
        disableGenerate: nextState.disableGenerate,
        disableFinish: nextState.disableFinish
      })
    } catch (error) {
      this.setData({
        mode: "empty",
        disableGenerate: false,
        disableFinish: true
      })
      wx.showToast({
        title: error instanceof Error ? error.message : "周报生成失败，请重试",
        icon: "none"
      })
    }
  },

  handleEdit() {
    if (!this.data.document) {
      return
    }

    this.setData({
      isEditing: true,
      editorSections: toEditorSections(this.data.document.sections)
    })
  },

  handleEditorInput(event: WechatMiniprogram.Input) {
    const index = Number(event.currentTarget.dataset.index)
    const editorSections = [...this.data.editorSections]
    editorSections[index] = {
      ...editorSections[index],
      text: event.detail.value
    }

    this.setData({ editorSections })
  },

  handleCancelEdit() {
    this.setData({
      isEditing: false,
      editorSections: this.data.document ? toEditorSections(this.data.document.sections) : []
    })
  },

  async handleFinish() {
    const document = this.data.isEditing
      ? toDocument(this.data.document ? this.data.document.title : "", this.data.editorSections)
      : this.data.document

    if (!document) {
      wx.showToast({
        title: "请先生成周报",
        icon: "none"
      })
      return
    }

    const weekInfo = getWeekKey()
    const saved = await saveWeeklyReport(
      weekInfo.weekKey,
      weekInfo.year,
      weekInfo.week,
      document,
      this.data.templateSections,
      this.data.sourceDailyIds
    )

    this.setData({
      document: saved,
      previewText: saved.finalText,
      editorSections: toEditorSections(saved.sections),
      isEditing: false,
      disableFinish: false,
      popupVisible: true,
      popupText: saved.finalText
    })
  },

  handlePopupClose() {
    this.setData({
      popupVisible: false
    })
  },

  noop() {
    return undefined
  },

  handlePopupCopy() {
    if (!this.data.popupText) {
      return
    }

    wx.setClipboardData({
      data: this.data.popupText,
      success: () => {
        this.handlePopupCopied()
      }
    })
  },

  handlePopupCopied() {
    wx.showToast({
      title: "已复制",
      icon: "success"
    })
  }
})
