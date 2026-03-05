# 🛠️ AI Career Coach Platform - Command Reference

## 📋 Quick Commands

### Start Everything (Docker Compose)
```bash
# Production mode
docker-compose up -d

# Development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Local Development
```bash
# Start all services locally
cd frontend && npm run dev &
cd backend && npm run dev &
cd ai-service && uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
```

## 🏗️ Build Commands

### Frontend (React)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Backend (Node.js)
```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### AI Service (Python)
```bash
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start production server
uvicorn main:app --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run security scan
bandit -r app/

# Run linting
flake8 app/
```

## 🐳 Docker Commands

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend
docker-compose build backend
docker-compose build ai-service

# Build without cache
docker-compose build --no-cache
```

### Container Management
```bash
# List running containers
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh
docker-compose exec ai-service bash

# Restart specific service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3 --scale ai-service=2
```

### Image Management
```bash
# List images
docker images | grep career-coach

# Remove unused images
docker image prune

# Tag images for registry
docker tag career-coach-frontend:latest your-registry.com/career-coach-frontend:latest
```

## ☸️ Kubernetes Commands

### Cluster Management
```bash
# Get cluster info
kubectl cluster-info

# Get nodes
kubectl get nodes

# Get all resources
kubectl get all -n career-coach

# Get pods with wide output
kubectl get pods -n career-coach -o wide

# Describe pod
kubectl describe pod <pod-name> -n career-coach

# Get pod logs
kubectl logs <pod-name> -n career-coach

# Execute command in pod
kubectl exec -it <pod-name> -n career-coach -- bash
```

### Application Deployment
```bash
# Apply all manifests
kubectl apply -k k8s/

# Apply specific manifest
kubectl apply -f k8s/frontend-deployment.yaml

# Delete resource
kubectl delete deployment frontend -n career-coach

# Get services
kubectl get services -n career-coach

# Port forward
kubectl port-forward service/frontend 3000:80 -n career-coach

# Scale deployment
kubectl scale deployment backend --replicas=5 -n career-coach
```

### Rollouts
```bash
# Check rollout status
kubectl rollout status deployment/frontend -n career-coach

# Restart deployment
kubectl rollout restart deployment/backend -n career-coach

# Rollback to previous version
kubectl rollout undo deployment/frontend -n career-coach

# View rollout history
kubectl rollout history deployment/frontend -n career-coach
```

## 🏗️ Terraform Commands

### Infrastructure Management
```bash
cd terraform

# Initialize Terraform
terraform init

# Format configuration
terraform fmt

# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply changes
terraform apply

# Apply with auto-approval
terraform apply -auto-approve

# Destroy infrastructure
terraform destroy

# Import existing resources
terraform import aws_instance.example i-1234567890abcdef0
```

### State Management
```bash
# Show current state
terraform show

# List resources in state
terraform state list

# Remove resource from state
terraform state rm aws_instance.example

# Refresh state
terraform refresh

# Create state backup
terraform state pull > backup.tfstate

# Restore state
terraform state push backup.tfstate
```

## 🔧 Ansible Commands

### Configuration Management
```bash
cd ansible

# Check playbook syntax
ansible-playbook --syntax-check playbook.yml

# Run playbook
ansible-playbook playbook.yml

# Run with specific inventory
ansible-playbook -i inventory.ini playbook.yml

# Run with extra variables
ansible-playbook -e "env=production" playbook.yml

# Dry run (check mode)
ansible-playbook --check playbook.yml

# Run with verbose output
ansible-playbook -v playbook.yml
```

### Inventory Management
```bash
# List inventory
ansible-inventory -i inventory.ini --list

# Test connectivity
ansible all -i inventory.ini -m ping

# Gather facts
ansible all -i inventory.ini -m setup

# Run specific module
ansible web -i inventory.ini -m command -a "uptime"
```

## 📊 Monitoring Commands

### Prometheus
```bash
# Access Prometheus UI
curl http://localhost:9090

# Query metrics
curl "http://localhost:9090/api/v1/query?query=up"

# Check targets
curl "http://localhost:9090/api/v1/targets"

# Reload configuration
curl -X POST http://localhost:9090/-/reload
```

### Grafana
```bash
# Access Grafana UI
curl http://localhost:3001

