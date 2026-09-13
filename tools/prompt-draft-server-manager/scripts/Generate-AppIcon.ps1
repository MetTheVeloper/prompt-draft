param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePng,

  [Parameter(Mandatory = $true)]
  [string]$OutputIco
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path $SourcePng).Path
$outputDirectory = Split-Path -Parent $OutputIco
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$sizes = @(16, 20, 24, 32, 40, 48, 64, 128, 256)
$payloads = [System.Collections.Generic.List[byte[]]]::new()
$source = [System.Drawing.Image]::FromFile($sourcePath)

try {
  foreach ($size in $sizes) {
    $bitmap = [System.Drawing.Bitmap]::new(
      $size,
      $size,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $destination = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
        $graphics.DrawImage($source, $destination)
      }
      finally {
        $graphics.Dispose()
      }

      $stream = [System.IO.MemoryStream]::new()
      try {
        $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $payloads.Add($stream.ToArray())
      }
      finally {
        $stream.Dispose()
      }
    }
    finally {
      $bitmap.Dispose()
    }
  }
}
finally {
  $source.Dispose()
}

$fileStream = [System.IO.File]::Create($OutputIco)
$writer = [System.IO.BinaryWriter]::new($fileStream)
try {
  # ICONDIR
  $writer.Write([UInt16]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]$sizes.Count)

  $offset = 6 + (16 * $sizes.Count)
  for ($index = 0; $index -lt $sizes.Count; $index++) {
    $size = $sizes[$index]
    $payload = $payloads[$index]
    $dimension = if ($size -eq 256) { 0 } else { $size }

    # ICONDIRENTRY. Width/height of 0 represents 256px.
    $writer.Write([byte]$dimension)
    $writer.Write([byte]$dimension)
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$payload.Length)
    $writer.Write([UInt32]$offset)
    $offset += $payload.Length
  }

  foreach ($payload in $payloads) {
    $writer.Write($payload)
  }
}
finally {
  $writer.Dispose()
}

Write-Host "Generated Windows icon: $OutputIco" -ForegroundColor DarkGray
