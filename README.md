# 🎯 Career Coach Platform

> **AI-Powered Career Development Platform** - Your intelligent companion for professional growth and career advancement

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-%3E%3D1.28.0-blue.svg)](https://kubernetes.io/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.0.0-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Project Overview

**Career Coach Platform** is an intelligent, AI-powered career development system designed to help professionals navigate their career journey with personalized guidance, skill assessment, and strategic planning.

### 🎯 Problem It Solves

- **Career Uncertainty**: Professionals struggle with career direction and skill gaps
- **Information Overload**: Too many resources, no personalized guidance
- **Skill Mismatch**: Difficulty identifying which skills to develop
- **Interview Preparation**: Lack of structured interview coaching
- **Resume Optimization**: Generic advice that doesn't stand out

### 👥 Target Users

- **Early Career Professionals** (22-30 years)
- **Mid-Career Switchers** (30-45 years)
- **Technical Professionals** seeking advancement
- **Career Coaches** managing multiple clients
- **HR Departments** providing employee development tools

### 💎 Key Value Proposition

> **"Your AI Career Coach - Available 24/7, Personalized for Your Success"**

- 🤖 **AI-Powered Insights**: Machine learning-driven career recommendations
- 📊 **Data-Driven Decisions**: Analytics-backed career path planning
- 🚀 **Smart Automation**: One-command deployment with intelligent optimization
- 🌐 **Cloud-Native Architecture**: Production-ready, scalable infrastructure

---

## ✨ Features

### 🤖 AI-Powered Career Intelligence
- **Resume Analysis**: Advanced NLP parsing and skill extraction using Google Gemini AI
- **Career Path Recommendations**: ML-driven personalized suggestions with skill matching
- **Skill Gap Analysis**: Identify and bridge competency gaps with learning resources
- **AI Career Chat**: Interactive chat assistant for career guidance and interview preparation
- **Interview Preparation**: AI-generated practice questions and personalized feedback
- **Salary Insights**: Market-based compensation analysis
- **CV Generation**: AI-powered resume creation and optimization

### 🎯 User Experience
- **Interactive Dashboard**: Real-time career progress tracking
- **Personalized Learning Paths**: Curated educational resources
- **Goal Setting & Tracking**: SMART career objectives
- **Networking Opportunities**: Professional connection suggestions
- **Industry Insights**: Trend analysis and market intelligence

### 🛠️ Developer & Admin Features
- **Smart Deployment**: Auto-detects optimal deployment strategy
- **Real-time Monitoring**: Comprehensive health and performance metrics
- **GitOps Automation**: Zero-touch deployment with ArgoCD
- **Multi-environment Support**: Development, staging, production
- **API-First Design**: RESTful APIs for seamless integration

### 🔧 DevOps Excellence
- **Intelligent Automation**: Parallel builds, resource optimization
- **Self-Healing Infrastructure**: Automatic failure recovery
- **Comprehensive Observability**: Prometheus metrics + Grafana dashboards
- **Security First**: JWT authentication, secrets management
- **Scalable Architecture**: Microservices with container orchestration

---

## 🛠️ Tech Stack

| Component | Technology | Version | Purpose |
|-----------|-------------|---------|---------|
| **Frontend** | React | 18.2.0 | User Interface & Experience |
| | TypeScript | 5.4.5 | Type Safety & Development |
| | Tailwind CSS | 3.4.3 | Utility-First Styling |
| | Vite | 5.2.12 | Fast Build Tool |
| | Redux Toolkit | 1.9.5 | State Management |
| **Backend** | Node.js | 20.0.0 | Runtime Environment |
| | Express.js | 4.18.2 | Web Framework |
| | TypeScript | 5.2.2 | Type Safety |
| | PostgreSQL | 15+ | Primary Database |
| | Redis | 7+ | Caching & Sessions |
| | JWT | 9.0.2 | Authentication |
| **AI Service** | Google Gemini AI | Latest | AI/ML Ecosystem |
| | Node.js Integration | 20.0.0+ | AI Service Integration |
| | TypeScript | 5.2.2 | Type Safety for AI |
| | Python | 3.11+ | Legacy AI Support |
| | FastAPI | 0.104.1 | Modern API Framework |
| | spaCy | 3.7.2 | Natural Language Processing |
| | Transformers | 4.36.0 | ML Models |
| | Scikit-learn | 1.3.2 | Machine Learning |
| **Infrastructure** | Docker | 20.0.0+ | Containerization |
| | Kubernetes | 1.28.0+ | Container Orchestration |
| | ArgoCD | Latest | GitOps Automation |
| | Prometheus | Latest | Metrics Collection |
| | Grafana | Latest | Visualization |
| | Minikube | Latest | Local Development |

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TD
    subgraph "Client Layer"
        A[Web Browser] --> B[React Frontend]
        C[Mobile App] --> B
    end
    
    subgraph "Application Layer"
        B --> D[API Gateway]
        D --> E[Backend Service]
        D --> F[AI Service]
        E --> G[PostgreSQL]
        F --> H[Vector DB]
        E --> I[Redis Cache]
    end
    
    subgraph "Infrastructure Layer"
        J[Kubernetes Cluster]
        K[Docker Containers]
        L[Load Balancer]
        M[Service Mesh]
    end
    
    subgraph "Monitoring Layer"
        N[Prometheus]
        O[Grafana]
        P[Alert Manager]
        Q[Log Aggregation]
    end
    
    E --> N
    F --> N
    N --> O
    N --> P
```

### Microservices Architecture

```mermaid
graph LR
    subgraph "Frontend Services"
        A[React App]
        B[Static Assets]
    end
    
    subgraph "Backend Services"
        C[User Service]
        D[Career Service]
        E[Analytics Service]
        F[Notification Service]
    end
    
    subgraph "AI Services"
        G[Resume Parser]
        H[Recommendation Engine]
        I[Skill Analyzer]
    end
    
    subgraph "Data Services"
        J[PostgreSQL]
        K[Redis]
        L[Elasticsearch]
    end
    
    A --> C
    A --> D
    C --> J
    D --> G
    D --> H
    E --> I
    F --> K
    G --> J
    H --> L
```

---

## 🔄 Workflows

### User Journey Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant DB as Database
    
    U->>F: Upload Resume
    F->>B: Submit File
    B->>AI: Parse Resume
    AI->>AI: Extract Skills & Experience
    AI->>DB: Store Analysis
    AI->>B: Return Insights
    B->>F: Career Recommendations
    F->>U: Display Results
    
    U->>F: Set Career Goals
    F->>B: Update Profile
    B->>DB: Save Goals
    B->>AI: Generate Learning Path
    AI->>F: Personalized Plan
    F->>U: Show Roadmap
```

### AI Service Interaction Flow

```mermaid
sequenceDiagram
    participant B as Backend
    participant AI as AI Service
    participant NLP as NLP Processor
    participant ML as ML Models
    participant VDB as Vector DB
    
    B->>AI: Resume Analysis Request
    AI->>NLP: Parse Document
    NLP->>NLP: Extract Entities
    NLP->>ML: Classify Skills
    ML->>VDB: Find Similar Profiles
    VDB->>ML: Return Matches
    ML->>AI: Generate Recommendations
    AI->>B: Return Analysis Results
```

### Deployment Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant Argo as ArgoCD
    participant K8s as Kubernetes
    participant Mon as Monitoring
    
    Dev->>Git: Push Code Changes
    Git->>Argo: Detect Changes
    Argo->>Argo: Sync Manifests
    Argo->>K8s: Apply Deployments
    K8s->>K8s: Roll Out Updates
    K8s->>Mon: Emit Metrics
    Mon->>Argo: Health Status
    Argo->>Dev: Deployment Status
```

---

## 📁 Project Structure

```
career-coach-platform/
├── 📂 backend/                    # Node.js API Service
│   ├── 📂 src/                   # TypeScript Source Code
│   │   ├── 📂 controllers/       # Request Handlers
│   │   ├── 📂 models/            # Data Models
│   │   ├── 📂 routes/            # API Routes
│   │   ├── 📂 middleware/        # Express Middleware
│   │   ├── 📂 config/            # Configuration
│   │   └── 📂 utils/             # Utility Functions
│   ├── 📂 tests/                 # Test Suites
│   ├── 🐳 Dockerfile             # Container Build
│   ├── 📄 package.json           # Dependencies
│   └── 📄 tsconfig.json          # TypeScript Config
├── 📂 frontend/                   # React Application
│   ├── 📂 src/                   # React Source Code
│   │   ├── 📂 components/         # React Components
│   │   ├── 📂 pages/             # Page Components
│   │   ├── 📂 hooks/             # Custom Hooks
│   │   ├── 📂 store/             # Redux Store
│   │   ├── 📂 services/          # API Services
│   │   └── 📂 utils/             # Utility Functions
│   ├── 📂 public/                # Static Assets
│   ├── 🐳 Dockerfile             # Container Build
│   ├── 📄 package.json           # Dependencies
│   └── 📄 vite.config.ts         # Vite Configuration
├── 📂 ai-service/                 # Python AI Service
│   ├── 📂 src/                   # Python Source Code
│   │   ├── 📂 models/            # ML Models
│   │   ├── 📂 processors/        # NLP Processors
│   │   ├── 📂 analyzers/         # Analysis Modules
│   │   └── 📂 utils/             # Utility Functions
│   ├── 📂 tests/                 # Test Suites
│   ├── 🐳 Dockerfile             # Container Build
│   └── 📄 requirements.txt        # Python Dependencies
├── 📂 k8s/                       # Kubernetes Configurations
│   ├── 📂 career-coach-prod/     # Production Environment
│   │   ├── 📄 namespace.yaml     # Namespace Definition
│   │   ├── 📄 configmap.yaml     # Configuration Maps
│   │   ├── 📄 secrets.yaml       # Secret Management
│   │   ├── 📄 postgres-*.yaml    # PostgreSQL Setup
│   │   ├── 📄 redis-*.yaml       # Redis Configuration
│   │   ├── 📄 *-deployment.yaml  # Service Deployments
│   │   ├── 📄 *-service.yaml     # Service Definitions
│   │   └── 📄 kustomization.yaml # Kustomize Config
│   └── 📂 monitoring/            # Monitoring Stack
│       ├── 📄 prometheus-*.yaml  # Prometheus Config
│       ├── 📄 grafana-*.yaml     # Grafana Setup
│       └── 📄 argocd-*.yaml      # ArgoCD Configuration
├── 📂 docs/                      # Documentation
│   ├── 📄 api/                   # API Documentation
│   ├── 📄 deployment/            # Deployment Guides
│   └── 📄 architecture/          # Architecture Docs
├── 📂 scripts/                   # Utility Scripts
│   ├── 🚀 devops-smart.sh        # Intelligent Deployment
│   ├── 📄 setup.sh               # Environment Setup
│   └── 📄 backup.sh              # Data Backup
├── 📄 docker-compose.yml         # Local Development
├── 📄 docker-compose.prod.yml    # Production Setup
├── 📄 .env.example              # Environment Template
├── 📄 .gitignore                # Git Ignore Rules
└── 📄 README.md                  # This File
```

---

## 🚀 Installation Guide

### Prerequisites

- **Node.js** ≥ 18.0.0
- **Python** ≥ 3.11
- **Docker** ≥ 20.0.0
- **Kubernetes** (Minikube for local)
- **Git** for version control

### Quick Start (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/bayarmaa01/career-coach-platform.git
cd career-coach-platform

# 2. Run intelligent deployment (auto-detects optimal strategy)
chmod +x devops-smart.sh
./devops-smart.sh

# 3. Access the application
echo "🚀 Application is ready!"
echo "Frontend:   http://localhost:3100"
echo "Backend:    http://localhost:4100"
echo "AI Service: http://localhost:5100"
echo "Grafana:    http://localhost:3003"
echo "Prometheus: http://localhost:9090"
```

### Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with API endpoints

# Start development server
npm run dev
```

#### AI Service Setup (Gemini Integration)

The platform now uses Google Gemini AI for enhanced career coaching capabilities.

#### 1. Get Gemini API Key
```bash
# Visit Google AI Studio: https://makersuite.google.com/app/apikey
# Create a new API key for your project
# Copy the API key for configuration
```

#### 2. Configure Environment Variables
```bash
# Add to your .env file
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_PROJECT_NAME=your_project_name
GEMINI_PROJECT_NUMBER=your_project_number
```

#### 3. AI Service (Legacy - Optional)
```bash
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download ML models
python -m spacy download en_core_web_sm

# Start service (if needed for legacy features)
uvicorn main:app --reload --host 0.0.0.0 --port 5100
```

**Note**: The platform primarily uses Gemini AI directly through the backend service. The Python AI service is optional and provides legacy support.

### Docker Setup

```bash
# Build all services
docker-compose build

# Start development environment
docker-compose up -d

# Start production environment
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Environment Variables

### Backend Environment (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/career_coach
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=career_coach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI Service Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_PROJECT_NAME=your_project_name
GEMINI_PROJECT_NUMBER=your_project_number
AI_SERVICE_URL=http://localhost:5100
AI_SERVICE_TIMEOUT=30000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment (.env)

```bash
# API Configuration
VITE_API_URL=http://localhost:4100/api
VITE_AI_SERVICE_URL=http://localhost:5100

# Application Configuration
VITE_APP_NAME=Career Coach Platform
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true

# Third-party Services
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
VITE_SENTRY_DSN=your_sentry_dsn
```

### AI Service Environment (.env)

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_PROJECT_NAME=your_project_name
GEMINI_PROJECT_NUMBER=your_project_number

# Service Configuration
PYTHONPATH=/app
LOG_LEVEL=INFO
DEBUG=false

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/career_coach
REDIS_URL=redis://localhost:6379

# ML Model Configuration
MODEL_CACHE_DIR=/app/models
DISABLE_SPACY=false
MAX_MODEL_SIZE=1000

# Processing Configuration
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=pdf,docx,txt
PROCESSING_TIMEOUT=300

# External APIs (Legacy)
OPENAI_API_KEY=your_openai_key
HUGGINGFACE_API_KEY=your_hf_key
```

---

## 🔌 API Design

### Authentication Endpoints

```bash
# Register User
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}

