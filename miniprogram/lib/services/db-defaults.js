"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_WEEKLY_TEMPLATE_SECTIONS = exports.DEFAULT_DAILY_TEMPLATE_SECTIONS = void 0;
exports.cloneTemplateSections = cloneTemplateSections;
exports.createDefaultTemplateProfile = createDefaultTemplateProfile;
exports.DEFAULT_DAILY_TEMPLATE_SECTIONS = [
    { id: "daily-1", name: "今日完成", order: 1 },
    { id: "daily-2", name: "问题风险", order: 2 },
    { id: "daily-3", name: "明日计划", order: 3 }
];
exports.DEFAULT_WEEKLY_TEMPLATE_SECTIONS = [
    { id: "weekly-1", name: "本周完成", order: 1 },
    { id: "weekly-2", name: "问题风险", order: 2 },
    { id: "weekly-3", name: "下周计划", order: 3 }
];
function cloneTemplateSections(sections) {
    return sections.map((section) => ({ ...section }));
}
function createDefaultTemplateProfile(kind) {
    return {
        kind,
        sections: cloneTemplateSections(kind === "daily" ? exports.DEFAULT_DAILY_TEMPLATE_SECTIONS : exports.DEFAULT_WEEKLY_TEMPLATE_SECTIONS),
        updatedAt: new Date().toISOString()
    };
}
