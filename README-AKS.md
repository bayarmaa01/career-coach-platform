# AI Career Coach Platform - Azure AKS Deployment

## 🚀 Quick Start

### Prerequisites
- Azure CLI installed and configured
- kubectl installed
- Docker Hub account with images

### Deployment Commands

```bash
# 1. Clone repository
git clone https://github.com/bayarmaa01/career-coach-platform.git
cd career-coach-platform

# 2. Connect to AKS
az aks get-credentials --resource-group myRG --name myAKS

# 3. Deploy using script
chmod +x deploy.sh
./deploy.sh

# 4. Verify deployment
kubectl get pods -n career-coach-prod
kubectl get ingress -n career-coach-prod
```

## 🌐 Access Points

After deployment, access the application at:

- **Frontend**: `http://ai-coach.duckdns.org`
- **Backend API**: `http://ai-coach.duckdns.org/api`
- **AI Service**: `http://ai-coach.duckdns.org/ai`

## 📊 Deployment Architecture

### Kubernetes Resources
- **Namespace**: `career-coach-prod`
- **Ingress Controller**: NGINX
- **Database**: PostgreSQL (StatefulSet)
- **Cache**: Redis
- **Services**: Frontend, Backend, AI Service

### Images Used
- **Frontend**: `bayarmaa/career-coach-platform:frontend-latest`
- **Backend**: `bayarmaa/career-coach-platform:backend-latest`
- **AI Service**: `bayarmaa/career-coach-platform:ai-service-latest`

## 🔧 Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n career-coach-prod
kubectl describe pod <pod-name> -n career-coach-prod
```

### Check Logs
```bash
kubectl logs -n career-coach-prod deployment/frontend-prod
kubectl logs -n career-coach-prod deployment/backend-prod
kubectl logs -n career-coach-prod deployment/ai-service-prod
```

### Check Ingress
```bash
kubectl get ingress -n career-coach-prod
kubectl describe ingress career-coach-ingress-prod -n career-coach-prod
```

### Check Services
```bash
kubectl get svc -n career-coach-prod
kubectl get svc -n ingress-nginx
```

## 📋 Manual Deployment Steps

If the deployment script fails, apply resources manually:

```bash
# 1. Namespaces
kubectl apply -f k8s/namespace-prod.yaml

# 2. Secrets
kubectl apply -f k8s/secrets-prod.yaml

# 3. Storage
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# 4. Database
kubectl apply -f k8s/redis-deployment-prod.yaml
kubectl apply -f k8s/redis-service.yaml

# 5. Application
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ai-service-service.yaml
kubectl apply -f k8s/frontend-deployment-prod.yaml
kubectl apply -f k8s/backend-deployment-prod.yaml
kubectl apply -f k8s/ai-service-deployment-prod.yaml

# 6. Ingress
kubectl apply -f k8s/ingress-prod.yaml
```

## 🎯 Production Configuration

### Environment Variables
- **Database**: PostgreSQL with persistent storage
- **Cache**: Redis for session management
- **Security**: JWT tokens and CORS configuration
- **Monitoring**: NGINX ingress with SSL termination

### Persistent Storage
- **PostgreSQL**: 10Gi persistent volume
- **Redis**: 1Gi persistent volume
- **Uploads**: 5Gi persistent volume
- **Models**: 2Gi persistent volume

## 🔐 Security

### Secrets
- Database credentials stored in Kubernetes secrets
- JWT secret for authentication
- Redis password for cache security
- Docker registry credentials

### Network
- NGINX ingress controller with SSL
- CORS configuration for frontend
- Internal service communication

## 📈 Monitoring

### Health Checks
- Liveness and readiness probes configured
- Health endpoints available
- Automatic restarts on failure

### Logs
- Structured logging with timestamps
- Log aggregation ready
- Error tracking enabled

## 🚀 CI/CD Integration

### GitHub Actions
- Automated Docker builds
- Multi-platform image support
- Helm chart updates
- GitOps deployment ready

### Docker Images
- Built from source code
- Optimized for production
- Security scanned
- Version tagged

## 📞 Support

For deployment issues:
1. Check pod logs: `kubectl logs -n career-coach-prod <pod-name>`
2. Verify ingress: `kubectl get ingress -n career-coach-prod`
3. Check services: `kubectl get svc -n career-coach-prod`
4. Review secrets: `kubectl get secrets -n career-coach-prod`

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: 2025-03-20
**Version**: 1.0.0
