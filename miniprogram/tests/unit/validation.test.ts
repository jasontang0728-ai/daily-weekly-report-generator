import { describe, expect, test } from "vitest"

import {
  validateDailyRawInput,
  validateTemplateSections
} from "../../lib/utils/validation"

describe("validation", () => {
  test("rejects daily raw input longer than 500 characters", () => {
    const result = validateDailyRawInput("a".repeat(501))

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("日报原始输入不能超过500字")
  })

  test("accepts daily raw input of exactly 500 characters", () => {
    const result = validateDailyRawInput("a".repeat(500))

    expect(result.valid).toBe(true)
  })

  test("rejects templates with more than six sections", () => {
    const result = validateTemplateSections([
      "栏目1",
      "栏目2",
      "栏目3",
      "栏目4",
      "栏目5",
      "栏目6",
      "栏目7"
    ])

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("最多只能添加 6 个栏目")
  })

  test("rejects duplicate section names", () => {
    const result = validateTemplateSections(["今日完成", "问题风险", "今日完成"])

    expect(result.valid).toBe(false)
    expect(result.reason).toBe("栏目名称不能重复")
  })
})