# Import dashboard via API
curl -X POST \
  -H "Content-Type: application/json" \
  -d @dashboard.json \
  http://admin:admin@localhost:3001/api/dashboards/db

# Get datasources
curl http://admin:admin@localhost:3001/api/datasources
```

## 🧪 Testing Commands

### Frontend Testing
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Login.test.tsx

# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run API tests
npm run test:api
```

### AI Service Testing
```bash
cd ai-service

# Run all tests
pytest

# Run specific test file
pytest tests/test_resume_processor.py

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run tests with verbose output
pytest -v

# Run specific test markers
pytest -m "unit"
pytest -m "integration"

# Generate coverage report
pytest --cov=app --cov-report=xml
```

## 🔍 Debugging Commands

### Frontend Debug
```bash
cd frontend

# Start with Chrome DevTools
npm run dev -- --inspect

# Start with VS Code debug
npm run dev:debug

# Build with source maps
npm run build -- --sourcemap
```

### Backend Debug
```bash
cd backend

# Start with Node.js inspector
npm run dev -- --inspect

# Start with VS Code debug
npm run dev:debug

# Debug tests
npm run test -- --inspect-brk
```

### AI Service Debug
```bash
cd ai-service

# Start with Python debugger
python -m debugpy --listen 5678 --wait-for-client main.py

# Debug with VS Code
python -m debugpy --listen 5678 main.py
```

## 📝 Log Management

### View Logs
```bash
# Docker Compose logs
docker-compose logs -f [service-name]

# Kubernetes logs
kubectl logs -f deployment/backend -n career-coach

# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log
```

### Log Rotation
```bash
# Test logrotate configuration
logrotate -d /etc/logrotate.d/career-coach

# Force log rotation
logrotate -f /etc/logrotate.d/career-coach
```

## 🔒 Security Commands

### Security Scanning
```bash
# Frontend security audit
cd frontend && npm audit

# Backend security audit
cd backend && npm audit

# AI Service security scan
cd ai-service && bandit -r app/

# Docker image security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/root/.cache/ aquasec/trivy:latest image career-coach-backend:latest

# Kubernetes security scan
kubectl get pods -n career-coach -o json | kubectl auth can-i --list --as=system:serviceaccount:default --namespace=career-coach
```

### SSL/TLS Management
```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt

# Create Kubernetes secret
kubectl create secret tls career-coach-tls \
  --cert=tls.crt --key=tls.key -n career-coach
```

## 📈 Performance Commands

### Load Testing
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test frontend
ab -n 1000 -c 10 http://localhost:3000/

# Test API
ab -n 1000 -c 10 http://localhost:5000/api/health

# Install k6 for advanced testing
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xz
sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin/

# Run k6 load test
k6 run --vus 10 --duration 30s load-test.js
```

### Performance Monitoring
```bash
# Check resource usage
docker stats

# Kubernetes resource usage
kubectl top pods -n career-coach
kubectl top nodes

# System performance
htop
iostat -x 1
```

## 🔄 Backup Commands

### Database Backup
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres career_coach > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres career_coach < backup.sql

# Automated backup
docker-compose exec postgres pg_dump -U postgres career_coach | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### File Backup
```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env* k8s/ terraform/

# Restore uploads
tar -xzf uploads_backup_YYYYMMDD.tar.gz
```

## 🧹 Cleanup Commands

### Development Cleanup
```bash
# Clean frontend
cd frontend && rm -rf node_modules dist

# Clean backend
cd backend && rm -rf node_modules dist

# Clean AI service
cd ai-service && find . -type d -name __pycache__ -exec rm -rf {} +
```

### Docker Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a
```

### Kubernetes Cleanup
```bash
# Delete namespace and all resources
kubectl delete namespace career-coach

# Clean up specific resources
kubectl delete all --all -n career-coach

# Force delete stuck pods
kubectl delete pod <pod-name> -n career-coach --force --grace-period=0
```

---

💡 **Pro Tip**: Create shell aliases for frequently used commands:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ccd='cd career-coach-platform'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias kc='kubectl -n career-coach'
alias tf='cd ~/career-coach-platform/terraform'
```

🚀 Happy coding and deploying!
