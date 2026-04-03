# Daily/Weekly Report Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the phase-1 WeChat Mini Program MVP for structured daily and weekly report generation, including editable templates, controlled AI generation, history, and copy-ready final documents.

**Architecture:** Use a native WeChat Mini Program frontend for the three-tab workflow (`日报 / 周报 / 我的`). Use CloudBase database for user-scoped CRUD, Cloud Run for controlled AI generation, and persist both structured document data and final rendered text plus template snapshots for every completed report.

**Tech Stack:** 微信开发者工具, TypeScript, `miniprogram-api-typings`, `Vant Weapp`, `wechat-miniprogram/computed`, CloudBase 云数据库, Cloud Run, CloudBase 数据模型, CloudBase CMS, CloudBase CLI

---

## Recommended Productivity Stack

### Must Use

- 微信开发者工具
- TypeScript + `miniprogram-api-typings`
- `Vant Weapp`
- CloudBase 云数据库
- Cloud Run

### Recommended

- CloudBase 数据模型
- CloudBase CMS
- CloudBase CLI
- `wechat-miniprogram/computed`

### Not Recommended for Phase 1

- `mobx-miniprogram-bindings`
- 多套 UI 组件库混用
- 小程序插件承载核心日报/周报逻辑
- 直接前端调用 AI

## Proposed Repository Structure

### Project Root

- `miniprogram/`
  - 小程序前端源码
- `cloudrun/`
  - AI 受控后端服务
- `docs/`
  - 产品规格、实现计划、接口约束
- `scripts/`
  - 环境初始化、演示数据导入、模型推送脚本

### Mini Program Frontend

- `miniprogram/app.ts`
- `miniprogram/app.json`
- `miniprogram/app.wxss`
- `miniprogram/project.config.json`
- `miniprogram/tsconfig.json`
- `miniprogram/package.json`
- `miniprogram/miniprogram_npm/` or npm build output

### Pages

- `miniprogram/pages/daily/index.*`
  - 日报工作台、今日预览、编辑与完成
- `miniprogram/pages/weekly/index.*`
  - 周报生成、预览、编辑与完成
- `miniprogram/pages/me/index.*`
  - 入口列表
- `miniprogram/pages/history-detail/index.*`
  - 历史详情只读预览 + 复制
- `miniprogram/pages/template-daily/index.*`
  - 日报模板编辑器
- `miniprogram/pages/template-weekly/index.*`
  - 周报模板编辑器

### Components

- `miniprogram/components/input-panel/`
  - 原始输入框、500 字限制、轻提示、AI整理按钮
- `miniprogram/components/doc-preview/`
  - 文档式预览
- `miniprogram/components/section-editor/`
  - 模板结构内编辑
- `miniprogram/components/final-popup/`
  - 完成后的最终文本弹窗 + 复制
- `miniprogram/components/template-editor/`
  - 栏目增删改排序的通用编辑器

### Frontend Lib

- `miniprogram/lib/types/report.ts`
  - 日报、周报、模板、栏目类型
- `miniprogram/lib/services/db.ts`
  - 用户作用域下的数据库读写封装
- `miniprogram/lib/services/ai.ts`
  - 调用云托管 AI 服务
- `miniprogram/lib/services/history.ts`
  - 历史列表和详情查询
- `miniprogram/lib/services/template.ts`
  - 模板读取、编辑、快照生成
- `miniprogram/lib/utils/render.ts`
  - 结构化数据渲染为最终文档文本
- `miniprogram/lib/utils/date.ts`
  - 今日标题、周标题、周范围计算
- `miniprogram/lib/utils/validation.ts`
  - 500 字限制、栏目数限制、结构校验

### Cloud Run Service

- `cloudrun/app.py` or `cloudrun/src/index.ts`
  - 服务入口
- `cloudrun/src/routes/daily-generate.*`
  - 日报 AI 整理
- `cloudrun/src/routes/weekly-generate.*`
  - 周报 AI 提炼
- `cloudrun/src/prompts/daily.ts`
  - 日报 Prompt
- `cloudrun/src/prompts/weekly.ts`
  - 周报 Prompt
- `cloudrun/src/validators/report.ts`
  - AI 输出结构校验
- `cloudrun/src/domain/normalize.ts`
  - 统一清洗与兜底错误转换

### Docs / Scripts

- `docs/data-model.md`
  - 数据模型说明
- `scripts/seed-demo-data.*`
  - 演示数据初始化
- `scripts/push-models.*`
  - 数据模型推送

## Data Model Outline

### Collections / Models

- `users`
  - `openid`
  - `createdAt`
  - `updatedAt`

- `dailyTemplates`
  - `openid`
  - `sections`
  - `updatedAt`

- `weeklyTemplates`
  - `openid`
  - `sections`
  - `updatedAt`

- `dailyReports`
  - `openid`
  - `reportDate`
  - `title`
  - `templateSnapshot`
  - `sections`
  - `finalText`
  - `updatedAt`
  - uniqueness on `openid + reportDate`

