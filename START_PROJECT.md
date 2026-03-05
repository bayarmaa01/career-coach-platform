# 🚀 AI Career Coach Platform - Quick Start Guide

This guide will help you get the AI Career Coach Platform running locally and deploy it to Kubernetes.

## 📋 Prerequisites

Make sure you have the following installed:

- **Docker** & **Docker Compose**
- **Node.js** 18+ (for local development)
- **Python** 3.11+ (for local development)
- **kubectl** (for Kubernetes deployment)
- **Terraform** (for infrastructure setup)

## 🏃‍♂️ Option 1: Quick Local Start (Docker Compose)

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/career-coach-platform.git
cd career-coach-platform
```

### Step 2: Start All Services
```bash
# Start all services in the background
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### Step 3: Access the Application
Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api/health
- **AI Service**: http://localhost:8000/docs
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Step 4: Test the Application
1. **Register a new user** at http://localhost:3000/register
2. **Login** with your credentials
3. **Upload a resume** (PDF, DOC, DOCX, or TXT)
4. **View career recommendations** and skill analysis

## 🛠️ Option 2: Local Development Setup

### Step 1: Install Dependencies

#### Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

#### Backend (Node.js + Express)
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

#### AI Service (Python + FastAPI)
```bash
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# AI Service runs on http://localhost:8000
```

### Step 2: Setup Databases
```bash
# Start PostgreSQL and Redis using Docker
docker-compose up postgres redis -d
```

### Step 3: Environment Configuration
Copy the example environment files and update them:

```bash
# Backend
cp backend/.env.example backend/.env

# AI Service
cp ai-service/.env.example ai-service/.env
```

## ☸️ Option 3: Kubernetes Deployment

### Step 1: Setup Infrastructure with Terraform
```bash
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply

# Configure kubectl
terraform output configure_kubectl | bash
```

### Step 2: Deploy to Kubernetes
```bash
# Deploy all services
kubectl apply -k k8s/

# Check deployment status
kubectl get pods -n career-coach
kubectl get services -n career-coach

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n career-coach --timeout=300s
kubectl wait --for=condition=ready pod -l app=backend -n career-coach --timeout=300s
kubectl wait --for=condition=ready pod -l app=ai-service -n career-coach --timeout=300s
```

### Step 3: Access the Application
```bash
# Port forward for local access
kubectl port-forward service/frontend 3000:80 -n career-coach &
kubectl port-forward service/backend 5000:5000 -n career-coach &
kubectl port-forward service/ai-service 8000:8000 -n career-coach &
```

## 🔧 Development Commands

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run linting
```

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run linting
```

### AI Service Commands
```bash
cd ai-service
uvicorn main:app --reload --host 0.0.0.0 --port 8000  # Start development server
pytest --cov=app tests/                           # Run tests
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Docker Port Conflicts
If ports are already in use:
```bash
# Stop existing containers
docker-compose down

# Or use different ports
docker-compose up -d --scale frontend=1
```

#### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up postgres -d
```

#### 3. Frontend Build Issues
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### 4. AI Service Model Issues
```bash
# Download required spaCy model
python -m spacy download en_core_web_sm

# Verify installation
python -c "import spacy; print(spacy.__version__)"
```

#### 5. Kubernetes Pod Issues
```bash
# Check pod status
kubectl get pods -n career-coach

# Describe problematic pod
kubectl describe pod <pod-name> -n career-coach

# View pod logs
kubectl logs <pod-name> -n career-coach

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n career-coach
```

### Health Checks

Verify all services are running:

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:5000/api/health

# AI Service
curl http://localhost:8000/health

# Database
docker-compose exec postgres pg_isready -U postgres -d career_coach
```

## 📊 Monitoring Setup

### Access Monitoring Dashboards

1. **Grafana**: http://localhost:3001
   - Username: `admin`
   - Password: `admin`

2. **Prometheus**: http://localhost:9090

### Key Metrics to Monitor

- **Response Time**: API performance
- **Error Rate**: Application errors
- **Active Users**: User engagement
- **Resume Processing**: AI service performance
- **Resource Usage**: CPU, Memory, Storage

## 🧪 Running Tests

### Run All Tests
```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && npm run test

# AI Service tests
cd ai-service && pytest
```

### Test Coverage
```bash
# Frontend coverage
cd frontend && npm run test:coverage

# Backend coverage
cd backend && npm run test:coverage

# AI Service coverage
cd ai-service && pytest --cov=app --cov-report=html
```

## 🚀 Production Deployment

### Build and Push Images
```bash
# Build all images
docker-compose build

# Tag for production
docker tag career-coach-frontend:latest your-registry.com/career-coach-frontend:latest
docker tag career-coach-backend:latest your-registry.com/career-coach-backend:latest
docker tag career-coach-ai-service:latest your-registry.com/career-coach-ai-service:latest

# Push to registry
docker push your-registry.com/career-coach-frontend:latest
docker push your-registry.com/career-coach-backend:latest
docker push your-registry.com/career-coach-ai-service:latest
```

### Deploy to Production Kubernetes
```bash
# Update image tags in k8s/ manifests
kubectl set image deployment/frontend frontend=your-registry.com/career-coach-frontend:latest -n career-coach
kubectl set image deployment/backend backend=your-registry.com/career-coach-backend:latest -n career-coach
kubectl set image deployment/ai-service ai-service=your-registry.com/career-coach-ai-service:latest -n career-coach

# Rollout updates
kubectl rollout status deployment/frontend -n career-coach
kubectl rollout status deployment/backend -n career-coach
kubectl rollout status deployment/ai-service -n career-coach
```

## 📚 Next Steps

1. **Explore the Features**: Upload different resume formats and test AI analysis
2. **Review the Code**: Understand the architecture and implementation
3. **Customize the AI**: Modify skill extraction and recommendation algorithms
4. **Scale the Application**: Add more nodes and configure auto-scaling
5. **Integrate External Services**: Connect to job boards and learning platforms

## 🤝 Need Help?

- **Documentation**: Check the main [README.md](README.md)
- **Issues**: Create an issue on GitHub
- **Community**: Join our Discord server
- **Email**: support@career-coach.com

---

🎉 **Congratulations!** Your AI Career Coach Platform is now running!

For production deployment, ensure you:
- Update all default passwords and secrets
- Configure proper SSL certificates
- Set up monitoring and alerting
- Implement backup strategies
- Review security configurations

Happy coding! 🚀
