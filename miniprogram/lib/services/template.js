"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTemplateSection = addTemplateSection;
exports.removeTemplateSection = removeTemplateSection;
exports.renameTemplateSection = renameTemplateSection;
exports.reorderTemplateSections = reorderTemplateSections;
function normalizeSectionOrder(sections) {
    return sections.map((section, index) => ({
        ...section,
        order: index + 1
    }));
}
function addTemplateSection(sections, name) {
    const nextSection = {
        id: `section-${sections.length + 1}`,
        name,
        order: sections.length + 1
    };
    return [...sections, nextSection];
}
function removeTemplateSection(sections, id) {
    return normalizeSectionOrder(sections.filter((section) => section.id !== id));
}
function renameTemplateSection(sections, id, nextName) {
    return sections.map((section) => section.id === id
        ? {
            ...section,
            name: nextName
        }
        : section);
}
function reorderTemplateSections(sections, fromIndex, toIndex) {
    const nextSections = [...sections];
    const [moved] = nextSections.splice(fromIndex, 1);
    nextSections.splice(toIndex, 0, moved);
    return normalizeSectionOrder(nextSections);
}
