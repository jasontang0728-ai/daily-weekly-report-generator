# Scripts

This directory contains the current branch helpers for real environment bootstrap and acceptance prep.

## Available scripts

- `push-models.ps1`
  - pushes validated CloudBase model JSON from `cloudbase/database-schemas/`
  - requires `tcb` CLI and `CLOUDBASE_ENV_ID`
- `seed-demo-data.ps1`
  - generates demo JSON payloads under `cloudbase/generated-seed/`
  - can be imported into CloudBase for acceptance walkthroughs

## Suggested flow

1. Pull or validate real model JSON into `cloudbase/database-schemas/`
2. Run `scripts/push-models.ps1 -EnvId <your-env-id>`
3. Run `scripts/seed-demo-data.ps1 -OpenId <demo-openid>`
4. Import generated JSON into the target CloudBase environment
5. Deploy the `cloudrun/` service
6. Open `miniprogram/` in WeChat DevTools and follow `docs/acceptance-checklist.md`
