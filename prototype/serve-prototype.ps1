param(
  [int]$Port = 8765
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$filePath = Join-Path $root "clickable-prototype.html"

if (-not (Test-Path $filePath)) {
  throw "Prototype file not found: $filePath"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    try {
      $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
      $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)

      $response.StatusCode = 200
      $response.ContentType = "text/html; charset=utf-8"
      $response.ContentLength64 = $buffer.Length
      $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