- `weeklyReports`
  - `openid`
  - `weekKey`
  - `title`
  - `templateSnapshot`
  - `sourceDailyIds`
  - `sections`
  - `finalText`
  - `updatedAt`

## Task Breakdown

### Task 1: Bootstrap the New Project Workspace

**Files:**
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/package.json`
- Create: `miniprogram/tsconfig.json`
- Create: `miniprogram/app.ts`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `docs/data-model.md`

- [ ] **Step 1: Create the root directories**

Create:
- `miniprogram/`
- `cloudrun/`
- `docs/`
- `scripts/`

- [ ] **Step 2: Initialize the mini program package**

Add dependencies for:
- `typescript`
- `miniprogram-api-typings`
- `vant-weapp`
- `miniprogram-computed`

- [ ] **Step 3: Configure the app shell**

Set up:
- three-tab app structure
- TypeScript support
- global styles

- [ ] **Step 4: Verify project boots in 微信开发者工具**

Expected:
- app opens
- three tabs render
- no compile error

- [ ] **Step 5: Commit**

```bash
git add miniprogram docs
git commit -m "chore: bootstrap daily weekly report generator mini program"
```

### Task 2: Define Data Models and Demo Seed Data

**Files:**
- Create: `docs/data-model.md`
- Create: `scripts/seed-demo-data.*`
- Create: `scripts/push-models.*`

- [ ] **Step 1: Write the data model document**

Cover:
- daily template
- weekly template
- daily report
- weekly report
- uniqueness on daily reports

- [ ] **Step 2: Create model push script**

Include commands for pushing CloudBase models or schema definitions.

- [ ] **Step 3: Create demo seed script**

Seed:
- one demo user
- one default daily template
- one default weekly template
- several demo daily reports

- [ ] **Step 4: Run the seed flow in a test environment**

Expected:
- demo records visible in database

- [ ] **Step 5: Commit**

```bash
git add docs scripts
git commit -m "chore: add data model and demo seed scripts"
```

### Task 3: Build Shared Types, Validation, and Rendering Utilities

**Files:**
- Create: `miniprogram/lib/types/report.ts`
- Create: `miniprogram/lib/utils/render.ts`
- Create: `miniprogram/lib/utils/date.ts`
- Create: `miniprogram/lib/utils/validation.ts`
- Test: `miniprogram/tests/unit/render.test.ts`
- Test: `miniprogram/tests/unit/validation.test.ts`

- [ ] **Step 1: Write failing tests for title rendering**

Test:
- daily title format
- weekly title format
- no weekly date range in final text

- [ ] **Step 2: Run tests to confirm failure**

Run:
`npm test -- render`

- [ ] **Step 3: Implement date and render helpers**

Support:
- section numbering
- item numbering
- empty section rendering as `1. 无`

- [ ] **Step 4: Write failing tests for validation**

Test:
- 500-char daily input limit
- max 6 sections
- duplicate section names blocked

- [ ] **Step 5: Implement validation helpers**

- [ ] **Step 6: Run tests to confirm pass**

Run:
`npm test`

- [ ] **Step 7: Commit**

```bash
git add miniprogram/lib miniprogram/tests
git commit -m "feat: add shared report rendering and validation helpers"
```

### Task 4: Build Template Management

**Files:**
- Create: `miniprogram/pages/template-daily/index.*`
- Create: `miniprogram/pages/template-weekly/index.*`
- Create: `miniprogram/components/template-editor/*`
- Create: `miniprogram/lib/services/template.ts`
- Test: `miniprogram/tests/unit/template-service.test.ts`

- [ ] **Step 1: Write failing tests for template rules**

Test:
- add section
- remove section
- rename section
- reorder sections
- max 6 sections
- no duplicate names

- [ ] **Step 2: Implement template service**

- [ ] **Step 3: Build the shared template editor component**

- [ ] **Step 4: Build daily and weekly template pages**

- [ ] **Step 5: Verify manual flow**

Expected:
- template edits persist
- duplicate names blocked
- sixth section allowed, seventh blocked

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages miniprogram/components miniprogram/lib
git commit -m "feat: add daily and weekly template management"
```

### Task 5: Build the Daily Report Workspace

**Files:**
- Create: `miniprogram/pages/daily/index.*`
- Create: `miniprogram/components/input-panel/*`
- Create: `miniprogram/components/doc-preview/*`
- Create: `miniprogram/components/section-editor/*`
- Create: `miniprogram/components/final-popup/*`
- Create: `miniprogram/lib/services/db.ts`
- Create: `miniprogram/lib/services/ai.ts`
- Test: `miniprogram/tests/unit/daily-page-state.test.ts`

- [ ] **Step 1: Write failing tests for daily page states**

Test:
- empty state
- today completed preview state
- AI in-flight disables button
- cannot finish before AI generate

- [ ] **Step 2: Implement page state machine**

States:
- empty input
- generated preview
- editing
- completed-today preview

- [ ] **Step 3: Implement AI request and structure validation**

Failure rule:
- invalid AI structure = full failure

- [ ] **Step 4: Implement complete flow**

Persist:
- sections
- final text
- template snapshot

- [ ] **Step 5: Verify manual flow**

Expected:
- over 500 chars blocked
- AI result preview renders
- finish saves and pops final copy dialog
- revisit same day shows today preview

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add daily report workspace"
```

### Task 6: Build the Weekly Report Workspace

**Files:**
- Create: `miniprogram/pages/weekly/index.*`
- Modify: `miniprogram/lib/services/db.ts`
- Modify: `miniprogram/lib/services/ai.ts`
- Test: `miniprogram/tests/unit/weekly-page-state.test.ts`

- [ ] **Step 1: Write failing tests for weekly page behavior**

Test:
- empty state hint
- no completed dailies shows blocked generation
- AI in-flight disables button
- finish keeps preview visible

- [ ] **Step 2: Implement weekly source loading**

Only pull:
- current week
- completed dailies

- [ ] **Step 3: Implement weekly AI generate flow**

Use:
- weekly template
- daily source data
- structure validation

- [ ] **Step 4: Implement weekly edit + finish flow**

- [ ] **Step 5: Verify manual flow**

Expected:
- no-source case handled
- generated weekly report is editable
- finish saves and opens final copy dialog
- page retains preview after finish

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add weekly report workspace"
```

### Task 7: Build My Page and History Detail

**Files:**
- Create: `miniprogram/pages/me/index.*`
- Create: `miniprogram/pages/history-detail/index.*`
- Create: `miniprogram/lib/services/history.ts`
- Test: `miniprogram/tests/unit/history-service.test.ts`

- [ ] **Step 1: Write failing tests for history queries**

Test:
- list returns title + date only
- detail returns read-only final text

- [ ] **Step 2: Implement history service**

- [ ] **Step 3: Build My page entries**

Entries:
- daily history
- weekly history
- daily template
- weekly template

- [ ] **Step 4: Build history detail page**

Only actions:
- preview
- copy

- [ ] **Step 5: Verify manual flow**

Expected:
- history opens
- detail reads correctly
- copy works

- [ ] **Step 6: Commit**

```bash
git add miniprogram
git commit -m "feat: add my page and history detail views"
```

### Task 8: Build the Cloud Run AI Service

**Files:**
- Create: `cloudrun/src/index.*`
- Create: `cloudrun/src/routes/daily-generate.*`
- Create: `cloudrun/src/routes/weekly-generate.*`
- Create: `cloudrun/src/prompts/daily.*`
- Create: `cloudrun/src/prompts/weekly.*`
- Create: `cloudrun/src/validators/report.*`
- Test: `cloudrun/tests/daily-validator.test.*`
- Test: `cloudrun/tests/weekly-validator.test.*`

- [ ] **Step 1: Write failing tests for daily output validation**

Test:
- all template sections present
- item arrays required
- bad shape rejected

- [ ] **Step 2: Implement daily route and validator**

- [ ] **Step 3: Write failing tests for weekly output validation**

Test:
- grouped by project/item
- no invalid free-text blob

- [ ] **Step 4: Implement weekly route and validator**

- [ ] **Step 5: Add prompt contracts**

Explicit rules:
- no fabrication
- daily item grouping
- weekly result-oriented grouping
- weekly next-plan cross-day state handling

- [ ] **Step 6: Deploy to test environment and verify**

- [ ] **Step 7: Commit**

```bash
git add cloudrun
git commit -m "feat: add cloud run ai generation service"
```

### Task 9: Integration, Demo Data, and Acceptance Pass

**Files:**
- Modify: `scripts/seed-demo-data.*`
- Create: `docs/acceptance-checklist.md`

- [ ] **Step 1: Seed acceptance demo data**

- [ ] **Step 2: Run full manual acceptance**

Check:
- daily create
- daily update
- weekly generate
- weekly update
- history preview
- template editing

- [ ] **Step 3: Verify success criteria**

Confirm:
- output usually needs only light edits
- daily-to-weekly loop works
- demo account can show end-to-end flow

- [ ] **Step 4: Commit**

```bash
git add scripts docs
git commit -m "chore: add acceptance checklist and demo data"
```

## Execution Notes

- Prefer TDD on utility, service, validator, and page-state logic
- Keep UI components focused and small
- Do not introduce autosave, history delete, multi-template support, or free-form editor behavior
- Treat template snapshot persistence as a hard requirement, not an optimization
- Treat invalid AI output as failure, not as partial success

## Handoff

Plan saved for execution. Recommended next step is to implement with `subagent-driven-development` or `executing-plans`, but no subagent review loop was run here because this thread is still in planning/handoff mode.
