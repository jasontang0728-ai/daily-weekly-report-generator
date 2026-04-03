Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: "已完成"
    },
    content: {
      type: String,
      value: ""
    }
  },

  methods: {
    noop() {
      return undefined
    },

    handleMaskTap() {
      this.triggerEvent("close")
    },

    handleClose() {
      this.triggerEvent("close")
    },

    handleCopy() {
      if (!this.properties.content) {
        return
      }

      wx.setClipboardData({
        data: this.properties.content,
        success: () => {
          this.triggerEvent("copied")
        }
      })
    }
  }
})
