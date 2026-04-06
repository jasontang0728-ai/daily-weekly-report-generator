"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDailyWorkspaceState = createDailyWorkspaceState;
exports.startDailyGeneration = startDailyGeneration;
exports.finishDailyGeneration = finishDailyGeneration;
exports.canFinishDailyReport = canFinishDailyReport;
function createDailyWorkspaceState(todayReport) {
    if (todayReport) {
        return {
            mode: "preview",
            document: todayReport,
            disableGenerate: false,
            disableFinish: false
        };
    }
    return {
        mode: "input",
        document: null,
        disableGenerate: false,
        disableFinish: true
    };
}
function startDailyGeneration(state) {
    return {
        ...state,
        mode: "generating",
        disableGenerate: true,
        disableFinish: true
    };
}
function finishDailyGeneration(state, document) {
    return {
        ...state,
        mode: "preview",
        document,
        disableGenerate: false,
        disableFinish: false
    };
}
function canFinishDailyReport(state) {
    return Boolean(state.document) && state.disableFinish === false;
}
