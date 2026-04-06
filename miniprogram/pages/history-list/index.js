"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const history_1 = require("../../lib/services/history");
Page({
    data: {
        type: "daily",
        title: "日报历史",
        items: []
    },
    onLoad(query) {
        const type = query.type === "weekly" ? "weekly" : "daily";
        this.setData({
            type,
            title: type === "weekly" ? "周报历史" : "日报历史"
        });
        void this.refreshList(type);
    },
    onShow() {
        void this.refreshList(this.data.type);
    },
    async refreshList(type) {
        this.setData({
            items: await (0, history_1.listHistory)(type)
        });
    },
    handleOpen(event) {
        const id = event.currentTarget.dataset.id;
        const type = event.currentTarget.dataset.type;
        wx.navigateTo({
            url: `/pages/history-detail/index?type=${type}&id=${id}`
        });
    }
});
