import {
  addTemplateSection,
  removeTemplateSection,
  renameTemplateSection,
  reorderTemplateSections
} from "../../lib/services/template"
import { getWeeklyTemplate, saveWeeklyTemplate } from "../../lib/services/db"
import type { TemplateSection } from "../../lib/types/report"
import { TEMPLATE_SECTION_LIMIT, validateTemplateSections } from "../../lib/utils/validation"

interface CardRect {
  top: number
  bottom: number
  height: number
  middle: number
}

interface DragState {
  dragging: boolean
  dragIndex: number
  dragTargetIndex: number
  dragStartY: number
  dragCurrentY: number
  dragOffsetY: number
  cardStyles: string[]
  hasUnsavedChanges: boolean
}

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

        const value = typeof result.content === "string" ? result.content.trim() : ""

        if (!value) {
          wx.showToast({
            title: "栏目名称不能为空",
            icon: "none"
          })
          resolve(null)
          return
        }

        resolve(value)
      }
    })
  })
}

function confirmRemove(): Promise<boolean> {
  return new Promise((resolve) => {
    wx.showModal({
      title: "确认删除",
      content: "删除后将无法恢复该栏目，是否继续？",
      success: (result) => {
        resolve(result.confirm)
      }
    })
  })
}

function buildCardStyles(
  sections: TemplateSection[],
  rects: CardRect[],
  fromIndex: number,
  targetIndex: number,
  offsetY: number
) {
  const nextCardStyles = sections.map(() => "")

  if (fromIndex < 0 || fromIndex >= sections.length) {
    return nextCardStyles
  }

  nextCardStyles[fromIndex] = `transform: translateY(${offsetY}px) scale(1.01);`

  if (targetIndex > fromIndex) {
    for (let index = fromIndex + 1; index <= targetIndex; index += 1) {
      const currentRect = rects[index]
      const previousRect = rects[index - 1]

      if (currentRect && previousRect) {
        const distance = currentRect.middle - previousRect.middle
        nextCardStyles[index] = `transform: translateY(-${distance}px);`
      }
    }
  }

  if (targetIndex < fromIndex) {
    for (let index = targetIndex; index < fromIndex; index += 1) {
      const currentRect = rects[index]
      const nextRect = rects[index + 1]

      if (currentRect && nextRect) {
        const distance = nextRect.middle - currentRect.middle
        nextCardStyles[index] = `transform: translateY(${distance}px);`
      }
    }
  }

  return nextCardStyles
}

