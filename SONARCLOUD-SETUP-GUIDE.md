# SonarCloud Setup Guide for Career Coach Platform

## 🎯 Overview
This guide will help you set up SonarCloud properly to enable code quality and security scanning in your CI/CD pipeline.

## 📋 Current Status
- ✅ SonarCloud stage is configured in CI/CD pipeline
- ✅ `continue-on-error: true` prevents pipeline failures
- ❌ Project not found error needs to be resolved
- ❌ Missing `SONAR_TOKEN` secret

## 🔧 Step-by-Step Setup

### 1. Create SonarCloud Account
1. Go to [SonarCloud](https://sonarcloud.io/)
2. Sign up with your GitHub account
3. Authorize SonarCloud to access your GitHub repositories

### 2. Create New Project
1. Click **"+"** button → **"Analyze new project"**
2. Select **GitHub** as the repository provider
3. Choose your repository: `bayarmaa01/career-coach-platform`
4. Select **"I want to analyze my project with SonarCloud"**
5. Choose your organization: `bayarmaa01`
6. Click **"Set up"**

### 3. Get Analysis Method
1. Choose **"With GitHub Actions"** (recommended)
2. SonarCloud will provide you with a **SONAR_TOKEN**
3. Copy this token - you'll need it for the next step

### 4. Add SONAR_TOKEN to GitHub Secrets
1. Go to your GitHub repository: `bayarmaa01/career-coach-platform`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `SONAR_TOKEN`
5. Secret: Paste the token from SonarCloud
6. Click **"Add secret"**

### 5. Verify Project Configuration
Your `sonar-project.properties` should contain:
```properties
sonar.projectKey=bayarmaa01_career-coach-platform
sonar.organization=bayarmaa01
sonar.projectName=Career Coach Platform
sonar.projectVersion=1.0
```

### 6. Test the Setup
1. Push a change to trigger the CI/CD pipeline
2. Check the **SonarCloud** stage in GitHub Actions
3. Verify the analysis completes successfully

## 🚀 Alternative: Use Community Edition

If you prefer not to use SonarCloud, you can set up a local SonarQube instance:

### Option A: Docker SonarQube
```bash
docker run -d --name sonarqube \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -p 9000:9000 \
  sonarqube:community
```

### Option B: Update CI/CD to use local SonarQube
```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  env:
    SONAR_HOST_URL: http://your-sonarqube-server:9000
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## 📊 What You'll Get After Setup

### Code Quality Metrics
- **Maintainability Rating**: A, B, C, D, E
- **Reliability Rating**: A, B, C, D, E
- **Security Rating**: A, B, C, D, E
- **Coverage**: Test coverage percentage
- **Duplicated Lines**: Code duplication percentage
- **Technical Debt**: Estimated time to fix issues

### Security Scanning
- **Vulnerabilities**: Security issues in your code
- **Hotspots**: Security-sensitive code patterns
- **Security Hotspots**: Code that needs manual review

### Integration Benefits
- **Pull Request Decoration**: Code quality directly in PRs
- **Quality Gates**: Prevent merging low-quality code
- **Branch Analysis**: Track quality over time
- **GitHub Integration**: Seamless workflow integration

## 🔍 Current CI/CD Configuration

Your pipeline already includes:
```yaml
sonarcloud:
  runs-on: ubuntu-latest
  needs: [test-build, ai-service-test]
  steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - name: Setup Node & Python
      # ... setup steps
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      continue-on-error: true
```

## 📈 Expected Results After Setup

1. **Code Quality Dashboard**: Viewable at SonarCloud
2. **PR Checks**: Automatic quality gates on pull requests
3. **Security Reports**: Vulnerability detection and reporting
4. **Technical Debt Tracking**: Monitor code improvement over time
5. **Team Metrics**: Track team coding standards compliance

## 🆘 Troubleshooting

### Common Issues
1. **"Project not found"**: Ensure project key matches SonarCloud project
2. **"Invalid token"**: Regenerate SONAR_TOKEN from SonarCloud
3. **"Permission denied"**: Check GitHub repository permissions
4. **"Analysis failed"**: Verify sonar-project.properties configuration

### Debug Commands
```bash
# Check SonarCloud project exists
curl -u "YOUR_TOKEN:" "https://sonarcloud.io/api/projects/search?projects=bayarmaa01_career-coach-platform"

# Validate project properties
sonar-scanner -Dproject.settings=sonar-project.properties --dry-run
```

## 🎯 Next Steps

1. **Complete SonarCloud setup** using this guide
2. **Remove `continue-on-error: true`** once working
3. **Configure quality gates** in SonarCloud
4. **Set up notifications** for quality issues
5. **Integrate with team workflow** (PR reviews, etc.)

---

**Note**: The current CI/CD pipeline will continue to work even without SonarCloud setup, but you'll miss out on valuable code quality and security insights.
