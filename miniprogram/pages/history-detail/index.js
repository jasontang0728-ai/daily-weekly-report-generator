"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../lib/services/db");
Page({
    data: {
        title: "",
        finalText: "",
        type: "daily"
    },
    onLoad(query) {
        const type = query.type === "weekly" ? "weekly" : "daily";
        void this.safeLoadDetail(type, query.id);
    },
    async safeLoadDetail(type, id) {
        try {
            await this.loadDetail(type, id);
        }
        catch (error) {
            console.error("Failed to load history detail.", error);
            wx.showToast({
                title: "历史详情加载失败",
                icon: "none"
            });
        }
    },
    async loadDetail(type, id) {
        const detail = await (0, db_1.getHistoryDetail)(type, id);
        this.setData({
            type,
            title: detail ? detail.title : "",
            finalText: detail ? detail.finalText : ""
        });
    },
    handleCopy() {
        if (!this.data.finalText) {
            return;
        }
        wx.setClipboardData({
            data: this.data.finalText,
            success: () => {
                wx.showToast({
                    title: "已复制",
                    icon: "success"
                });
            }
        });
    }
});