Page({
  _cardRects: [] as CardRect[],

  data: {
    title: "周报模板管理",
    sections: [] as TemplateSection[],
    dragging: false,
    dragIndex: -1,
    dragTargetIndex: -1,
    dragStartY: 0,
    dragCurrentY: 0,
    dragOffsetY: 0,
    cardStyles: [] as string[],
    hasUnsavedChanges: false
  } as {
    title: string
    sections: TemplateSection[]
  } & DragState,

  onLoad() {
    void this.safeLoadTemplate()
  },

  async safeLoadTemplate() {
    try {
      const template = await getWeeklyTemplate()

      this.setData(
        {
          sections: template.sections,
          cardStyles: template.sections.map(() => ""),
          hasUnsavedChanges: false
        },
        () => {
          this.captureCardRects()
        }
      )
    } catch (error) {
      console.error("Failed to load weekly template page.", error)
      wx.showToast({
        title: "周报模板加载失败",
        icon: "none"
      })
    }
  },

  captureCardRects(done?: () => void) {
    const query = wx.createSelectorQuery()

    this.data.sections.forEach((_, index) => {
      query.select(`#template-card-${index}`).boundingClientRect()
    })

    query.exec((rects) => {
      this._cardRects = (rects || [])
        .filter(Boolean)
        .map((rect: WechatMiniprogram.BoundingClientRectCallbackResult) => ({
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          middle: rect.top + rect.height / 2
        }))

      if (done) {
        done()
      }
    })
  },

  hasUsableCardRects() {
    return (
      this._cardRects.length === this.data.sections.length &&
      this._cardRects.every((rect) =>
        typeof rect.top === "number" &&
        typeof rect.bottom === "number" &&
        typeof rect.middle === "number"
      )
    )
  },

  ensureCardRects(done: () => void) {
    if (this.hasUsableCardRects()) {
      done()
      return
    }

    this.captureCardRects(() => {
      if (this.hasUsableCardRects()) {
        done()
        return
      }

      wx.showToast({
        title: "排序区域加载中，请稍后重试",
        icon: "none"
      })
    })
  },

  async handleAdd() {
    if (this.data.sections.length >= TEMPLATE_SECTION_LIMIT) {
      wx.showToast({
        title: "最多只能新增 6 个栏目",
        icon: "none"
      })
      return
    }

    const name = await askForSectionName("新增栏目", "请输入栏目名称")

    if (!name) {
      return
    }

    const nextSections = addTemplateSection(this.data.sections, name)
    const validation = validateTemplateSections(nextSections.map((section) => section.name))

    if (!validation.valid) {
      wx.showToast({
        title: validation.reason ? validation.reason : "栏目设置无效",
        icon: "none"
      })
      return
    }

    this.setData(
      {
        sections: nextSections,
        cardStyles: nextSections.map(() => ""),
        hasUnsavedChanges: true
      },
      () => {
        this.captureCardRects()
      }
    )
  },

  async handleRename(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const current = this.data.sections.find((section) => section.id === id)
    const name = await askForSectionName("编辑栏目", current ? current.name : "")

    if (!name) {
      return
    }

    const nextSections = renameTemplateSection(this.data.sections, id, name)
    const validation = validateTemplateSections(nextSections.map((section) => section.name))

    if (!validation.valid) {
      wx.showToast({
        title: validation.reason ? validation.reason : "栏目设置无效",
        icon: "none"
      })
      return
    }

    this.setData(
      {
        sections: nextSections,
        cardStyles: nextSections.map(() => ""),
        hasUnsavedChanges: true
      },
      () => {
        this.captureCardRects()
      }
    )
  },

  async handleRemove(event: WechatMiniprogram.TouchEvent) {
    if (this.data.sections.length <= 1) {
      wx.showToast({
        title: "至少保留 1 个栏目",
        icon: "none"
      })
      return
    }

    const confirmed = await confirmRemove()

    if (!confirmed) {
      return
    }

    const id = event.currentTarget.dataset.id as string
    const nextSections = removeTemplateSection(this.data.sections, id)

    this.setData(
      {
        sections: nextSections,
        cardStyles: nextSections.map(() => ""),
        hasUnsavedChanges: true
      },
      () => {
        this.captureCardRects()
      }
    )
  },

  handleDragStart(event: WechatMiniprogram.TouchEvent) {
    const index = Number(event.currentTarget.dataset.index)
    const startY = event.touches[0].clientY

    this.ensureCardRects(() => {
      const rect = this._cardRects[index]

      if (!rect) {
        wx.showToast({
          title: "排序暂不可用，请重试",
          icon: "none"
        })
        return
      }

      this.setData({
        dragging: true,
        dragIndex: index,
        dragTargetIndex: index,
        dragStartY: startY,
        dragCurrentY: startY,
        dragOffsetY: 0,
        cardStyles: buildCardStyles(this.data.sections, this._cardRects, index, index, 0)
      })
    })
  },

  handleDragMove(event: WechatMiniprogram.TouchEvent) {
    if (!this.data.dragging || this.data.dragIndex < 0) {
      return
    }

    const currentY = event.touches[0].clientY
    const offsetY = currentY - this.data.dragStartY
    const draggingRect = this._cardRects[this.data.dragIndex]

    if (!draggingRect) {
      return
    }

    const draggingMiddle = draggingRect.middle + offsetY
    let targetIndex = this.data.dragIndex
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < this._cardRects.length; index += 1) {
      if (index === this.data.dragIndex) {
        continue
      }

      const distance = Math.abs(draggingMiddle - this._cardRects[index].middle)

      if (distance < nearestDistance) {
        nearestDistance = distance
        targetIndex = index
      }
    }

    if (draggingMiddle <= this._cardRects[0].middle) {
      targetIndex = 0
    }

    if (draggingMiddle >= this._cardRects[this._cardRects.length - 1].middle) {
      targetIndex = this._cardRects.length - 1
    }

    this.setData({
      dragCurrentY: currentY,
      dragOffsetY: offsetY,
      dragTargetIndex: targetIndex,
      cardStyles: buildCardStyles(this.data.sections, this._cardRects, this.data.dragIndex, targetIndex, offsetY)
    })
  },

  handleDragEnd() {
    if (!this.data.dragging || this.data.dragIndex < 0) {
      return
    }

    const from = this.data.dragIndex
    const to = this.data.dragTargetIndex
    const nextSections =
      from === to
        ? this.data.sections
        : reorderTemplateSections(this.data.sections, from, to)

    this.setData(
      {
        sections: nextSections,
        dragging: false,
        dragIndex: -1,
        dragTargetIndex: -1,
        dragStartY: 0,
        dragCurrentY: 0,
        dragOffsetY: 0,
        cardStyles: nextSections.map(() => ""),
        hasUnsavedChanges: from === to ? this.data.hasUnsavedChanges : true
      },
      () => {
        this.captureCardRects()
      }
    )
  },

  handleDragCancel() {
    this.setData({
      dragging: false,
      dragIndex: -1,
      dragTargetIndex: -1,
      dragStartY: 0,
      dragCurrentY: 0,
      dragOffsetY: 0,
      cardStyles: this.data.sections.map(() => "")
    })
  },

  async handleSave() {
    try {
      await saveWeeklyTemplate(this.data.sections)

      this.setData({
        hasUnsavedChanges: false
      })

      wx.showToast({
        title: "周报模板已保存",
        icon: "success"
      })
    } catch (error) {
      console.error("Failed to save weekly template.", error)
      wx.showToast({
        title: "保存失败，请重试",
        icon: "none"
      })
    }
  }
})
