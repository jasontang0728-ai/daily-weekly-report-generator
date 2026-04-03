# Data Model Outline

This document defines the phase-1 persistence model for the WeChat Mini Program MVP.

## Storage Strategy

Phase 1 stores:

- user-scoped templates
- completed daily reports
- completed weekly reports
- both structured sections and final rendered text
- template snapshots at completion time

The current design assumes CloudBase collections or CloudBase data models with equivalent fields.

## Collections

### `users`

Purpose:

- bind platform identity to project data scope

Fields:

- `openid: string`
- `createdAt: string`
- `updatedAt: string`

Rules:

- `openid` is the primary user identity in phase 1
- no profile fields such as avatar, nickname, or phone are required

### `dailyTemplates`

Purpose:

- hold the single active daily template for each user

Fields:

- `openid: string`
- `name: string`
- `sections: TemplateSection[]`
- `updatedAt: string`

Section shape:

```json
{
  "id": "daily-completed",
  "name": "今日完成",
  "order": 1
}
```

Rules:

- only one active daily template per user
- maximum 6 sections
- duplicate section names are not allowed

### `weeklyTemplates`

Purpose:

- hold the single active weekly template for each user

Fields:

- `openid: string`
- `name: string`
- `sections: TemplateSection[]`
- `updatedAt: string`

Rules:

- only one active weekly template per user
- maximum 6 sections
- duplicate section names are not allowed

### `dailyReports`

Purpose:

- persist the one completed daily report for a given user and date

Fields:

- `openid: string`
- `reportDate: string`
- `title: string`
- `templateSnapshot: TemplateSnapshot`
- `sections: ReportSection[]`
- `finalText: string`
- `createdAt: string`
- `updatedAt: string`

Report section shape:

```json
{
  "name": "今日完成",
  "order": 1,
  "items": [
    "完成登录页调整，并联调两个后端接口。"
  ]
}
```

Rules:

- one user can only have one completed daily report per `reportDate`
- editing after completion updates the same record
- final text is stored alongside structured sections

### `weeklyReports`

Purpose:

- persist the completed weekly report for a user and week

Fields:

- `openid: string`
- `weekKey: string`
- `title: string`
- `templateSnapshot: TemplateSnapshot`
- `sourceDailyIds: string[]`
- `sections: ReportSection[]`
- `finalText: string`
- `createdAt: string`
- `updatedAt: string`

Rules:

- weekly reports only read from completed daily reports
- the generated report stores source daily IDs for traceability
- editing after completion updates the same weekly record

## Shared Structures

### `TemplateSnapshot`

Purpose:

- freeze the template used at completion time so later template edits do not affect historical records

Shape:

```json
{
  "name": "默认日报模板",
  "sections": [
    {
      "id": "daily-completed",
      "name": "今日完成",
      "order": 1
    }
  ]
}
```

### `ReportSection`

Purpose:

- support both document preview and later structured editing

Shape:

```json
{
  "name": "下周计划",
  "order": 3,
  "items": [
    "继续测试整体流程。",
    "推进剩余联调事项。"
  ]
}
```

Rules:

- empty sections are still persisted as `["无"]`
- item order matters for final rendering

## Persistence Rules

- completed daily and weekly reports must store both structured data and final rendered text
- template snapshots must be stored at completion time
- weekly reports only read completed daily reports
- historical records are rendered from their own stored snapshots and text, not from the current active template

## Phase-1 Uniqueness and Access Constraints

- one user can only have one daily report per date
- data is scoped by `openid`
- users may only read and write their own templates and reports
