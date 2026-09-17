# Простой статический сервер для локального просмотра макета.
# Запуск:  powershell -ExecutionPolicy Bypass -File serve.ps1
# Открыть: http://localhost:8765/
param([int]$Port = 8765, [string]$Root = (Join-Path $PSScriptRoot 'site'))

$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
  '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'; '.ico'='image/x-icon'; '.json'='application/json' }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }
    $file = Join-Path $Root ($path -replace '/', '\')
    $res = $ctx.Response
    try {
      $res.Headers.Add('Cache-Control', 'no-store')
      if (Test-Path $file -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
        $res.ContentLength64 = $bytes.Length
        if ($ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else {
        $res.StatusCode = 404
      }
    } catch { Write-Host "ERR $path : $($_.Exception.Message)" }
    try { $res.Close() } catch {}
  }
} finally { $listener.Stop() }
