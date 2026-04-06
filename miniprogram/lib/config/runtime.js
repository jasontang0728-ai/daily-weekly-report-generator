"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = getRuntimeConfig;
exports.isCloudDatabaseEnabled = isCloudDatabaseEnabled;
exports.isCloudRunEnabled = isCloudRunEnabled;
const DEFAULT_RUNTIME_CONFIG = {
    cloudEnvId: "cloud1-7g772au1b225ae1b",
    cloudServiceName: "daily-weekly-report-api",
    useCloudDatabase: true,
    useCloudRun: true,
    requestTimeoutMs: 15000
};
function getRuntimeConfig(overrides = {}) {
    return {
        ...DEFAULT_RUNTIME_CONFIG,
        ...overrides
    };
}
function isCloudDatabaseEnabled(config) {
    return config.useCloudDatabase && Boolean(config.cloudEnvId);
}
function isCloudRunEnabled(config) {
    return config.useCloudRun && Boolean(config.cloudEnvId) && Boolean(config.cloudServiceName);
}
