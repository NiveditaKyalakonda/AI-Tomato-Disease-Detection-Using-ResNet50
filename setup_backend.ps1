# ============================================================
# TomatoAI — One-time Backend Setup
# Creates virtual environment and installs all Python packages.
#
# Run once from the tomato-ai/ directory:
#   .\setup_backend.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$backendDir = Join-Path $PSScriptRoot "backend"

Write-Host "`n🍅 TomatoAI — Backend Setup" -ForegroundColor Red
Write-Host "=============================" -ForegroundColor DarkGray

# Find Python 3.10, matching the trained Keras model runtime.
$python = $null
foreach ($p in @("python", "python3", "py")) {
    try {
        $ver = & $p --version 2>&1
        if ($ver -match "Python 3\.10\.") { $python = $p; break }
    } catch {}
}

if (-not $python) {
    Write-Host "❌ Python 3.10 not found. Install Python 3.10 from https://python.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python: $(&$python --version)" -ForegroundColor Green

Set-Location $backendDir

# Create venv
$venv = Join-Path $backendDir "venv-tf"
if (-not (Test-Path $venv)) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Cyan
    & $python -m venv venv
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

$venvPython = Join-Path $venv "Scripts\python.exe"

# Upgrade pip
Write-Host "⬆  Upgrading pip..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    throw "pip upgrade failed."
}

# Install requirements
Write-Host "📥 Installing requirements..." -ForegroundColor Cyan
& $venvPython -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependency installation failed."
}

# Verify the exact runtime and model used by the application.
Write-Host "🧪 Verifying TensorFlow runtime..." -ForegroundColor Cyan
& $venvPython test_tensorflow.py
if ($LASTEXITCODE -ne 0) {
    throw "TensorFlow runtime verification failed."
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "   Verify model: .\venv-tf\Scripts\python.exe test_model.py ..\dataset\test\augmented_dataset\Tomato_Early_blight\img_1.jpg" -ForegroundColor DarkGray
Write-Host "   Start the server:  .\start_backend.ps1" -ForegroundColor DarkGray
