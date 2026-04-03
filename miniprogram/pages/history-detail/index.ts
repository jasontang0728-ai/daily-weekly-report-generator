import { getHistoryDetail } from "../../lib/services/db"

Page({
  data: {
    title: "",
    finalText: "",
    type: "daily"
  },

  onLoad(query: Record<string, string>) {
    const type = query.type === "weekly" ? "weekly" : "daily"
    const detail = getHistoryDetail(type, query.id)

    this.setData({
      type,
      title: detail?.title ?? "",
      finalText: detail?.finalText ?? ""
    })
  },

  handleCopy() {
    if (!this.data.finalText) {
      return
    }

    wx.setClipboardData({
      data: this.data.finalText,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success"
        })
      }
    })
  }
})
