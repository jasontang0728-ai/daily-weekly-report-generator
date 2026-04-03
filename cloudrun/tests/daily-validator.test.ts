import { describe, expect, test } from "vitest"

import { validateDailyGeneratedPayload } from "../src/validators/report"

describe("daily validator", () => {
  test("accepts payloads that contain every template section with item arrays", () => {
    const result = validateDailyGeneratedPayload(
      {
        title: "2026年4月4日日报",
        sections: [
          { name: "今日完成", order: 1, items: ["完成登录页调整"] },
          { name: "问题风险", order: 2, items: ["无"] },
          { name: "明日计划", order: 3, items: ["继续联调接口"] }
        ]
      },
      ["今日完成", "问题风险", "明日计划"]
    )

    expect(result.valid).toBe(true)
  })

  test("rejects payloads when a template section is missing", () => {
    const result = validateDailyGeneratedPayload(
      {
        title: "2026年4月4日日报",
        sections: [{ name: "今日完成", order: 1, items: ["完成登录页调整"] }]
      },
      ["今日完成", "问题风险", "明日计划"]
    )

    expect(result.valid).toBe(false)
  })
})
