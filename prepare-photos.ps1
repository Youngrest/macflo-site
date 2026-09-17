# Раскладывает фото из photos/ по именам, которые ждёт сайт, и сжимает их.
# Запуск: powershell -ExecutionPolicy Bypass -File prepare-photos.ps1
Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot 'photos'
$dst = Join-Path $PSScriptRoot 'site\img'

# имя на сайте  =>  исходный файл
$map = @{
  'hero.jpg'          = 'photo_2026-09-17_19-12-44.jpg'
  'cat-bouquets.jpg'  = 'photo_2026-09-17_19-12-08.jpg'
  'cat-berries.jpg'   = 'photo_2026-09-17_19-13-42.jpg'
  'cat-custom.jpg'    = 'photo_2026-09-17_19-14-07.jpg'
  'cat-macarons.jpg'  = 'photo_2026-09-17_19-21-33.jpg'
  'macarons.jpg'      = 'photo_2026-09-17_19-21-33.jpg'
  'cat-baskets.jpg'   = 'photo_2026-09-17_19-11-57.jpg'
  'bouquet-01.jpg'    = 'photo_2026-09-17_19-14-33.jpg'
  'bouquet-02.jpg'    = 'photo_2026-09-17_19-12-15.jpg'
  'bouquet-03.jpg'    = 'photo_2026-09-17_19-13-14.jpg'
  'bouquet-04.jpg'    = 'photo_2026-09-17_19-13-19.jpg'
  'bouquet-05.jpg'    = 'photo_2026-09-17_19-13-56.jpg'
  'bouquet-06.jpg'    = 'photo_2026-09-17_19-12-08.jpg'
  'bouquet-07.jpg'    = 'photo_2026-09-17_19-13-08.jpg'
  'bouquet-08.jpg'    = 'photo_2026-09-17_19-12-00.jpg'
  'berries-01.jpg'    = 'photo_2026-09-17_19-13-42.jpg'
  'berries-04.jpg'    = 'photo_2026-09-17_19-11-50.jpg'
  'custom-bouquet.jpg'= 'photo_2026-09-17_19-14-07.jpg'
  'custom-basket.jpg' = 'photo_2026-09-17_19-11-55.jpg'
  'insta-01.jpg'      = 'photo_2026-09-17_19-13-12.jpg'
  'insta-02.jpg'      = 'photo_2026-09-17_19-11-57.jpg'
  'insta-03.jpg'      = 'photo_2026-09-17_19-13-56.jpg'
  'insta-04.jpg'      = 'photo_2026-09-17_19-12-44.jpg'
  'insta-05.jpg'      = 'photo_2026-09-17_19-13-42.jpg'
  'insta-06.jpg'      = 'photo_2026-09-17_19-12-15.jpg'
}

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

foreach ($name in $map.Keys) {
  $in = Join-Path $src $map[$name]
  if (-not (Test-Path $in)) { Write-Host "SKIP $name (нет $($map[$name]))"; continue }
  $max = if ($name -eq 'hero.jpg') { 2000 } elseif ($name -like 'cat-*' -or $name -like 'insta-*') { 800 } else { 1400 }
  $img = [System.Drawing.Image]::FromFile($in)
  $scale = [Math]::Min(1.0, $max / [Math]::Max($img.Width, $img.Height))
  $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($img, 0, 0, $w, $h)
  $out = Join-Path $dst $name
  $bmp.Save($out, $jpegCodec, $encParams)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Host ("{0,-20} {1}x{2}  {3} KB" -f $name, $w, $h, [int]((Get-Item $out).Length / 1KB))
}
