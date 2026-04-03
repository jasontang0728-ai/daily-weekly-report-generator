Component({
  properties: {
    sections: {
      type: Array,
      value: []
    }
  },

  methods: {
    handleAdd() {
      this.triggerEvent("add")
    },

    handleRename(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent("rename", {
        id: event.currentTarget.dataset.id
      })
    },

    handleRemove(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent("remove", {
        id: event.currentTarget.dataset.id
      })
    },

    handleMoveUp(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent("moveup", {
        index: event.currentTarget.dataset.index
      })
    },

    handleMoveDown(event: WechatMiniprogram.TouchEvent) {
      this.triggerEvent("movedown", {
        index: event.currentTarget.dataset.index
      })
    }
  }
})
