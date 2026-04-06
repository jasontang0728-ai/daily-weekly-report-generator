"use strict";
Page({
    data: {
        entries: [
            {
                title: "日报历史",
                subtitle: "查看已完成日报并复制成品",
                path: "/pages/history-list/index?type=daily"
            },
            {
                title: "周报历史",
                subtitle: "查看已完成周报并复制成品",
                path: "/pages/history-list/index?type=weekly"
            },
            {
                title: "日报模板管理",
                subtitle: "编辑日报栏目名称、顺序与数量",
                path: "/pages/template-daily/index"
            },
            {
                title: "周报模板管理",
                subtitle: "编辑周报栏目名称、顺序与数量",
                path: "/pages/template-weekly/index"
            }
        ]
    },
    handleOpen(event) {
        const path = event.currentTarget.dataset.path;
        wx.navigateTo({
            url: path
        });
    }
});
