"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWeeklyWorkspaceState = createWeeklyWorkspaceState;
exports.startWeeklyGeneration = startWeeklyGeneration;
exports.finishWeeklyGeneration = finishWeeklyGeneration;
function createWeeklyWorkspaceState() {
    return {
        mode: "empty",
        document: null,
        disableGenerate: false,
        disableFinish: true
    };
}
function startWeeklyGeneration(state) {
    return {
        ...state,
        mode: "generating",
        disableGenerate: true,
        disableFinish: true
    };
}
function finishWeeklyGeneration(state, document) {
    return {
        ...state,
        mode: "preview",
        document,
        disableGenerate: false,
        disableFinish: false
    };
}
