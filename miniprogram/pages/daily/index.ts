import { generateDailyReportDraft, validateGeneratedDocument } from "../../lib/services/ai"
import { createDailyWorkspaceState, finishDailyGeneration, startDailyGeneration } from "../../lib/services/daily-workspace"
import { getDailyReportByDate, getDailyTemplate, saveDailyReport } from "../../lib/services/db"
import type { ReportDocument, ReportSection, TemplateSection } from "../../lib/types/report"
import { getTodayDateKey } from "../../lib/utils/date"
import { renderReportDocument } from "../../lib/utils/render"
import { DAILY_INPUT_LIMIT, validateDailyRawInput } from "../../lib/utils/validation"

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
    title: "日报工作台",
    hint: "输入今天的工作内容，点击 AI整理，即可生成日报",
    rawInput: "",
    reportDate: "",
    limit: DAILY_INPUT_LIMIT,
    rawInputCount: 0,
    templateSections: [] as TemplateSection[],
    document: null as ReportDocument | null,
    previewText: "",
    editorSections: [] as EditorSection[],
    mode: "input",
    isEditing: false,
    disableGenerate: false,
    disableFinish: true,
    popupVisible: false,
    popupText: ""
  },

  onShow() {
    const reportDate = getTodayDateKey()
    const template = getDailyTemplate()
    const todayReport = getDailyReportByDate(reportDate)
    const workspace = createDailyWorkspaceState(todayReport)

    this.setData({
      reportDate,
      templateSections: template.sections,
      document: workspace.document,
      previewText: workspace.document ? renderReportDocument(workspace.document) : "",
      editorSections: workspace.document ? toEditorSections(workspace.document.sections) : [],
      mode: workspace.mode,
      isEditing: false,
      disableGenerate: workspace.disableGenerate,
      disableFinish: workspace.disableFinish
    })
  },

  handleInput(event: WechatMiniprogram.Input) {
    const rawInput = event.detail.value

    this.setData({
      rawInput,
      rawInputCount: rawInput.length
    })
  },

  handleGenerate() {
    const validation = validateDailyRawInput(this.data.rawInput)

    if (!validation.valid) {
      wx.showToast({
        title: validation.reason ?? "输入不合法",
        icon: "none"
      })
      return
    }

    if (!this.data.rawInput.trim()) {
      wx.showToast({
        title: "请先输入今天的工作内容",
        icon: "none"
      })
      return
    }

    const generatingState = startDailyGeneration({
      mode: this.data.mode as "input" | "generating" | "preview",
      document: this.data.document,
      disableGenerate: this.data.disableGenerate,
      disableFinish: this.data.disableFinish
    })

    this.setData({
      mode: generatingState.mode,
      disableGenerate: generatingState.disableGenerate,
      disableFinish: generatingState.disableFinish,
      isEditing: false
    })

    const draft = generateDailyReportDraft(
      this.data.rawInput,
      this.data.templateSections,
      this.data.reportDate
    )
    const structureValidation = validateGeneratedDocument(draft, this.data.templateSections)

    if (!structureValidation.valid) {
      this.setData({
        mode: "input",
        disableGenerate: false,
        disableFinish: true
      })
      wx.showToast({
        title: "整理失败，请重试",
        icon: "none"
      })
      return
    }

    const nextState = finishDailyGeneration(generatingState, draft)

    this.setData({
      mode: nextState.mode,
      document: draft,
      previewText: renderReportDocument(draft),
      editorSections: toEditorSections(draft.sections),
      disableGenerate: nextState.disableGenerate,
      disableFinish: nextState.disableFinish
    })
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

  handleFinish() {
    const document = this.data.isEditing
      ? toDocument(this.data.document?.title ?? "", this.data.editorSections)
      : this.data.document

    if (!document) {
      wx.showToast({
        title: "请先进行 AI整理",
        icon: "none"
      })
      return
    }

    const saved = saveDailyReport(this.data.reportDate, document, this.data.templateSections)

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
    })
  },

  handlePopupClose() {
    this.setData({
      popupVisible: false
    })
  },

  handlePopupCopied() {
    wx.showToast({
      title: "已复制",
      icon: "success"
    })
  }
})
