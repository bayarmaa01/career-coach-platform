# Windows Installation Script for AI Service
Write-Host "🚀 Installing AI Career Coach Platform AI Service for Windows..." -ForegroundColor Green

# Check Python version
$pythonVersion = python --version 2>&1
Write-Host "Python version: $pythonVersion" -ForegroundColor Cyan

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip setuptools wheel

# Install requirements using Windows-compatible file
Write-Host "Installing requirements..." -ForegroundColor Yellow
pip install -r requirements-windows.txt

# Download spaCy model
Write-Host "Downloading spaCy model..." -ForegroundColor Yellow
python -m spacy download en_core_web_sm

# Create uploads directory
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads"
}

Write-Host "✅ Installation completed successfully!" -ForegroundColor Green
Write-Host "To start the service, run: .\venv\Scripts\Activate.ps1 && uvicorn main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Cyan
