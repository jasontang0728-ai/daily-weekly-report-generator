import { describe, expect, test } from "vitest"

import { handleHttpRequest } from "../src/server"

describe("cloudrun http server", () => {
  test("returns a health response", async () => {
    const response = await handleHttpRequest({
      method: "GET",
      path: "/healthz"
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      service: "daily-weekly-report-generator-cloudrun"
    })
  })

  test("generates a daily report document for a valid request", async () => {
    const response = await handleHttpRequest({
      method: "POST",
      path: "/api/reports/daily/generate",
      body: JSON.stringify({
        rawInput: "今天完成真实云开发接入，联调云托管接口，明天继续补充验收验证。",
        reportDate: "2026-04-04",
        templateSections: [
          { id: "daily-1", name: "今日完成", order: 1 },
          { id: "daily-2", name: "问题风险", order: 2 },
          { id: "daily-3", name: "明日计划", order: 3 }
        ]
      })
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).document.sections).toHaveLength(3)
  })

  test("rejects invalid request payloads", async () => {
    const response = await handleHttpRequest({
      method: "POST",
      path: "/api/reports/daily/generate",
      body: JSON.stringify({
        rawInput: "",
        templateSections: []
      })
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toContain("reportDate")
  })
})
