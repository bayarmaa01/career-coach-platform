# 🚀 Career Coach Platform - Complete Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Azure AKS Setup](#azure-aks-setup)
- [Application Deployment](#application-deployment)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Production Configuration](#production-configuration)

## 🔧 Prerequisites

### Required Tools
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install kubectl
az aks install-cli

# Verify installation
az --version
kubectl version --client
```

### Docker Hub Setup
1. Create Docker Hub account
2. Create repository: `career-coach-platform`
3. Generate Personal Access Token
4. Set GitHub secrets:
   - `DOCKER_USERNAME`: `bayarmaa`
   - `DOCKER_PASSWORD`: Your Docker Hub token

## ☁️ Azure AKS Setup

### Create Resource Group
```bash
az group create --name myRG --location southeastasia
```

### Create AKS Cluster
```bash
az aks create \
  --resource-group myRG \
  --name myAKS \
  --node-count 1 \
  --node-vm-size Standard_B2s_v2 \
  --generate-ssh-keys
```

### Get Credentials
```bash
az aks get-credentials --resource-group myRG --name myAKS
```

### Verify Cluster
```bash
kubectl get nodes
kubectl cluster-info
```

### Install Ingress Controller
```bash
# Install NGINX ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Verify installation
kubectl get svc -n ingress-nginx
```

## 🚀 Application Deployment

### Clone Repository
```bash
git clone https://github.com/bayarmaa01/career-coach-platform.git
cd career-coach-platform
git pull origin main
```

### Option 1: Automated Deployment
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# 1. Create namespaces
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/namespace-prod.yaml

# 2. Apply secrets
kubectl apply -f k8s/secrets-prod.yaml

# 3. Setup storage
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# 4. Deploy databases
kubectl apply -f k8s/redis-deployment-prod.yaml
kubectl apply -f k8s/redis-service.yaml

# 5. Deploy application
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ai-service-service.yaml
kubectl apply -f k8s/frontend-deployment-prod.yaml
kubectl apply -f k8s/backend-deployment-prod.yaml
kubectl apply -f k8s/ai-service-deployment-prod.yaml

# 6. Setup ingress
kubectl apply -f k8s/ingress-prod.yaml
```

## ✅ Verification

### Check Deployment Status
```bash
# Check all pods
kubectl get pods -n career-coach-prod

# Check services
kubectl get svc -n career-coach-prod

# Check ingress
kubectl get ingress -n career-coach-prod

# Get external IP
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

### Monitor Progress
```bash
# Watch pod status
kubectl get pods -n career-coach-prod -w

# Check individual services
kubectl logs -n career-coach-prod deployment/frontend-prod
kubectl logs -n career-coach-prod deployment/backend-prod
kubectl logs -n career-coach-prod deployment/ai-service-prod
```

### Access Application
Once deployment is complete, access at:
- **Frontend**: `http://ai-coach.duckdns.org`
- **Backend API**: `http://ai-coach.duckdns.org/api`
- **AI Service**: `http://ai-coach.duckdns.org/ai`

## 🔧 Troubleshooting

### Common Issues

#### Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n career-coach-prod

# Check logs
kubectl logs <pod-name> -n career-coach-prod

# Check events
kubectl get events -n career-coach-prod --sort-by=.metadata.creationTimestamp
```

#### Ingress Not Working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress configuration
kubectl describe ingress career-coach-ingress-prod -n career-coach-prod

# Check service endpoints
kubectl get endpoints -n career-coach-prod
```

#### Database Connection Issues
```bash
# Check PostgreSQL
kubectl logs -n career-coach-prod statefulset/postgres

# Check Redis
kubectl logs -n career-coach-prod deployment/redis-prod

# Check secrets
kubectl get secrets -n career-coach-prod
```

### Reset Deployment
```bash
# Delete all resources
kubectl delete namespace career-coach-prod
kubectl delete namespace career-coach

# Redeploy
./deploy.sh
```

## 🏗️ Production Configuration

### Resource Limits
- **Frontend**: 200m CPU, 256Mi memory
- **Backend**: 500m CPU, 512Mi memory  
- **AI Service**: 300m CPU, 512Mi memory
- **PostgreSQL**: 500m CPU, 1Gi memory
- **Redis**: 200m CPU, 256Mi memory

### Storage Configuration
- **PostgreSQL**: 10Gi persistent volume
- **Redis**: 1Gi persistent volume
- **Uploads**: 5Gi persistent volume
- **Models**: 2Gi persistent volume

### Security Configuration
- **TLS**: Enabled with Let's Encrypt
- **CORS**: Configured for production domain
- **Secrets**: Base64 encoded in Kubernetes
- **Network**: Internal service communication

### Monitoring Setup
```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n career-coach-prod

# Check health endpoints
curl http://ai-coach.duckdns.org/api/health
curl http://ai-coach.duckdns.org/ai/health
```

## 📊 Architecture Overview

```
Internet
    ↓
[Nginx Ingress Controller]
    ↓
[Ingress Rules]
    ↓
┌─────────────────────────────────────┐
│  career-coach-prod Namespace        │
├─────────────────────────────────────┤
│ Frontend Service (Port 80)           │
│ Backend Service (Port 80)            │
│ AI Service (Port 80)                 │
│ PostgreSQL (Port 5432)                │
│ Redis (Port 6379)                    │
└─────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Build**: Docker images for all services
2. **Test**: Unit tests and integration tests
3. **Push**: Images to Docker Hub
4. **Deploy**: Update Kubernetes manifests
5. **Verify**: Health checks and smoke tests

### Image Registry
- **Repository**: `bayarmaa/career-coach-platform`
- **Tags**: `frontend-latest`, `backend-latest`, `ai-service-latest`
- **Registry**: Docker Hub

## 📞 Support & Maintenance

### Regular Maintenance
```bash
# Update images
kubectl set image deployment/frontend-prod frontend=bayarmaa/career-coach-platform:frontend-latest -n career-coach-prod

# Restart services
kubectl rollout restart deployment/frontend-prod -n career-coach-prod

# Check status
kubectl rollout status deployment/frontend-prod -n career-coach-prod
```

### Backup Strategy
```bash
# Backup PostgreSQL
kubectl exec -it postgres-0 -n career-coach-prod -- pg_dump career_coach > backup.sql

# Backup Redis
kubectl exec -it redis-prod-<pod-id> -n career-coach-prod -- redis-cli BGSAVE
```

### Scaling
```bash
# Scale frontend
kubectl scale deployment frontend-prod --replicas=3 -n career-coach-prod

# Scale backend
kubectl scale deployment backend-prod --replicas=2 -n career-coach-prod
```

---

## 🎯 Success Criteria

- [ ] All pods running successfully
- [ ] Services accessible via ingress
- [ ] Database connections working
- [ ] API endpoints responding
- [ ] Frontend loading properly
- [ ] Monitoring and logging functional

## 📚 Additional Resources

- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Docker Hub](https://hub.docker.com/)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-03-20
