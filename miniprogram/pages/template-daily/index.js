"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const template_1 = require("../../lib/services/template");
const db_1 = require("../../lib/services/db");
const validation_1 = require("../../lib/utils/validation");
let cardRects = [];
function askForSectionName(title, placeholder = "") {
    return new Promise((resolve) => {
        wx.showModal({
            title,
            editable: true,
            placeholderText: placeholder,
            success: (result) => {
                if (!result.confirm) {
                    resolve(null);
                    return;
                }
                const value = typeof result.content === "string" ? result.content.trim() : "";
                if (!value) {
                    wx.showToast({
                        title: "栏目名称不能为空",
                        icon: "none"
                    });
                    resolve(null);
                    return;
                }
                resolve(value);
            }
        });
    });
}
function confirmRemove() {
    return new Promise((resolve) => {
        wx.showModal({
            title: "确认删除",
            content: "删除后将无法恢复该栏目，是否继续？",
            success: (result) => {
                resolve(result.confirm);
            }
        });
    });
}
function buildCardStyles(sections, rects, fromIndex, targetIndex, offsetY) {
    const nextCardStyles = sections.map(() => "");
    if (fromIndex < 0 || fromIndex >= sections.length) {
        return nextCardStyles;
    }
    nextCardStyles[fromIndex] = `transform: translateY(${offsetY}px) scale(1.01);`;
    if (targetIndex > fromIndex) {
        for (let index = fromIndex + 1; index <= targetIndex; index += 1) {
            const currentRect = rects[index];
            const previousRect = rects[index - 1];
            if (currentRect && previousRect) {
                const distance = currentRect.middle - previousRect.middle;
                nextCardStyles[index] = `transform: translateY(-${distance}px);`;
            }
        }
    }
    if (targetIndex < fromIndex) {
        for (let index = targetIndex; index < fromIndex; index += 1) {
            const currentRect = rects[index];
            const nextRect = rects[index + 1];
            if (currentRect && nextRect) {
                const distance = nextRect.middle - currentRect.middle;
                nextCardStyles[index] = `transform: translateY(${distance}px);`;
            }
        }
    }
    return nextCardStyles;
}
Page({
    data: {
        title: "日报模板管理",
        sections: [],
        dragging: false,
        dragIndex: -1,
        dragTargetIndex: -1,
        dragStartY: 0,
        dragCurrentY: 0,
        dragOffsetY: 0,
        cardStyles: [],
        hasUnsavedChanges: false
    },
    onLoad() {
        void this.safeLoadTemplate();
    },
    async safeLoadTemplate() {
        try {
            const template = await (0, db_1.getDailyTemplate)();
            this.setData({
                sections: template.sections,
                cardStyles: template.sections.map(() => ""),
                hasUnsavedChanges: false
            }, () => {
                this.captureCardRects();
            });
        }
        catch (error) {
            console.error("Failed to load daily template page.", error);
            wx.showToast({
                title: "日报模板加载失败",
                icon: "none"
            });
        }
    },
    captureCardRects(done) {
        const query = wx.createSelectorQuery();
        this.data.sections.forEach((_, index) => {
            query.select(`#template-card-${index}`).boundingClientRect();
        });
        query.exec((rects) => {
            cardRects = (rects || [])
                .filter(Boolean)
                .map((rect) => ({
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height,
                middle: rect.top + rect.height / 2
            }));
            if (done) {
                done();
            }
        });
    },
    hasUsableCardRects() {
        return (cardRects.length === this.data.sections.length &&
            cardRects.every((rect) => typeof rect.top === "number" &&
                typeof rect.bottom === "number" &&
                typeof rect.middle === "number"));
    },
    ensureCardRects(done) {
        if (this.hasUsableCardRects()) {
            done();
            return;
        }
        this.captureCardRects(() => {
            if (this.hasUsableCardRects()) {
                done();
                return;
            }
            wx.showToast({
                title: "排序区域加载中，请稍后重试",
                icon: "none"
            });
        });
    },
    async handleAdd() {
        if (this.data.sections.length >= validation_1.TEMPLATE_SECTION_LIMIT) {
            wx.showToast({
                title: "最多只能新增 6 个栏目",
                icon: "none"
            });
            return;
        }
        const name = await askForSectionName("新增栏目", "请输入栏目名称");
        if (!name) {
            return;
        }
        const nextSections = (0, template_1.addTemplateSection)(this.data.sections, name);
        const validation = (0, validation_1.validateTemplateSections)(nextSections.map((section) => section.name));
        if (!validation.valid) {
            wx.showToast({
                title: validation.reason ? validation.reason : "栏目设置无效",
                icon: "none"
            });
            return;
        }
        this.setData({
            sections: nextSections,
            cardStyles: nextSections.map(() => ""),
            hasUnsavedChanges: true
        }, () => {
            this.captureCardRects();
        });
    },
    async handleRename(event) {
        const id = event.currentTarget.dataset.id;
        const current = this.data.sections.find((section) => section.id === id);
        const name = await askForSectionName("编辑栏目", current ? current.name : "");
        if (!name) {
            return;
        }
        const nextSections = (0, template_1.renameTemplateSection)(this.data.sections, id, name);
        const validation = (0, validation_1.validateTemplateSections)(nextSections.map((section) => section.name));
        if (!validation.valid) {
            wx.showToast({
                title: validation.reason ? validation.reason : "栏目设置无效",
                icon: "none"
            });
            return;
        }
        this.setData({
            sections: nextSections,
            cardStyles: nextSections.map(() => ""),
            hasUnsavedChanges: true
        }, () => {
            this.captureCardRects();
        });
    },
    async handleRemove(event) {
        if (this.data.sections.length <= 1) {
            wx.showToast({
                title: "至少保留 1 个栏目",
                icon: "none"
            });
            return;
        }
        const confirmed = await confirmRemove();
        if (!confirmed) {
            return;
        }
        const id = event.currentTarget.dataset.id;
        const nextSections = (0, template_1.removeTemplateSection)(this.data.sections, id);
        this.setData({
            sections: nextSections,
            cardStyles: nextSections.map(() => ""),
            hasUnsavedChanges: true
        }, () => {
            this.captureCardRects();
        });
    },
    handleDragStart(event) {
        const index = Number(event.currentTarget.dataset.index);
        const startY = event.touches[0].clientY;
        this.ensureCardRects(() => {
            const rect = cardRects[index];
            if (!rect) {
                wx.showToast({
                    title: "排序暂不可用，请重试",
                    icon: "none"
                });
                return;
            }
            this.setData({
                dragging: true,
                dragIndex: index,
                dragTargetIndex: index,
                dragStartY: startY,
                dragCurrentY: startY,
                dragOffsetY: 0,
                cardStyles: buildCardStyles(this.data.sections, cardRects, index, index, 0)
            });
        });
    },
    handleDragMove(event) {
        if (!this.data.dragging || this.data.dragIndex < 0) {
            return;
        }
        const currentY = event.touches[0].clientY;
        const offsetY = currentY - this.data.dragStartY;
        const draggingRect = cardRects[this.data.dragIndex];
        if (!draggingRect) {
            return;
        }
        const draggingMiddle = draggingRect.middle + offsetY;
        let targetIndex = this.data.dragIndex;
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (let index = 0; index < cardRects.length; index += 1) {
            if (index === this.data.dragIndex) {
                continue;
            }
            const distance = Math.abs(draggingMiddle - cardRects[index].middle);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                targetIndex = index;
            }
        }
        if (draggingMiddle <= cardRects[0].middle) {
            targetIndex = 0;
        }
        if (draggingMiddle >= cardRects[cardRects.length - 1].middle) {
            targetIndex = cardRects.length - 1;
        }
        this.setData({
            dragCurrentY: currentY,
            dragOffsetY: offsetY,
            dragTargetIndex: targetIndex,
            cardStyles: buildCardStyles(this.data.sections, cardRects, this.data.dragIndex, targetIndex, offsetY)
        });
    },
    handleDragEnd() {
        if (!this.data.dragging || this.data.dragIndex < 0) {
            return;
        }
        const from = this.data.dragIndex;
        const to = this.data.dragTargetIndex;
        const nextSections = from === to
            ? this.data.sections
            : (0, template_1.reorderTemplateSections)(this.data.sections, from, to);
        this.setData({
            sections: nextSections,
            dragging: false,
            dragIndex: -1,
            dragTargetIndex: -1,
            dragStartY: 0,
            dragCurrentY: 0,
            dragOffsetY: 0,
            cardStyles: nextSections.map(() => ""),
            hasUnsavedChanges: from === to ? this.data.hasUnsavedChanges : true
        }, () => {
            this.captureCardRects();
        });
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
        });
    },
    async handleSave() {
        try {
            await (0, db_1.saveDailyTemplate)(this.data.sections);
            this.setData({
                hasUnsavedChanges: false
            });
            wx.showToast({
                title: "日报模板已保存",
                icon: "success"
            });
        }
        catch (error) {
            console.error("Failed to save daily template.", error);
            wx.showToast({
                title: "保存失败，请重试",
                icon: "none"
            });
        }
    }
});
