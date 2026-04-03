[CmdletBinding()]
param(
  [string]$EnvId = $env:CLOUDBASE_ENV_ID,
  [string]$ModelDir = (Join-Path $PSScriptRoot "..\\cloudbase\\database-schemas")
)

$ErrorActionPreference = "Stop"

if (-not $EnvId) {
  throw "Missing CloudBase environment id. Set CLOUDBASE_ENV_ID or pass -EnvId."
}

$resolvedModelDir = (Resolve-Path $ModelDir).Path
$jsonFiles = Get-ChildItem -Path $resolvedModelDir -Filter *.json -File -ErrorAction SilentlyContinue

if (-not $jsonFiles) {
  throw "No model json files found in $resolvedModelDir. Pull or create validated model files before pushing."
}

$tcbCommand = Get-Command tcb -ErrorAction SilentlyContinue
if (-not $tcbCommand) {
  throw "CloudBase CLI (tcb) is not installed or not available in PATH."
}

Write-Host "Pushing CloudBase data models from $resolvedModelDir to $EnvId..."
& $tcbCommand.Source db model push -e $EnvId -d $resolvedModelDir

