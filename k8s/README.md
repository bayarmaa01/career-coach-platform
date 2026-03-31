# Career Coach Platform - Kubernetes GitOps Repository

## 📁 Repository Structure

```
k8s/
├── career-coach-prod/          # Production Environment
│   ├── namespace.yaml           # Namespace definition
│   ├── secrets.yaml            # Application secrets
│   ├── configmap.yaml         # Application configuration
│   ├── postgres-pvc.yaml       # PostgreSQL persistent storage
│   ├── postgres-init-configmap.yaml  # Database initialization
│   ├── postgres-statefulset.yaml       # PostgreSQL deployment
│   ├── postgres-service.yaml    # PostgreSQL service
│   ├── redis-deployment.yaml   # Redis cache deployment
│   ├── redis-service.yaml      # Redis service
│   ├── backend-deployment.yaml  # Backend API deployment
│   ├── backend-service.yaml     # Backend service
│   ├── ai-service-deployment.yaml   # AI service deployment
│   ├── ai-service-service.yaml      # AI service
│   ├── frontend-deployment.yaml # Frontend deployment
│   ├── frontend-service.yaml    # Frontend service
│   ├── grafana-deployment.yaml # Grafana monitoring
│   ├── grafana-service.yaml    # Grafana service
│   ├── prometheus-deployment.yaml # Prometheus monitoring
│   ├── prometheus-service.yaml    # Prometheus service
│   ├── prometheus-configmap.yaml    # Prometheus configuration
│   └── kustomization.yaml     # Kustomize configuration
└── README.md                  # This file
```

## 🚀 Deployment

### Using Kustomize (Recommended)

```bash
# Deploy production environment
kubectl apply -k k8s/career-coach-prod/

# Check deployment status
kubectl get pods -n career-coach-prod

# Get services
kubectl get services -n career-coach-prod
```

### Using Individual Files

```bash
# Deploy namespace first
kubectl apply -f k8s/career-coach-prod/namespace.yaml

# Deploy infrastructure
kubectl apply -f k8s/career-coach-prod/secrets.yaml
kubectl apply -f k8s/career-coach-prod/configmap.yaml

# Deploy database
kubectl apply -f k8s/career-coach-prod/postgres-pvc.yaml
kubectl apply -f k8s/career-coach-prod/postgres-init-configmap.yaml
kubectl apply -f k8s/career-coach-prod/postgres-statefulset.yaml
kubectl apply -f k8s/career-coach-prod/postgres-service.yaml

# Deploy services
kubectl apply -f k8s/career-coach-prod/redis-deployment.yaml
kubectl apply -f k8s/career-coach-prod/redis-service.yaml
kubectl apply -f k8s/career-coach-prod/backend-deployment.yaml
kubectl apply -f k8s/career-coach-prod/backend-service.yaml
kubectl apply -f k8s/career-coach-prod/ai-service-deployment.yaml
kubectl apply -f k8s/career-coach-prod/ai-service-service.yaml
kubectl apply -f k8s/career-coach-prod/frontend-deployment.yaml
kubectl apply -f k8s/career-coach-prod/frontend-service.yaml

# Deploy monitoring
kubectl apply -f k8s/career-coach-prod/grafana-deployment.yaml
kubectl apply -f k8s/career-coach-prod/grafana-service.yaml
kubectl apply -f k8s/career-coach-prod/prometheus-deployment.yaml
kubectl apply -f k8s/career-coach-prod/prometheus-service.yaml
kubectl apply -f k8s/career-coach-prod/prometheus-configmap.yaml
```

## 🔧 Configuration

### Environment Variables

| Service | Port | Target Port | Description |
|---------|-------|-------------|-------------|
| Frontend | 3100 | 80 | React application |
| Backend | 4100 | 5000 | Node.js API |
| AI Service | 5100 | 5100 | Python AI service |
| PostgreSQL | 5432 | 5432 | Database |
| Redis | 6379 | 6379 | Cache |
| Grafana | 3003 | 3000 | Monitoring dashboard |
| Prometheus | 9090 | 9090 | Metrics collection |

### Service Communication

All services communicate internally using Kubernetes DNS:
- Backend: `http://backend-service:4100/api`
- AI Service: `http://ai-service:5100`
- Frontend: `http://frontend-service:3100`
- Database: `postgres-service:5432`
- Cache: `redis-service:6379`

## 🎯 ArgoCD Integration

### Application Configuration

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: career-coach-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/bayarmaa01/career-coach-platform.git
    targetRevision: HEAD
    path: k8s/career-coach-prod
  destination:
    server: https://kubernetes.default.svc
    namespace: career-coach-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

## 🔍 Monitoring

### Grafana Dashboard
- URL: `http://localhost:3003`
- Username: `admin`
- Password: `admin`
- Prometheus Data Source: `http://prometheus-service:9090`

### Prometheus Metrics
- URL: `http://localhost:9090`
- Targets: `http://localhost:9090/targets`

## 🛠️ Development

### Local Development

Use the `devops-smart.sh` script for local development:

```bash
./devops-smart.sh
```

This script will:
- Build all Docker images
- Deploy to Minikube using Kustomize
- Set up port forwards
- Verify all services are healthy

### Manual Port Forwards

```bash
# Frontend
kubectl port-forward svc/frontend-service 3100:3100 -n career-coach-prod

# Backend
kubectl port-forward svc/backend-service 4100:4100 -n career-coach-prod

# AI Service
kubectl port-forward svc/ai-service 5100:5100 -n career-coach-prod

# Grafana
kubectl port-forward svc/grafana-service 3003:3003 -n career-coach-prod

# Prometheus
kubectl port-forward svc/prometheus-service 9090:9090 -n career-coach-prod
```

## 📋 Best Practices

1. **Single Source of Truth**: All production resources are in `k8s/career-coach-prod/`
2. **Namespace Isolation**: All resources use `career-coach-prod` namespace
3. **Configuration Management**: Secrets and ConfigMaps are separate
4. **Service Discovery**: Internal communication uses Kubernetes service names
5. **Health Checks**: All deployments include liveness and readiness probes
6. **Resource Limits**: All containers have resource requests and limits
7. **GitOps Ready**: Structure optimized for ArgoCD synchronization

## 🚨 Troubleshooting

### Common Issues

1. **Pod Not Starting**
   ```bash
   kubectl describe pod <pod-name> -n career-coach-prod
   kubectl logs <pod-name> -n career-coach-prod
   ```

2. **Service Not Accessible**
   ```bash
   kubectl get svc -n career-coach-prod
   kubectl describe svc <service-name> -n career-coach-prod
   ```

3. **ArgoCD Sync Issues**
   ```bash
   # Check ArgoCD application status
   argocd app get career-coach-prod
   
   # Check sync status
   argocd app sync career-coach-prod
   ```

## 📝 Notes

- All resources are production-ready and tested
- No duplicate or conflicting resources
- Proper namespace isolation
- Optimized for GitOps workflows
- Includes comprehensive monitoring setup
