"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScenarioModelPreset = getScenarioModelPreset;
exports.getModelPreset = getModelPreset;
const MODEL_PRESETS = {
    deepseek: {
        provider: "deepseek",
        model: "deepseek-v3.2",
        label: "DeepSeek"
    },
    hunyuan: {
        provider: "hunyuan-exp",
        model: "hunyuan-2.0-instruct-20251111",
        label: "腾讯混元"
    }
};
const SCENARIO_MODEL_KEYS = {
    daily_generate: "deepseek",
    weekly_generate: "deepseek"
};
function getScenarioModelPreset(scenario) {
    return MODEL_PRESETS[SCENARIO_MODEL_KEYS[scenario]];
}
function getModelPreset(modelKey) {
    return MODEL_PRESETS[modelKey];
}
