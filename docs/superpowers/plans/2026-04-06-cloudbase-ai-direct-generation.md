# CloudBase AI Direct Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the daily/weekly generation primary path with `wx.cloud.extend.AI`, keep CloudRun as controlled fallback, and preserve the existing page/data/history workflows.

**Architecture:** Keep the current page contracts unchanged and move the provider selection into a new config layer. `miniprogram/lib/services/ai.ts` becomes the orchestration point for Cloud AI, CloudRun fallback, and local draft fallback, with explicit error classification so only runtime/capability failures trigger fallback.

**Tech Stack:** 微信小程序, TypeScript, `miniprogram-api-typings`, CloudBase, `wx.cloud.extend.AI`, Vitest

---

## File Responsibilities

### New Files

- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\config\ai-models.ts`
  - Central registry for AI providers/models and scenario mapping.

### Modified Files

- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\config\runtime.ts`
  - Add `useCloudAI`; keep CloudRun as fallback-only capability.
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\typings\index.d.ts`
  - Add the minimal Cloud AI typings used by the mini program.
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\services\ai.ts`
  - Add Cloud AI primary path, prompt builders, explicit error classes, and controlled fallback logic.
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\tests\unit\ai-service.test.ts`
  - Cover Cloud AI path, CloudRun fallback, local fallback, code-fence parsing, and content validation failures.

### Existing Files to Read Before Editing

- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\docs\superpowers\specs\2026-04-06-cloudbase-ai-direct-design.md`
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\types\report.ts`
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\services\template.ts`
- `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\services\db-cloud.ts`

## Implementation Rules

- Do not delete old files before replacement code exists.
- Keep page-level APIs unchanged:
  - `generateDailyReport(...)`
  - `generateWeeklyReport(...)`
- `Cloud AI` is the primary path only when explicitly enabled.
- `CloudRun` remains available as fallback.
- `Local draft` remains the final fallback path.
- Only runtime/capability failures may fallback to CloudRun.
- Content/structure validation failures must throw directly.

## Error Classification Rules

Implement two explicit error classes in `ai.ts`:

- `AIRuntimeUnavailableError`
  - Examples:
    - `wx` unavailable
    - `wx.cloud.extend.AI` unavailable
    - provider/model invocation failure
    - empty response content
  - Behavior:
    - If `useCloudRun` is enabled, fallback to CloudRun.
    - Otherwise throw.

- `AIContentValidationError`
  - Examples:
    - invalid JSON shape
    - missing `title`
    - invalid `sections/items`
    - template mismatch after parse
  - Behavior:
    - Never fallback automatically.
    - Throw directly to page-level error handling.

## Task Breakdown

### Task 1: Add Provider and Scenario Configuration

**Files:**
- Create: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\config\ai-models.ts`
- Test: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\tests\unit\ai-service.test.ts`

- [ ] **Step 1: Add a failing test that assumes the default scenario model is DeepSeek**

Test idea:

```ts
expect(createModel).toHaveBeenCalledWith("deepseek")
```

- [ ] **Step 2: Run the focused test to confirm it fails**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run -- tests/unit/ai-service.test.ts
```

Expected:
- FAIL because the provider registry does not exist yet.

- [ ] **Step 3: Create `ai-models.ts`**

Implement:

```ts
export type AIModelKey = "deepseek" | "hunyuan"
export type AIScenario = "daily_generate" | "weekly_generate"

export interface AIModelPreset {
  provider: string
  model: string
  label: string
}
```

Add:
- `MODEL_PRESETS`
- `SCENARIO_MODEL_KEYS`
- `getScenarioModelPreset(...)`
- `getModelPreset(...)`

- [ ] **Step 4: Re-run the focused test**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run -- tests/unit/ai-service.test.ts
```

Expected:
- Still FAIL, but now on AI service integration, not missing config.

- [ ] **Step 5: Commit**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -- "miniprogram/lib/config/ai-models.ts" "miniprogram/tests/unit/ai-service.test.ts"
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "feat: add cloud ai model configuration"
```

### Task 2: Extend Runtime Configuration Safely

**Files:**
- Modify: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\config\runtime.ts`
- Modify: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\typings\index.d.ts`

- [ ] **Step 1: Add a failing test for Cloud AI runtime gating**

Test idea:

```ts
await generateDailyReport(input, {
  runtimeConfig: { cloudEnvId: "x", useCloudAI: true, useCloudRun: false },
  createModel
})
```

Expected behavior:
- When `useCloudAI` is true, Cloud AI path is attempted.

- [ ] **Step 2: Modify `runtime.ts`**

Add:
- `useCloudAI`
- `isCloudAIEnabled(...)`

Set safer defaults:

```ts
useCloudRun: false
useCloudAI: false
```

- [ ] **Step 3: Modify `typings/index.d.ts`**

Add minimal type definitions for:
- `WechatMiniprogram.CloudAIMessage`
- `CloudAIGenerateTextResult`
- `CloudAIModelInstance`
- `CloudAIExtension`

Also extend `IAppOption.globalData.runtimeConfig` with `useCloudAI`.

- [ ] **Step 4: Run typecheck**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run typecheck
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -- "miniprogram/lib/config/runtime.ts" "miniprogram/typings/index.d.ts"
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "feat: add cloud ai runtime configuration"
```

### Task 3: Add Cloud AI Error Classes and Parsing Helpers

**Files:**
- Modify: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\services\ai.ts`
- Test: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\tests\unit\ai-service.test.ts`

