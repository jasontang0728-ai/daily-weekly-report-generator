import type { HistoryListItem } from "../../lib/types/report"
import { listHistory } from "../../lib/services/history"

Page({
  data: {
    type: "daily",
    title: "日报历史",
    items: [] as HistoryListItem[]
  },

  onLoad(query: Record<string, string>) {
    const type = query.type === "weekly" ? "weekly" : "daily"

    this.setData({
      type,
      title: type === "weekly" ? "周报历史" : "日报历史"
    })

    void this.refreshList(type)
  },

  onShow() {
    void this.refreshList(this.data.type as "daily" | "weekly")
  },

  async refreshList(type: "daily" | "weekly") {
    this.setData({
      items: await listHistory(type)
    })
  },

  handleOpen(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id as string
    const type = event.currentTarget.dataset.type as string

    wx.navigateTo({
      url: `/pages/history-detail/index?type=${type}&id=${id}`
    })
  }
})
