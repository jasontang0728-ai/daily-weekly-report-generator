import {
  addTemplateSection,
  removeTemplateSection,
  renameTemplateSection,
  reorderTemplateSections
} from "../../lib/services/template"
import { getDailyTemplate, saveDailyTemplate } from "../../lib/services/db"
import type { TemplateSection } from "../../lib/types/report"
import { TEMPLATE_SECTION_LIMIT, validateTemplateSections } from "../../lib/utils/validation"

function askForSectionName(title: string, placeholder = ""): Promise<string | null> {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      editable: true,
      placeholderText: placeholder,
      success: (result) => {
        if (!result.confirm) {
          resolve(null)
          return
        }

        resolve(result.content.trim())
      }
    })
  })
}

Page({
  data: {
    title: "日报模板管理",
    sections: [] as TemplateSection[]
  },

  onShow() {
    this.setData({
      sections: getDailyTemplate().sections
    })
  },

  async handleAdd() {
    if (this.data.sections.length >= TEMPLATE_SECTION_LIMIT) {
      wx.showToast({ title: "最多只能添加 6 个栏目", icon: "none" })
      return
    }

    const name = await askForSectionName("新增栏目", "请输入栏目名称")

    if (!name) {
      return
    }

    const nextSections = addTemplateSection(this.data.sections, name)
    const validation = validateTemplateSections(nextSections.map((section) => section.name))

    if (!validation.valid) {
      wx.showToast({ title: validation.reason ?? "栏目设置无效", icon: "none" })
      return
    }

    this.setData({ sections: nextSections })
  },

  async handleRename(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    const id = event.detail.id
    const current = this.data.sections.find((section) => section.id === id)
    const name = await askForSectionName("重命名栏目", current?.name ?? "")

    if (!name) {
      return
    }

    const nextSections = renameTemplateSection(this.data.sections, id, name)
    const validation = validateTemplateSections(nextSections.map((section) => section.name))

    if (!validation.valid) {
      wx.showToast({ title: validation.reason ?? "栏目设置无效", icon: "none" })
      return
    }

    this.setData({ sections: nextSections })
  },

  handleRemove(event: WechatMiniprogram.CustomEvent<{ id: string }>) {
    if (this.data.sections.length <= 1) {
      wx.showToast({ title: "至少保留 1 个栏目", icon: "none" })
      return
    }

    this.setData({
      sections: removeTemplateSection(this.data.sections, event.detail.id)
    })
  },

  handleMoveUp(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const index = Number(event.detail.index)
    if (index <= 0) {
      return
    }

    this.setData({
      sections: reorderTemplateSections(this.data.sections, index, index - 1)
    })
  },

  handleMoveDown(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
    const index = Number(event.detail.index)
    if (index >= this.data.sections.length - 1) {
      return
    }

    this.setData({
      sections: reorderTemplateSections(this.data.sections, index, index + 1)
    })
  },

  handleSave() {
    saveDailyTemplate(this.data.sections)
    wx.showToast({ title: "日报模板已保存", icon: "success" })
  }
})
