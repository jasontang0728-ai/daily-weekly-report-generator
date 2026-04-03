import { describe, expect, test } from "vitest"

import { validateWeeklyGeneratedPayload } from "../src/validators/report"

describe("weekly validator", () => {
  test("accepts grouped weekly sections with item arrays", () => {
    const result = validateWeeklyGeneratedPayload(
      {
        title: "2026年第14周周报",
        sections: [
          { name: "本周完成", order: 1, items: ["完成日报工作台本地 MVP"] },
          { name: "问题风险", order: 2, items: ["无"] },
          { name: "下周计划", order: 3, items: ["接入云托管 AI 服务"] }
        ]
      },
      ["本周完成", "问题风险", "下周计划"]
    )

    expect(result.valid).toBe(true)
  })

  test("rejects weekly payloads that collapse into a free-text blob", () => {
    const result = validateWeeklyGeneratedPayload(
      {
        title: "2026年第14周周报",
        sections: [
          { name: "本周完成", order: 1, items: "本周做了很多事" },
          { name: "问题风险", order: 2, items: ["无"] },
          { name: "下周计划", order: 3, items: ["继续推进"] }
        ]
      },
      ["本周完成", "问题风险", "下周计划"]
    )

    expect(result.valid).toBe(false)
  })
})
