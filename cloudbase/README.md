# CloudBase Workspace

This directory stores CloudBase-related project assets.

## Planned Contents

- `database-schemas/`
  - local data model definitions pulled from or prepared for CloudBase
- `generated-seed/`
  - locally generated demo records for testing and import

## Phase-1 Workflow

1. install CloudBase CLI
2. log in with `tcb login`
3. set or provide `CLOUDBASE_ENV_ID`
4. push local models with `scripts/push-models.ps1`
5. generate demo seed data with `scripts/seed-demo-data.ps1`
