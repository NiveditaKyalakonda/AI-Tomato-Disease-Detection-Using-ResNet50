# ============================================================
# TomatoAI — Start Backend
# Run from the tomato-ai/ directory:
#   .\start_backend.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$backendDir  = Join-Path $PSScriptRoot "backend"
$venvPython  = Join-Path $backendDir "venv-tf\Scripts\python.exe"
Write-Host "`n🍅 TomatoAI Backend Launcher" -ForegroundColor Red
Write-Host "================================" -ForegroundColor DarkGray

# Choose interpreter
if (Test-Path $venvPython) {
    $python = $venvPython
    Write-Host "✅ Using venv Python: $venvPython" -ForegroundColor Green
} else {
    Write-Host "❌ TensorFlow backend environment not found. Run .\setup_backend.ps1 first." -ForegroundColor Red
    exit 1
}

# Check for model file
$modelPath = Join-Path $backendDir "model\resnet50_tomato_disease.keras"
if (-not (Test-Path $modelPath)) {
    Write-Host ""
    Write-Host "⚠️  Model file not found:" -ForegroundColor Yellow
    Write-Host "   $modelPath" -ForegroundColor DarkGray
    Write-Host "   Prediction requests will return an explicit model-unavailable error." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "▶  Starting Flask server on http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor DarkGray

Set-Location $backendDir
& $python run.py