# Login User
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

# Response
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Resume Analysis Endpoints

```bash
# Upload Resume
POST /api/resume/upload
Content-Type: multipart/form-data
Authorization: Bearer jwt_token

# File: resume.pdf

# Response
{
  "analysisId": "analysis_id",
  "status": "processing",
  "message": "Resume uploaded successfully"
}

# Get Analysis Results
GET /api/resume/analysis/{analysisId}
Authorization: Bearer jwt_token

# Response
{
  "analysisId": "analysis_id",
  "status": "completed",
  "extractedSkills": ["JavaScript", "React", "Node.js", "Python"],
  "experienceLevel": "mid-level",
  "recommendedRoles": ["Senior Developer", "Tech Lead"],
  "skillGaps": ["Cloud Architecture", "DevOps"],
  "salaryRange": {
    "min": 90000,
    "max": 130000,
    "currency": "USD"
  }
}
```

### AI Career Chat

```bash
# Chat with AI Career Assistant
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer jwt_token

{
  "message": "What skills do I need for a software engineering job?",
  "user_profile": {
    "name": "John Doe",
    "skills": ["JavaScript", "React"],
    "experience": "2 years",
    "target_role": "Software Engineer"
  },
  "conversation_id": "optional_conversation_id"
}

# Response
{
  "success": true,
  "response": "To become a software engineer, you'll need strong programming fundamentals...",
  "conversation_id": "generated_conversation_id",
  "suggestions": [
    "How can I improve my resume?",
    "What are the best career paths for programmers?",
    "How do I prepare for technical interviews?"
  ]
}
```

