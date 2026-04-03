import { describe, expect, test } from "vitest"

import { formatDailyTitle, formatWeeklyTitle } from "../../lib/utils/date"
import { renderReportDocument } from "../../lib/utils/render"

describe("report rendering", () => {
  test("formats daily titles in the required Chinese document style", () => {
    expect(formatDailyTitle("2026-04-03")).toBe("2026年4月3日日报")
  })

  test("formats weekly titles without a date range suffix", () => {
    expect(formatWeeklyTitle(2026, 14)).toBe("2026年第14周周报")
  })

  test("renders numbered sections and items", () => {
    const output = renderReportDocument({
      title: "2026年4月3日日报",
      sections: [
        {
          name: "今日完成",
          order: 1,
          items: ["完成登录页调整", "联调两个后端接口"]
        },
        {
          name: "问题风险",
          order: 2,
          items: ["无"]
        }
      ]
    })

    expect(output).toContain("一、今日完成")
    expect(output).toContain("1. 完成登录页调整")
    expect(output).toContain("2. 联调两个后端接口")
    expect(output).toContain("二、问题风险")
    expect(output).toContain("1. 无")
  })
})
