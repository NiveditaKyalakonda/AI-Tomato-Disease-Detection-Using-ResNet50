# ============================================================
# TomatoAI — Start Frontend
# Run from the tomato-ai/ directory:
#   .\start_frontend.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n🍅 TomatoAI Frontend Launcher" -ForegroundColor Green
Write-Host "================================" -ForegroundColor DarkGray

# Find npm
$npmPaths = @(
    "D:\app\Hp\product\21c\npm.cmd",
    "C:\Program Files\nodejs\npm.cmd",
    "npm"
)
$npm = $null
foreach ($p in $npmPaths) {
    if (Test-Path $p -ErrorAction SilentlyContinue) { $npm = $p; break }
    try { Get-Command $p -ErrorAction Stop | Out-Null; $npm = $p; break } catch {}
}

if (-not $npm) {
    Write-Host "❌ npm not found. Install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install deps if needed
$nodeModules = Join-Path $frontendDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    Set-Location $frontendDir
    & $npm install
}

Write-Host ""
Write-Host "▶  Starting Vite dev server on http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Make sure the backend is running on http://localhost:5000" -ForegroundColor DarkGray
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor DarkGray

Set-Location $frontendDir
& $npm run dev
