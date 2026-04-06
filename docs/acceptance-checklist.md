# Acceptance Checklist

## Scope

This checklist covers the current `feat/bootstrap` branch scope:

- real CloudBase database access from the mini program
- real Cloud Run / 云托管 HTTP access through `wx.cloud.callContainer`
- verification in WeChat DevTools
- end-to-end acceptance for the existing local MVP flows

Verified items below were updated against the current real environment on 2026-04-06.

## Environment prep

- [x] Replace `appid` in `miniprogram/project.config.json` with a real mini program AppID before DevTools verification.
- [x] Configure `miniprogram/lib/config/runtime.ts`:
  - [x] `cloudEnvId`
  - [x] `cloudServiceName`
  - [x] `useCloudDatabase = true`
  - [x] `useCloudRun = true`
- [x] Install mini program dependencies in `miniprogram/`.
- [x] Install cloud service dependencies in `cloudrun/`.
- [ ] Run `scripts/push-models.ps1 -EnvId <your-env-id>` after pulling or validating real CloudBase model JSON.
- [x] Run `scripts/seed-demo-data.ps1 -OpenId <demo-openid>` and import the generated JSON into the target CloudBase environment.
- [x] Deploy `cloudrun/` with the included `Dockerfile`.
- [ ] Confirm the deployed service answers `GET /healthz`.

## WeChat DevTools verification

- [x] Open `miniprogram/` in WeChat DevTools.
- [x] Run npm build inside DevTools so package dependencies are available.
- [x] Confirm app launch has no compile error.
- [x] Confirm `日报 / 周报 / 我的` tabs render correctly.
- [x] Confirm there is no runtime error when `wx.cloud.init` executes with the configured environment.
- [x] Confirm daily page can read the active daily template from CloudBase.
- [x] Confirm weekly page can read the active weekly template from CloudBase.

## Daily report acceptance

- [x] Enter fewer than 500 characters and click `AI 整理`.
- [ ] Confirm the request is sent through `wx.cloud.callContainer` to `/api/reports/daily/generate`.
- [x] Confirm the returned document matches the current template structure.
- [x] Confirm `完成` writes the saved daily report into CloudBase.
- [ ] Reopen the same day and confirm the completed daily report is shown.
- [ ] Edit and save again; confirm the same day record is updated instead of duplicated.

## Weekly report acceptance

- [x] With current-week daily reports available, click `生成本周周报`.
- [ ] Confirm the request is sent through `wx.cloud.callContainer` to `/api/reports/weekly/generate`.
- [ ] Confirm the generated weekly report uses only current-week completed daily reports.
- [ ] Confirm `完成` writes the weekly report and its `sourceDailyIds` into CloudBase.
- [ ] Reopen the weekly page and confirm the saved preview is retained.

## History and template acceptance

- [x] Confirm `我的 -> 日报历史` loads from CloudBase and opens detail preview.
- [x] Confirm `我的 -> 周报历史` loads from CloudBase and opens detail preview.
- [ ] Confirm copy action works on history detail pages.
- [ ] Confirm daily template edits persist to CloudBase.
- [ ] Confirm weekly template edits persist to CloudBase.
- [ ] Confirm duplicate section names are blocked.
- [ ] Confirm the seventh section cannot be added.

## Current known gaps

- [ ] Real CloudBase model JSON is still expected to be pulled from a live environment and then pushed; this branch does not invent schema JSON locally.
- [ ] Cloud Run currently uses an internal mock generation provider so the cloud path can be verified without model credentials.
- [ ] A real LLM provider contract and secrets flow still need to be added before production rollout.
