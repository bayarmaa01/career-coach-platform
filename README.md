# AI Career Coach Platform

A cloud-native AI-powered career coaching platform that analyzes resumes and provides personalized career recommendations, skill gap analysis, and learning suggestions.

## 🚀 Features

- **Resume Analysis**: AI-powered parsing and skill extraction from PDF/DOC/TXT files
- **Career Recommendations**: Personalized career path suggestions based on skills and experience
- **Skill Gap Analysis**: Identify areas for improvement with prioritized learning paths
- **Course Recommendations**: Curated learning resources to bridge skill gaps
- **User Management**: Secure authentication and role-based access control
- **Admin Dashboard**: Comprehensive monitoring and user management
- **Real-time Processing**: Asynchronous resume analysis with progress tracking

## 🏗️ Architecture

### Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   AI Service    │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (Python)       │
│   Port: 3000   │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Port: 5432   │
                    └─────────────────┘
```

### Technology Stack

**Frontend**
- React.js 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Redux Toolkit for state management
- React Router for navigation

**Backend**
- Node.js with Express.js
- TypeScript for type safety
- PostgreSQL for data persistence
- Redis for caching
- JWT for authentication
- Multer for file uploads

**AI Service**
- Python with FastAPI
- SpaCy for NLP processing
- Sentence Transformers for embeddings
- Scikit-learn for ML algorithms
- PDFPlumber for document parsing

**Infrastructure**
- Docker for containerization
- Kubernetes for orchestration
- Terraform for IaC
- Ansible for configuration management
- Prometheus + Grafana for monitoring
- GitHub Actions for CI/CD

## 📋 Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- kubectl (for Kubernetes deployment)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended for local development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/career-coach-platform.git
   cd career-coach-platform
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - AI Service: http://localhost:8000
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd ../backend && npm install
   
   # AI Service
   cd ../ai-service && pip install -r requirements.txt
   ```

2. **Setup databases**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up postgres redis -d
   ```

3. **Run services**
   ```bash
   # Backend (Terminal 1)
   cd backend && npm run dev
   
   # AI Service (Terminal 2)
   cd ai-service && uvicorn main:app --reload --host 0.0.0.0 --port 8000
   
   # Frontend (Terminal 3)
   cd frontend && npm run dev
   ```

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and deploy all services
docker-compose -f docker-compose.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Development Deployment

```bash
# Use development configuration
docker-compose -f docker-compose.dev.yml up -d
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.28+)
- kubectl configured
- Container registry access

### Deployment Steps

1. **Apply Kubernetes manifests**
   ```bash
   kubectl apply -k k8s/
   ```

2. **Check deployment status**
   ```bash
   kubectl get pods -n career-coach
   kubectl get services -n career-coach
   ```

3. **Port forward for local testing**
   ```bash
   kubectl port-forward service/frontend 3000:80 -n career-coach
   ```

### Using Terraform

1. **Initialize Terraform**
   ```bash
   cd terraform
   terraform init
   ```

2. **Plan and apply**
   ```bash
   terraform plan
   terraform apply
   ```

3. **Configure kubectl**
   ```bash
   terraform output configure_kubectl | bash
   ```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

**Backend (.env)**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=career_coach
DB_USER=postgres
DB_PASSWORD=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
AI_SERVICE_URL=http://localhost:8000
```

**AI Service (.env)**
```env
ENVIRONMENT=production
REDIS_URL=redis://localhost:6379
SPACY_MODEL=en_core_web_sm
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
```

## 📊 Monitoring

### Prometheus Metrics

Access metrics at http://localhost:9090/metrics

Key metrics:
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request latency
- `resume_processing_duration_seconds`: Resume analysis time
- `career_coach_active_users_total`: Active user count

### Grafana Dashboards

Access Grafana at http://localhost:3001

Pre-configured dashboards:
- Application Performance
- Infrastructure Metrics
- Business KPIs

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm run test
npm run test:coverage
```

### AI Service Tests
```bash
cd ai-service
pytest --cov=app tests/
```

## 🔄 CI/CD Pipeline

The platform uses GitHub Actions for automated CI/CD:

### Pipeline Stages

1. **Code Quality**
   - ESLint/Prettier checks
   - SonarQube analysis
   - CodeQL security scanning

2. **Testing**
   - Unit tests
   - Integration tests
   - Coverage reporting

3. **Security Scanning**
   - Trivy vulnerability scanning
   - Dependency checks

4. **Build & Deploy**
   - Docker image building
   - Container registry push
   - Kubernetes deployment
   - Smoke tests

### Environments

- **Staging**: Deployed on every push to `develop` branch
- **Production**: Deployed on every push to `main` branch

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Resume Endpoints

- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes` - Get user resumes
- `DELETE /api/resumes/:id` - Delete resume
- `POST /api/resumes/:id/analyze` - Analyze resume

### Career Endpoints

- `GET /api/career/recommendations/:resumeId` - Get career recommendations
- `GET /api/career/skill-gap/:resumeId` - Get skill gap analysis
- `GET /api/career/courses/:resumeId` - Get course recommendations

## 🔒 Security

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Session management

### Security Best Practices

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- HTTPS enforcement
- Security headers (Helmet.js)

### OWASP Top 10

The platform addresses all OWASP Top 10 security risks:
1. **Broken Access Control** → RBAC implementation
2. **Cryptographic Failures** → Strong encryption practices
3. **Injection** → Parameterized queries
4. **Insecure Design** → Security by design
5. **Security Misconfiguration** → Secure defaults
6. **Vulnerable Components** → Dependency scanning
7. **Authentication Failures** → Strong auth mechanisms
8. **Software/Data Integrity** → CI/CD integrity checks
9. **Logging & Monitoring** → Comprehensive monitoring
10. **SSRF** → Request validation

## 🚀 Performance

### Optimization Strategies

- **Frontend**: Code splitting, lazy loading, caching
- **Backend**: Connection pooling, caching, query optimization
- **AI Service**: Async processing, model optimization
- **Database**: Indexing, query optimization
- **Infrastructure**: Auto-scaling, load balancing

### Monitoring

- Response time tracking
- Error rate monitoring
- Resource utilization
- User behavior analytics

## 🛠️ Development Guide

### Code Structure

```
career-coach-platform/
├── frontend/          # React frontend application
├── backend/           # Node.js API server
├── ai-service/        # Python AI processing service
├── k8s/              # Kubernetes manifests
├── terraform/         # Infrastructure as code
├── ansible/           # Configuration management
├── monitoring/        # Monitoring configuration
└── .github/workflows/ # CI/CD pipelines
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Coding Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Maintain test coverage > 80%

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:

- Create an issue on GitHub
- Check the [Wiki](https://github.com/your-org/career-coach-platform/wiki)
- Join our [Discord community](https://discord.gg/career-coach)

## 🗺 Roadmap

### Version 2.0
- [ ] Real-time collaboration features
- [ ] Advanced AI recommendations
- [ ] Mobile application
- [ ] Integration with job boards
- [ ] Video interview preparation

### Version 1.5
- [ ] Enhanced analytics dashboard
- [ ] Custom career path builder
- [ ] Integration with LinkedIn
- [ ] Advanced skill assessment

---

**Built with ❤️ by the AI Career Coach Team**
