# Cloud Run Service

This service now exposes real HTTP endpoints for the mini program to call through `wx.cloud.callContainer`:

- `GET /healthz`
- `POST /api/reports/daily/generate`
- `POST /api/reports/weekly/generate`

## Local development

1. Install dependencies:
   `npm install`
2. Run tests:
   `npm run test:run`
3. Build:
   `npm run build`
4. Start the service:
   `npm run start`

The current implementation keeps a mock generation provider inside the service so the full Cloud Run request path can be verified before wiring a real LLM provider.

## Mini program contract

The mini program calls this service with:

- `X-WX-SERVICE: <service-name>`
- JSON request body
- Cloud environment configured by `miniprogram/lib/config/runtime.ts`

## Deployment notes

- Container entrypoint listens on `PORT` and defaults to `8080`
- `Dockerfile` is ready for cloud-hosted container deployment
- Keep database access in CloudBase and AI generation behind this service boundary