### Career Recommendations

```bash
# Get Career Recommendations
GET /api/career/recommendations
Authorization: Bearer jwt_token

# Response
{
  "recommendations": [
    {
      "role": "Senior Full Stack Developer",
      "matchScore": 0.85,
      "skillsRequired": ["React", "Node.js", "AWS"],
      "skillsMatched": ["React", "Node.js"],
      "skillsGap": ["AWS"],
      "estimatedSalary": 120000,
      "growthPotential": "high",
      "learningResources": [
        {
          "title": "AWS Certified Developer",
          "type": "certification",
          "provider": "Amazon",
          "duration": "3 months"
        }
      ]
    }
  ]
}
```

### Smart Recommendations (Without Resume)

```bash
# Get AI-powered recommendations without resume
POST /api/ai/recommendations-lite
Content-Type: application/json
Authorization: Bearer jwt_token

{
  "skills": ["JavaScript", "React", "Node.js"],
  "interests": ["Web Development", "Programming"],
  "target_role": "Full Stack Developer",
  "experience_level": "Mid-level"
}

# Response
{
  "success": true,
  "career_paths": [
    {
      "title": "Full Stack Developer",
      "description": "Develop both frontend and backend applications",
      "required_skills": ["JavaScript", "React", "Node.js", "Database"],
      "existing_skills": ["JavaScript", "React", "Node.js"],
      "missing_skills": [],
      "salary_range": "$80,000 - $150,000",
      "growth_potential": "High",
      "industry_demand": "Very High",
      "match_score": 0.9
    }
  ]
}
```

