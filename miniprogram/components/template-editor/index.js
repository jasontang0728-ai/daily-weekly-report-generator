"use strict";
Component({
    properties: {
        sections: {
            type: Array,
            value: []
        }
    },
    methods: {
        handleAdd() {
            this.triggerEvent("add");
        },
        handleRename(event) {
            this.triggerEvent("rename", {
                id: event.currentTarget.dataset.id
            });
        },
        handleRemove(event) {
            this.triggerEvent("remove", {
                id: event.currentTarget.dataset.id
            });
        },
        handleMoveUp(event) {
            this.triggerEvent("moveup", {
                index: event.currentTarget.dataset.index
            });
        },
        handleMoveDown(event) {
            this.triggerEvent("movedown", {
                index: event.currentTarget.dataset.index
            });
        }
    }
});