- [ ] **Step 1: Add failing tests for parsing and error classification**

Add tests for:
- code-fence JSON parsing
- valid JSON but invalid template structure
- empty content should be treated as runtime-unavailable

Example test skeleton:

```ts
await expect(generateDailyReport(...)).rejects.toThrow()
```

- [ ] **Step 2: Add explicit error classes**

Implement in `ai.ts`:

```ts
class AIRuntimeUnavailableError extends Error {}
class AIContentValidationError extends Error {}
```

- [ ] **Step 3: Add parsing helpers**

Implement:
- `sortTemplateSections(...)`
- `stripJsonCodeFence(...)`
- `parseDocumentFromModelText(...)`

Rules:
- Throw `AIContentValidationError` for malformed structures.
- Do not silently coerce invalid document shapes.

- [ ] **Step 4: Run the focused tests**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run -- tests/unit/ai-service.test.ts
```

Expected:
- Some AI service path tests still fail because Cloud AI orchestration is not connected yet.

- [ ] **Step 5: Commit**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -- "miniprogram/lib/services/ai.ts" "miniprogram/tests/unit/ai-service.test.ts"
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "feat: add cloud ai parsing and error classification"
```

### Task 4: Implement Cloud AI Primary Path with Controlled Fallback

**Files:**
- Modify: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\lib\services\ai.ts`
- Test: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\tests\unit\ai-service.test.ts`

- [ ] **Step 1: Add a failing test for Cloud AI primary path**

Test:
- `useCloudAI: true`
- `useCloudRun: false`
- `createModel("deepseek")` is called
- `generateText(...)` returns a document

- [ ] **Step 2: Add a failing test for runtime fallback to CloudRun**

Test:
- Cloud AI enabled
- `createModel(...)` throws `AIRuntimeUnavailableError` or equivalent runtime failure
- `callContainer(...)` is used next

- [ ] **Step 3: Implement `getDefaultCreateModel()` safely**

Rules:
- Guard `typeof wx === "undefined"`
- Guard missing `wx.cloud`
- Guard missing `wx.cloud.extend?.AI?.createModel`
- Throw `AIRuntimeUnavailableError`

- [ ] **Step 4: Implement `buildDailyMessages(...)` and `buildWeeklyMessages(...)`**

Use:
- `input.templateSections`
- sorted by `order`
- strict JSON-only system instructions

- [ ] **Step 5: Implement `callCloudAI(...)`**

Rules:
- Use only `input.templateSections` as the validation source
- Use `getScenarioModelPreset(...)`
- Throw `AIRuntimeUnavailableError` for:
  - missing runtime capability
  - invocation failure
  - empty content
- Throw `AIContentValidationError` for:
  - invalid JSON structure
  - template mismatch

- [ ] **Step 6: Update `generateDailyReport(...)` and `generateWeeklyReport(...)`**

Fallback order:
1. Cloud AI when enabled
2. CloudRun only for runtime/capability failures
3. Local draft when Cloud AI disabled and CloudRun disabled

Do **not** fallback for content-validation failures.

- [ ] **Step 7: Run AI service tests**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run -- tests/unit/ai-service.test.ts
```

Expected:
- PASS

- [ ] **Step 8: Commit**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -- "miniprogram/lib/services/ai.ts" "miniprogram/tests/unit/ai-service.test.ts"
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "feat: add cloud ai generation with controlled fallback"
```

### Task 5: Add Regression Tests for Fallback Edges

**Files:**
- Modify: `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram\tests\unit\ai-service.test.ts`

- [ ] **Step 1: Add regression tests for fallback boundaries**

Cover:
- Cloud AI returns empty content -> fallback to CloudRun
- Cloud AI returns invalid template structure -> throw directly
- Cloud AI disabled + CloudRun enabled -> CloudRun path
- Both disabled -> local draft path

- [ ] **Step 2: Run the single test file**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run -- tests/unit/ai-service.test.ts
```

Expected:
- PASS

- [ ] **Step 3: Commit**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -- "miniprogram/tests/unit/ai-service.test.ts"
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "test: cover cloud ai fallback boundaries"
```

### Task 6: Run Full Verification

**Files:**
- No file changes required unless fixes are needed

- [ ] **Step 1: Run miniprogram typecheck**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run typecheck
```

Expected:
- PASS

- [ ] **Step 2: Run miniprogram test suite**

Run:

```powershell
cd D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\miniprogram
npm.cmd run test:run
```

Expected:
- PASS

- [ ] **Step 3: Manual verification in 微信开发者工具**

Check:
- 日报 `AI整理` still enters preview flow
- 周报 `生成本周周报` still enters preview flow
- 历史/模板链路不回归

- [ ] **Step 4: Commit any final fixups**

```powershell
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" add -A
git -C "D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap" commit -m "chore: finalize cloud ai direct generation migration"
```

## Execution Notes

- Keep all existing file paths stable; do not rename or delete the current AI service files.
- Replace code by overwriting existing files only after the new content is complete.
- Preserve the existing local draft logic and document validation utilities.
- Do not expand scope into streaming output or model-selection UI.
- Keep CloudRun deployed and callable until Cloud AI path is validated.

## Plan Review Note

This plan was written from the approved spec. No subagent reviewer was dispatched here because this thread has not authorized subagent review/execution.

## Handoff

Plan complete and saved to `D:\CODEX\日报周报自动生成器\.worktrees\feat-bootstrap\docs\superpowers\plans\2026-04-06-cloudbase-ai-direct-generation.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
