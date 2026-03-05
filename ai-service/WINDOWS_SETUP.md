# 🪟 Windows Setup Guide for AI Career Coach Platform

This guide helps you set up the AI service on Windows systems where complex ML dependencies may fail to build.

## 🚨 Common Windows Issues

The following errors are common on Windows:
- `Failed to build blis`
- `Failed to build thinc` 
- `Failed to build spacy`
- `error: failed-wheel-build-for-install`

These occur because Windows lacks the required C++ compilers and build tools.

## 🛠️ Solution Options

### Option 1: Use Pre-built Wheels (Recommended)

Run the Windows installation script:
```powershell
cd ai-service
.\install-windows.ps1
```

### Option 2: Manual Installation

1. **Install Visual Studio Build Tools**
   ```powershell
   # Download and install Visual Studio Build Tools 2022
   # Select: "C++ build tools" and "Windows SDK"
   ```

2. **Use Windows-compatible requirements**
   ```powershell
   # Create virtual environment
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   
   # Upgrade pip
   python -m pip install --upgrade pip setuptools wheel
   
   # Install Windows-compatible requirements
   pip install -r requirements-windows.txt
   ```

3. **Download spaCy model**
   ```powershell
   python -m spacy download en_core_web_sm
   ```

### Option 3: Simplified Dependencies (No ML)

If you continue to have issues, use the simplified version:

```powershell
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements-simple.txt
```

Then modify `main.py` to use the simple processor:

```python
# Replace this line:
# from app.services.resume_processor import ResumeProcessor

# With this:
from app.services.simple_resume_processor import SimpleResumeProcessor as ResumeProcessor
```

## 🔧 Alternative: Use Docker on Windows

The easiest solution is to use Docker Desktop:

1. **Install Docker Desktop for Windows**
2. **Start Docker Desktop**
3. **Run the full stack**:
   ```powershell
   cd career-coach-platform
   docker-compose up -d
   ```

## 📋 Prerequisites for Windows

### Required Software
- **Python 3.11+** (from python.org)
- **Visual Studio Build Tools 2022** (with C++ tools)
- **Git** (for cloning repository)

### Optional but Recommended
- **Docker Desktop** (for containerized deployment)
- **Windows Terminal** (better PowerShell experience)

## 🐛 Troubleshooting

### Issue: "PowerShell cannot be loaded"
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "ModuleNotFoundError: No module named 'pip'"
```powershell
# Reinstall Python with "Add Python to PATH" option checked
# Or use python -m pip instead of pip directly
```

### Issue: "Failed building wheel for spacy"
```powershell
# Use pre-built wheel
pip install --only-binary=all spacy

# Or install from conda
conda install -c conda-forge spacy
```

### Issue: "Microsoft Visual C++ 14.0 is required"
```powershell
# Install Visual Studio Build Tools 2022
# Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

## 🚀 Quick Start Commands

### Using Docker (Easiest)
```powershell
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f ai-service
```

### Using Python (Manual Setup)
```powershell
cd ai-service

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements-windows.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Using Simplified Version
```powershell
cd ai-service

# Use simplified requirements
pip install -r requirements-simple.txt

# Start with simple processor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Testing the Installation

1. **Check if service is running**:
   ```powershell
   curl http://localhost:8000/health
   ```

2. **Test API documentation**:
   Open http://localhost:8000/docs in your browser

3. **Test resume analysis**:
   ```powershell
   curl -X POST "http://localhost:8000/api/analyze-resume" \
        -H "Content-Type: application/json" \
        -d '{"resume_id": "test", "file_path": "test.pdf"}'
   ```

## 🔄 Development Workflow

### For Local Development
```powershell
# Terminal 1: Start AI Service
cd ai-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend  
cd frontend
npm run dev
```

### For Docker Development
```powershell
# Use development configuration
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f
```

## 📚 Additional Resources

- [Python on Windows Guide](https://docs.python.org/3/using/windows.html)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- [Windows Terminal](https://aka.ms/terminal)

## 🆘 Need Help?

If you're still having issues:

1. **Try Docker first** - it's the most reliable option
2. **Use the simplified requirements** - fewer dependencies
3. **Check Python version** - ensure it's 3.11+
4. **Install Visual Studio Build Tools** - for C++ compilation
5. **Join our Discord** - for community support

---

💡 **Pro Tip**: Docker Desktop on Windows handles all the complex dependency management automatically and is the recommended approach for Windows development.
