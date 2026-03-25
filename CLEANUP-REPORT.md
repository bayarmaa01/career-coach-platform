# Project Cleanup Report

## 📊 Analysis Summary
- **Total Files Found**: 1500+ files
- **Duplicate Docker Compose Files**: 8 files
- **Redundant Scripts**: 11 files
- **Unused Documentation**: 7 files
- **Empty Directories**: 3+ directories

## 🗑️ Files to Delete (Safe)

### 1. Duplicate Docker Compose Files
These are redundant since we use Kubernetes:
- `docker-compose.final.yml`
- `docker-compose.dev.yml`
- `docker-compose.quick.yml`
- `docker-compose.simple.yml`
- `docker-compose.windows.yml`
- `docker-compose.working.yml`
- Keep only: `docker-compose.yml` and `docker-compose.prod.yml`

### 2. Unused Scripts
These are debug/fix scripts no longer needed:
- `check-services.sh`
- `debug-backend.sh`
- `test-backend.sh`
- `quick-fix.sh`
- `fix-backend.sh`
- `fix-windows-permissions.sh`
- `fix-wsl2.sh`
- `start-platform.sh`
- Keep only: `devops.sh` and `run.sh`

### 3. Redundant Documentation
Multiple README files cause confusion:
- `README-CLOUD-NATIVE.md`
- `START_PROJECT.md`
- `COMMANDS.md`
- Keep only: `README.md`, `README-AKS.md`, `DEPLOYMENT-GUIDE.md`, `KUBERNETES-REFERENCE.md`

### 4. Empty/Unused Directories
- `.venv/` (Python virtual env, not needed in containerized setup)
- `ai-service/models/` (empty)
- `ai-service/utils/` (empty)
- `monitoring/` (unused, monitoring handled by scripts)

### 5. Unused Dockerfiles
Keep only main Dockerfiles:
- `backend/Dockerfile.dev` (use main Dockerfile)
- `frontend/Dockerfile.dev` (use main Dockerfile)
- `ai-service/Dockerfile.simple` (use main Dockerfile)
- Keep: `Dockerfile` and `Dockerfile.prod` for each service

## 📋 Files to Review (Maybe Unused)

### Python Service Files
- `ai-service/main-simple.py` (check if used)
- `ai-service/requirements-simple.txt` (check if used)
- `ai-service/requirements-windows.txt` (platform-specific)

### Configuration Files
- `ai-service/install-windows.ps1` (Windows-specific)
- `ai-service/WINDOWS_SETUP.md` (Windows-specific)

## 🎯 Optimized Project Structure

```
career-coach-platform/
├── 📁 backend/
│   ├── src/ (TypeScript source)
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package-lock.json
├── 📁 frontend/
│   ├── src/ (React source)
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── package-lock.json
├── 📁 ai-service/
│   ├── app/ (Python source)
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   └── entrypoint.sh
├── 📁 k8s/ (Kubernetes manifests)
│   ├── kustomization.yaml
│   └── *.yaml files
├── 📁 .github/ (CI/CD)
├── 📁 helm/ (Helm charts)
├── 📁 terraform/ (Infrastructure)
├── 📁 argocd/ (GitOps)
├── 📁 security/ (Security configs)
├── 📁 ansible/ (Automation)
├── 🚀 devops.sh
├── 🚀 run.sh
├── 📄 README.md
├── 📄 README-AKS.md
├── 📄 DEPLOYMENT-GUIDE.md
├── 📄 KUBERNETES-REFERENCE.md
├── 📄 .env.production
└── 📄 .gitignore
```

## 📦 Package.json Optimizations

### Backend Dependencies to Review
- `nodemon` (dev-only, may not be needed in container)
- `jest` + `@types/jest` + `ts-jest` (if tests not used)
- `eslint` + related (if linting not automated)

### Frontend Dependencies to Review
- `vitest` (if tests not used)
- `eslint` + related (if linting not automated)

## 🔐 .gitignore Improvements

Add to .gitignore:
```
# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
.venv/
venv/
ENV/
env/
.ENV/

# Kubernetes
*.kubeconfig
```

## 📈 Expected Results

- **Files Removed**: ~20-30 files
- **Size Reduction**: ~50-100MB
- **Clarity**: Single source of truth for each tool
- **Maintenance**: Easier to understand and maintain
- **Build Speed**: Faster due to fewer files to process
