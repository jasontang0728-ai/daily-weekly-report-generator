# Data Model Outline

This document captures the phase-1 data model at a high level. The concrete schema and seed scripts are added in the next task.

## Core Entities

### User

- `openid`
- `createdAt`
- `updatedAt`

### Daily Template

- `openid`
- `sections`
- `updatedAt`

### Weekly Template

- `openid`
- `sections`
- `updatedAt`

### Daily Report

- `openid`
- `reportDate`
- `title`
- `templateSnapshot`
- `sections`
- `finalText`
- `updatedAt`

Uniqueness rule:

- one user can only have one daily report per date

### Weekly Report

- `openid`
- `weekKey`
- `title`
- `templateSnapshot`
- `sourceDailyIds`
- `sections`
- `finalText`
- `updatedAt`

## Persistence Rules

- completed daily and weekly reports must store both structured data and final rendered text
- template snapshots are stored at completion time
- weekly reports only read completed daily reports
