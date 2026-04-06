"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_SECTION_LIMIT = exports.DAILY_INPUT_LIMIT = void 0;
exports.validateDailyRawInput = validateDailyRawInput;
exports.validateTemplateSections = validateTemplateSections;
exports.DAILY_INPUT_LIMIT = 500;
exports.TEMPLATE_SECTION_LIMIT = 6;
function validateDailyRawInput(input) {
    if (input.length > exports.DAILY_INPUT_LIMIT) {
        return {
            valid: false,
            reason: "日报原始输入不能超过500字"
        };
    }
    return { valid: true };
}
function validateTemplateSections(sectionNames) {
    if (sectionNames.length > exports.TEMPLATE_SECTION_LIMIT) {
        return {
            valid: false,
            reason: "最多只能添加 6 个栏目"
        };
    }
    const normalizedNames = sectionNames.map((name) => name.trim());
    const uniqueNames = new Set(normalizedNames);
    if (uniqueNames.size !== normalizedNames.length) {
        return {
            valid: false,
            reason: "栏目名称不能重复"
        };
    }
    return { valid: true };
}
