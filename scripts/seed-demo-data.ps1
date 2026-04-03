[CmdletBinding()]
param(
  [string]$OpenId = "demo-openid-001",
  [string]$Today = "2026-04-04",
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

$ScriptRoot = if ($PSScriptRoot) {
  $PSScriptRoot
} else {
  Split-Path -Parent $MyInvocation.MyCommand.Path
}

if (-not $OutputDir) {
  $OutputDir = Join-Path $ScriptRoot "..\\cloudbase\\generated-seed"
}

function New-ReportSection {
  param(
    [string]$Name,
    [int]$Order,
    [string[]]$Items
  )

  return @{
    name = $Name
    order = $Order
    items = $Items
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$dailyTemplate = @{
  openid = $OpenId
  name = "默认日报模板"
  sections = @(
    @{ id = "daily-completed"; name = "今日完成"; order = 1 },
    @{ id = "daily-risk"; name = "问题风险"; order = 2 },
    @{ id = "daily-next"; name = "明日计划"; order = 3 }
  )
  updatedAt = "2026-04-04T09:00:00+08:00"
}

$weeklyTemplate = @{
  openid = $OpenId
  name = "默认周报模板"
  sections = @(
    @{ id = "weekly-done"; name = "本周完成"; order = 1 },
    @{ id = "weekly-risk"; name = "问题风险"; order = 2 },
    @{ id = "weekly-next"; name = "下周计划"; order = 3 }
  )
  updatedAt = "2026-04-04T09:00:00+08:00"
}

$dailyReports = @(
  @{
    openid = $OpenId
    reportDate = "2026-04-01"
    title = "2026年4月1日日报"
    templateSnapshot = $dailyTemplate
    sections = @(
      (New-ReportSection -Name "今日完成" -Order 1 -Items @("完成登录页样式调整。", "联调登录接口。")),
      (New-ReportSection -Name "问题风险" -Order 2 -Items @("无")),
      (New-ReportSection -Name "明日计划" -Order 3 -Items @("继续推进权限接口联调。"))
    )
    finalText = "2026年4月1日日报`n`n一、今日完成`n1. 完成登录页样式调整。`n2. 联调登录接口。`n`n二、问题风险`n1. 无`n`n三、明日计划`n1. 继续推进权限接口联调。"
    createdAt = "2026-04-01T18:00:00+08:00"
    updatedAt = "2026-04-01T18:00:00+08:00"
  },
  @{
    openid = $OpenId
    reportDate = "2026-04-02"
    title = "2026年4月2日日报"
    templateSnapshot = $dailyTemplate
    sections = @(
      (New-ReportSection -Name "今日完成" -Order 1 -Items @("联调权限接口并定位异常。")),
      (New-ReportSection -Name "问题风险" -Order 2 -Items @("权限异常问题已定位。")),
      (New-ReportSection -Name "明日计划" -Order 3 -Items @("修复权限问题并继续测试。"))
    )
    finalText = "2026年4月2日日报`n`n一、今日完成`n1. 联调权限接口并定位异常。`n`n二、问题风险`n1. 权限异常问题已定位。`n`n三、明日计划`n1. 修复权限问题并继续测试。"
    createdAt = "2026-04-02T18:00:00+08:00"
    updatedAt = "2026-04-02T18:00:00+08:00"
  },
  @{
    openid = $OpenId
    reportDate = "2026-04-03"
    title = "2026年4月3日日报"
    templateSnapshot = $dailyTemplate
    sections = @(
      (New-ReportSection -Name "今日完成" -Order 1 -Items @("修复权限问题并完成关键流程测试。")),
      (New-ReportSection -Name "问题风险" -Order 2 -Items @("无")),
      (New-ReportSection -Name "明日计划" -Order 3 -Items @("补充边界情况验证。"))
    )
    finalText = "2026年4月3日日报`n`n一、今日完成`n1. 修复权限问题并完成关键流程测试。`n`n二、问题风险`n1. 无`n`n三、明日计划`n1. 补充边界情况验证。"
    createdAt = "2026-04-03T18:00:00+08:00"
    updatedAt = "2026-04-03T18:00:00+08:00"
  }
)

$weeklyReports = @(
  @{
    openid = $OpenId
    weekKey = "2026-W14"
    title = "2026年第14周周报"
    templateSnapshot = $weeklyTemplate
    sourceDailyIds = @("daily-2026-04-01", "daily-2026-04-02", "daily-2026-04-03")
    sections = @(
      (New-ReportSection -Name "本周完成" -Order 1 -Items @("完成登录页调整、接口联调和权限问题修复，推进关键流程进入可测试状态。")),
      (New-ReportSection -Name "问题风险" -Order 2 -Items @("本周联调过程中出现权限异常，已完成定位与修复。")),
      (New-ReportSection -Name "下周计划" -Order 3 -Items @("补充边界情况验证并继续推进剩余联调事项。"))
    )
    finalText = "2026年第14周周报`n`n一、本周完成`n1. 完成登录页调整、接口联调和权限问题修复，推进关键流程进入可测试状态。`n`n二、问题风险`n1. 本周联调过程中出现权限异常，已完成定位与修复。`n`n三、下周计划`n1. 补充边界情况验证并继续推进剩余联调事项。"
    createdAt = "2026-04-04T18:00:00+08:00"
    updatedAt = "2026-04-04T18:00:00+08:00"
  }
)

$users = @(
  @{
    openid = $OpenId
    createdAt = "2026-04-01T09:00:00+08:00"
    updatedAt = "2026-04-04T18:00:00+08:00"
  }
)

$payloads = @{
  "users.json" = $users
  "daily-templates.json" = @($dailyTemplate)
  "weekly-templates.json" = @($weeklyTemplate)
  "daily-reports.json" = $dailyReports
  "weekly-reports.json" = $weeklyReports
}

foreach ($entry in $payloads.GetEnumerator()) {
  $path = Join-Path $OutputDir $entry.Key
  $entry.Value | ConvertTo-Json -Depth 10 | Set-Content -Path $path -Encoding UTF8
}

Write-Host "Generated demo seed data in $OutputDir"