---

## 🗄️ Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        timestamp created_at
        timestamp updated_at
        jsonb profile_data
    }
    
    RESUMES {
        uuid id PK
        uuid user_id FK
        string filename
        string file_path
        string file_type
        jsonb parsed_data
        timestamp created_at
        timestamp updated_at
    }
    
    SKILL_ANALYSES {
        uuid id PK
        uuid user_id FK
        uuid resume_id FK
        jsonb extracted_skills
        jsonb skill_levels
        jsonb recommendations
        timestamp created_at
    }
    
    CAREER_PATHS {
        uuid id PK
        uuid user_id FK
        string target_role
        jsonb required_skills
        jsonb current_skills
        jsonb skill_gaps
        integer priority
        timestamp created_at
        timestamp updated_at
    }
    
    LEARNING_RESOURCES {
        uuid id PK
        string title
        string description
        string type
        string provider
        string url
        integer duration_hours
        jsonb skills_covered
        float rating
        timestamp created_at
    }
    
    USER_GOALS {
        uuid id PK
        uuid user_id FK
        string title
        text description
        string target_date
        string status
        jsonb milestones
        timestamp created_at
        timestamp updated_at
    }
    
    INTERMEDIATE_ANALYSES {
        uuid id PK
        uuid user_id FK
        string analysis_type
        jsonb results
        jsonb metadata
        timestamp created_at
    }
    
    USERS ||--o{ RESUMES : uploads
    USERS ||--o{ SKILL_ANALYSES : receives
    USERS ||--o{ CAREER_PATHS : creates
    USERS ||--o{ USER_GOALS : sets
    RESUMES ||--o{ SKILL_ANALYSES : generates
    CAREER_PATHS ||--o{ LEARNING_RESOURCES : includes
```

### Table Schemas

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_data JSONB DEFAULT '{}'
);
```

#### Resumes Table
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    parsed_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Skill Analyses Table
```sql
CREATE TABLE skill_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    extracted_skills JSONB DEFAULT '{}',
    skill_levels JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤖 AI / Logic Explanation

### AI Service Architecture

```mermaid
graph TD
    subgraph "AI Processing Pipeline"
        A[Resume Input] --> B[Document Parser]
        B --> C[Skill Extractor]
        C --> D[Experience Analyzer]
        D --> E[Recommendation Engine]
        E --> F[Insight Generator]
        F --> G[Results Output]
    end
    
    subgraph "ML Models"
        H[spaCy NLP Model]
        I[Transformer Model]
        J[Skill Classifier]
        K[Career Path Predictor]
    end
    
    subgraph "Data Sources"
        L[Job Market Data]
        M[Skill Taxonomy]
        N[Industry Benchmarks]
        O[Learning Resources]
    end
    
    C --> H
    D --> I
    E --> J
    E --> K
    J --> L
    K --> M
    K --> N
    K --> O
```

### Core AI Components

#### 1. Resume Parsing Engine
```python
class ResumeParser:
    def __init__(self):
        self.nlp_model = spacy.load("en_core_web_sm")
        self.skill_extractor = SkillExtractor()
    
    def parse_resume(self, file_path: str) -> dict:
        # Extract text from PDF/DOCX
        text = self.extract_text(file_path)
        
        # Process with NLP
        doc = self.nlp_model(text)
        
        # Extract entities
        entities = self.extract_entities(doc)
        
        # Extract skills
        skills = self.skill_extractor.extract(text)
        
        # Analyze experience
        experience = self.analyze_experience(doc)
        
        return {
            "entities": entities,
            "skills": skills,
            "experience": experience,
            "raw_text": text
        }
```

#### 2. Recommendation Engine
```python
class RecommendationEngine:
    def __init__(self):
        self.skill_matcher = SkillMatcher()
        self.career_predictor = CareerPathPredictor()
        self.market_analyzer = MarketAnalyzer()
    
    def generate_recommendations(self, user_profile: dict) -> list:
        # Match skills to job requirements
        skill_matches = self.skill_matcher.match(user_profile["skills"])
        
        # Predict career paths
        career_paths = self.career_predictor.predict(user_profile)
        
        # Analyze market trends
        market_insights = self.market_analyzer.analyze(user_profile["skills"])
        
        # Generate recommendations
        recommendations = self.combine_insights(
            skill_matches, career_paths, market_insights
        )
        
        return recommendations
```

#### 3. Skill Gap Analysis
```python
class SkillGapAnalyzer:
    def analyze_gaps(self, current_skills: list, target_role: str) -> dict:
        # Get required skills for target role
        required_skills = self.get_required_skills(target_role)
        
        # Identify missing skills
        missing_skills = set(required_skills) - set(current_skills)
        
        # Assess proficiency levels
        proficiency_gaps = self.assess_proficiency(
            current_skills, required_skills
        )
        
        # Generate learning recommendations
        learning_paths = self.generate_learning_paths(missing_skills)
        
        return {
            "missing_skills": list(missing_skills),
            "proficiency_gaps": proficiency_gaps,
            "learning_paths": learning_paths,
            "completion_time": self.estimate_completion_time(missing_skills)
        }
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant ML as ML Models
    participant DB as Database
    
    U->>F: Upload Resume
    F->>B: POST /api/resume/upload
    B->>AI: Analyze Resume
    AI->>ML: Process Document
    ML->>ML: Extract Skills & Experience
    ML->>DB: Store Analysis
    ML->>AI: Return Results
    AI->>B: Career Recommendations
    B->>DB: Save User Profile
    B->>F: Send Recommendations
    F->>U: Display Results
```

---

## 🎨 UI Preview Section

### Dashboard Interface
![Dashboard](./docs/images/dashboard.png)

### Resume Analysis Results
![Resume Analysis](./docs/images/resume-analysis.png)

### Career Recommendations
![Career Recommendations](./docs/images/career-recommendations.png)

### Learning Path Interface
![Learning Path](./docs/images/learning-path.png)

### Settings & Profile
![Settings](./docs/images/settings.png)

### Mobile Responsive Design
![Mobile](./docs/images/mobile.png)

---

## 🚀 Deployment

### Smart Deployment System

Our platform features an intelligent deployment system that automatically detects the optimal deployment strategy:

#### Auto-Detection Mode (Recommended)
```bash
./devops-smart.sh
```
*Automatically detects:* 
- Minikube status
- Docker image availability  
- Source code changes
- System resources
*Chooses optimal mode:* FAST or FULL

#### Force Fast Mode (< 1 minute)
```bash
./devops-smart.sh --fast
```
*Skips:* Minikube restart, Docker rebuilds
*Perfect for:* Quick iterations, testing

#### Force Full Mode (Complete setup)
```bash
./devops-smart.sh --full
```
*Includes:* Fresh Minikube, parallel builds, full deployment
*Perfect for:* First setup, major changes

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -k k8s/career-coach-prod/

# Check deployment status
kubectl get pods -n career-coach-prod

# Access services
kubectl port-forward svc/frontend-service 3100:80 -n career-coach-prod
kubectl port-forward svc/backend-service 4100:5000 -n career-coach-prod
```

### Docker Deployment

```bash
# Build images
docker build -t career-coach-frontend ./frontend
docker build -t career-coach-backend ./backend
docker build -t career-coach-ai ./ai-service

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options

#### AWS EKS
```bash
# Configure AWS CLI
aws configure

# Create EKS cluster
eksctl create cluster --name career-coach --region us-west-2

# Deploy application
kubectl apply -k k8s/career-coach-prod/
```

#### Google Cloud GKE
```bash
# Configure gcloud
gcloud auth login
gcloud config set project your-project

# Create GKE cluster
gcloud container clusters create career-coach --num-nodes=3

# Deploy application
kubectl apply -k k8s/career-coach-prod/
```

#### Azure AKS
```bash
# Configure Azure CLI
az login

# Create AKS cluster
az aks create --resource-group career-coach-rg --name career-coach --node-count=3

# Deploy application
kubectl apply -k k8s/career-coach-prod/
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm test

# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### AI Service Testing

```bash
cd ai-service

# Run unit tests
python -m pytest tests/unit/

# Run integration tests
python -m pytest tests/integration/

# Run with coverage
python -m pytest --cov=src tests/
```

### End-to-End Testing

```bash
# Run complete E2E test suite
npm run test:e2e:complete

# Run specific test scenarios
npm run test:e2e:resume-upload
npm run test:e2e:career-recommendations
npm run test:e2e:user-journey
```

### Performance Testing

```bash
# Load testing with Artillery
artillery run load-test-config.yml

# Stress testing
npm run test:stress

# Performance benchmarks
npm run test:performance
```

---

## 🗺️ Roadmap

### Version 2.0 (Q2 2026)
- [ ] **Advanced AI Features**
  - [ ] Real-time interview coaching
  - [ ] Video analysis for soft skills
  - [ ] Personalized salary negotiation
- [ ] **Enterprise Features**
  - [ ] Team analytics dashboard
  - [ ] Bulk user management
  - [ ] Custom skill taxonomies
- [ ] **Integrations**
  - [ ] LinkedIn API integration
  - [ ] ATS (Applicant Tracking System) integration
  - [ ] Slack/Teams notifications

### Version 2.1 (Q3 2026)
- [ ] **Mobile Applications**
  - [ ] iOS native app
  - [ ] Android native app
  - [ ] Progressive Web App (PWA)
- [ ] **Enhanced Analytics**
  - [ ] Predictive career analytics
  - [ ] Market trend analysis
  - [ ] Competency benchmarking
- [ ] **Collaboration Features**
  - [ ] Peer mentoring
  - [ ] Group coaching sessions
  - [ ] Community forums

### Version 3.0 (Q4 2026)
- [ ] **AI-Powered Automation**
  - [ ] Automated resume optimization
  - [ ] Smart job matching
  - [ ] Personalized learning schedules
- [ ] **Global Expansion**
  - [ ] Multi-language support
  - [ ] Regional career insights
  - [ ] Local job market data
- [ ] **Advanced Security**
  - [ ] Zero-knowledge encryption
  - [ ] GDPR compliance
  - [ ] SOC 2 certification

---

## 🔧 Troubleshooting

### Common Issues

#### AI Chat Not Working
**Problem**: AI chat returns errors or no response
**Solution**: 
1. Check your Gemini API key configuration
2. Ensure the API key is valid and active
3. Verify the project name and number are correct
4. Check network connectivity to Google's API

```bash
# Test Gemini API connection
curl -H "Content-Type: application/json" \
-d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY"
```

#### Database Connection Issues
**Problem**: Backend fails to start due to database errors
**Solution**:
1. Ensure PostgreSQL is running
2. Check database credentials in .env
3. Create the database if it doesn't exist
4. The AI features work even without database (for testing)

#### Environment Variables Not Loading
**Problem**: Configuration not being applied
**Solution**:
1. Copy `.env.example` to `.env`
2. Ensure no trailing spaces in values
3. Restart the application after changes

### Known Issues

- **API Key Security**: Never commit API keys to version control
- **Database Dependencies**: Some features work without database for development
- **Authentication**: Temporarily disabled for AI testing (re-enable in production)

### Getting Help

1. **Check Logs**: Review application logs for detailed error messages
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test API Keys**: Validate API keys work independently
4. **Community Support**: Open an issue on GitHub for help

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/career-coach-platform.git
   cd career-coach-platform
   ```

2. **Set up your development environment**
   ```bash
   ./devops-smart.sh --fast
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Guidelines

#### Code Standards
- **TypeScript**: Use strict mode and proper typing
- **Python**: Follow PEP 8 guidelines
- **React**: Use functional components and hooks
- **Testing**: Maintain >80% code coverage

#### Commit Guidelines
- Use conventional commit messages
- Follow the format: `type(scope): description`
- Examples:
  - `feat(ai): add resume parsing enhancement`
  - `fix(frontend): resolve login issue`
  - `docs(readme): update installation guide`

#### Pull Request Process
1. **Update tests** for your changes
2. **Ensure all tests pass** (`npm test`)
3. **Update documentation** if needed
4. **Submit a pull request** with:
  - Clear description of changes
  - Screenshots for UI changes
  - Testing instructions

### Areas for Contribution

#### 🤖 AI/ML Improvements
- [ ] Enhance resume parsing accuracy
- [ ] Improve recommendation algorithms
- [ ] Add new skill taxonomies
- [ ] Implement sentiment analysis

#### 🎨 Frontend Enhancements
- [ ] Improve accessibility (WCAG 2.1)
- [ ] Add dark mode support
- [ ] Enhance mobile responsiveness
- [ ] Implement progressive web app features

#### 🔧 Backend Optimizations
- [ ] Improve API performance
- [ ] Add caching strategies
- [ ] Enhance security measures
- [ ] Implement rate limiting

#### 📚 Documentation
- [ ] Improve API documentation
- [ ] Add more examples
- [ ] Create video tutorials
- [ ] Translate to other languages

### Reporting Issues

When reporting bugs, please include:
- **Environment details** (OS, browser, version)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Error logs** from browser console

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

✅ **What you can do:**
- Use this software for commercial purposes
- Modify and distribute
- Use in private projects
- Sublicense

❌ **What you cannot do:**
- Claim ownership
- Hold authors liable

📖 **Full License Text:**
```
MIT License

Copyright (c) 2026 Career Coach Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Core Contributors
- **[Your Name]** - Lead Developer & Architect
- **[Contributor Names]** - AI/ML Engineering
- **[Contributor Names]** - Frontend Development
- **[Contributor Names]** - DevOps & Infrastructure

### Special Thanks
- **Open Source Community** - For the amazing tools and libraries
- **Career Coaches** - For domain expertise and feedback
- **Beta Testers** - For valuable feedback and bug reports
- **Mentors** - For guidance and support

### Technologies & Libraries
- **React Team** - Excellent frontend framework
- **Node.js Community** - Robust backend ecosystem
- **Python ML Community** - Powerful AI/ML tools
- **Kubernetes Team** - Container orchestration platform
- **OpenAI** - Advanced language models

---

## 📞 Support & Community

### Getting Help
- **📧 Email**: support@careercoach-platform.com
- **💬 Discord**: [Join our community](https://discord.gg/career-coach)
- **🐛 Issues**: [Report bugs on GitHub](https://github.com/bayarmaa01/career-coach-platform/issues)
- **💡 Discussions**: [Feature requests and ideas](https://github.com/bayarmaa01/career-coach-platform/discussions)

### Resources
- **📚 Documentation**: [docs.careercoach-platform.com](https://docs.careercoach-platform.com)
- **🎓 Tutorials**: [tutorials.careercoach-platform.com](https://tutorials.careercoach-platform.com)
- **📊 Blog**: [blog.careercoach-platform.com](https://blog.careercoach-platform.com)
- **🐦 Twitter**: [@CareerCoachAI](https://twitter.com/CareerCoachAI)

---

## 🎉 One More Thing...

> **"The best time to plant a tree was 20 years ago. The second best time is now."** - Chinese Proverb

Your career journey starts today. Let **Career Coach Platform** be your intelligent companion in achieving professional success.

**Ready to transform your career?** 🚀

[![Get Started](https://img.shields.io/badge/Get%20Started-🚀-brightgreen.svg)](./docs/getting-started.md)
[![View Demo](https://img.shields.io/badge/View%20Demo-👀-blue.svg)](https://demo.careercoach-platform.com)
[![Join Community](https://img.shields.io/badge/Join%20Community-💬-purple.svg)](https://discord.gg/career-coach)

---

> **Note**: This project demonstrates enterprise-level DevOps practices including GitOps automation, comprehensive monitoring, and intelligent deployment strategies. Perfect for showcasing modern cloud-native development expertise.

**⭐ Star this repository** if it helped you in your career journey!

---

*Last updated: April 2026*
