# 🔧 Kubernetes Configuration Reference

## 📁 File Structure

```
k8s/
├── namespace.yaml              # Development namespace
├── namespace-prod.yaml         # Production namespace
├── secrets.yaml               # Development secrets
├── secrets-prod.yaml          # Production secrets (base64 encoded)
├── persistent-volume.yaml     # Storage configuration
├── postgres-statefulset.yaml  # PostgreSQL database
├── postgres-service.yaml      # PostgreSQL service
├── redis-deployment.yaml      # Redis cache (dev)
├── redis-deployment-prod.yaml # Redis cache (prod)
├── redis-service.yaml         # Redis service
├── configmap.yaml            # Application configuration
├── frontend-deployment.yaml   # Frontend deployment (dev)
├── frontend-deployment-prod.yaml # Frontend deployment (prod)
├── frontend-service.yaml      # Frontend service
├── backend-deployment.yaml    # Backend deployment (dev)
├── backend-deployment-prod.yaml # Backend deployment (prod)
├── backend-service.yaml       # Backend service
├── ai-service-deployment.yaml # AI service deployment (dev)
├── ai-service-deployment-prod.yaml # AI service deployment (prod)
├── ai-service-service.yaml    # AI service service
├── ingress.yaml              # Ingress configuration (dev)
├── ingress-prod.yaml         # Ingress configuration (prod)
└── kustomization.yaml        # Kustomize configuration
```

## 🔐 Secrets Configuration

### Production Secrets (secrets-prod.yaml)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets-prod
  namespace: career-coach-prod
type: Opaque
data:
  POSTGRES_USER: cG9zdGdyZXM=                    # postgres
  POSTGRES_PASSWORD: cHJvZHBhc3N3b3JkMTIz          # prodpassword123
  REDIS_PASSWORD: cmVkaXNwYXNzd29yZDEyMw==        # redispassword123
  JWT_SECRET: and0c2VjcmV0Zm9ycHJvZHVjdGlvbjEyMw== # jwtsecretforproduction123
```

### Docker Registry Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret-prod
  namespace: career-coach-prod
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJkb2NrZXIuaW8iOnsidXNlcm5hbWUiOiJiYXlhcm1hYSIsInBhc3N3b3JkIjoiZG9ja2VyaHVidG9rZW4xMjMifX19
```

## 🌐 Ingress Configuration

### Production Ingress (ingress-prod.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: career-coach-ingress-prod
  namespace: career-coach-prod
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://ai-coach.duckdns.org"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ai-coach.duckdns.org
    secretName: career-coach-tls-prod
  rules:
  - host: ai-coach.duckdns.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
      - path: /ai
        pathType: Prefix
        backend:
          service:
            name: ai-service
            port:
              number: 80
```

## 🗄️ Database Configuration

### PostgreSQL StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: career-coach-prod
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: career_coach
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### Redis Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-prod
  template:
    metadata:
      labels:
        app: redis-prod
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: REDIS_PASSWORD
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
```

## 🚀 Application Deployments

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-prod
  namespace: career-coach-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-prod
  template:
    metadata:
      labels:
        app: frontend-prod
    spec:
      containers:
      - name: frontend
        image: bayarmaa/career-coach-platform:frontend-latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-prod
  namespace: career-coach-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-prod
  template:
    metadata:
      labels:
        app: backend-prod
    spec:
      containers:
      - name: backend
        image: bayarmaa/career-coach-platform:backend-latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "5000"
        - name: DATABASE_URL
          value: "postgresql://postgres:prodpassword123@postgres-service:5432/career_coach"
        - name: REDIS_URL
          value: "redis://:redispassword123@redis-service:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: JWT_SECRET
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### AI Service Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-service-prod
  template:
    metadata:
      labels:
        app: ai-service-prod
    spec:
      containers:
      - name: ai-service
        image: bayarmaa/career-coach-platform:ai-service-latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_URL
          value: "redis://:redispassword123@redis-service:6379"
        - name: MODEL_PATH
          value: "/app/models"
        resources:
          requests:
            memory: "512Mi"
            cpu: "300m"
          limits:
            memory: "1Gi"
            cpu: "800m"
        livenessProbe:
          httpGet:
            path: /ai/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ai/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: models-volume
          mountPath: /app/models
      volumes:
      - name: models-volume
        persistentVolumeClaim:
          claimName: models-pvc
```

## 🔧 Service Configuration

### Frontend Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: career-coach-prod
spec:
  selector:
    app: frontend-prod
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
  type: ClusterIP
```

### Backend Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: career-coach-prod
spec:
  selector:
    app: backend-prod
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
  type: ClusterIP
```

### AI Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-service
  namespace: career-coach-prod
spec:
  selector:
    app: ai-service-prod
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
  type: ClusterIP
```

## 📊 Storage Configuration

### Persistent Volumes
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: default
  hostPath:
    path: /data/postgres
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: career-coach-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: default
```

## 🎯 Configuration Map

### Application Configuration
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: career-coach-prod
data:
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "career_coach"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  FRONTEND_URL: "https://ai-coach.duckdns.org"
  BACKEND_URL: "https://ai-coach.duckdns.org/api"
  AI_SERVICE_URL: "https://ai-coach.duckdns.org/ai"
  CORS_ORIGIN: "https://ai-coach.duckdns.org"
  LOG_LEVEL: "info"
  ENVIRONMENT: "production"
```

## 🔄 Kustomize Configuration

### kustomization.yaml
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: career-coach-prod
resources:
  - namespace-prod.yaml
  - secrets-prod.yaml
  - persistent-volume.yaml
  - postgres-statefulset.yaml
  - postgres-service.yaml
  - redis-deployment-prod.yaml
  - redis-service.yaml
  - configmap.yaml
  - frontend-service.yaml
  - backend-service.yaml
  - ai-service-service.yaml
  - frontend-deployment-prod.yaml
  - backend-deployment-prod.yaml
  - ai-service-deployment-prod.yaml
  - ingress-prod.yaml
images:
  - name: bayarmaa/career-coach-platform
    newTag: frontend-latest
  - name: bayarmaa/career-coach-platform
    newTag: backend-latest
  - name: bayarmaa/career-coach-platform
    newTag: ai-service-latest
```

## 📋 Deployment Commands

### Quick Deploy
```bash
# Deploy all resources
kubectl apply -f k8s/

# Deploy specific namespace
kubectl apply -f k8s/namespace-prod.yaml

# Deploy using kustomize
kubectl apply -k k8s/
```

### Verify Deployment
```bash
# Check all resources
kubectl get all -n career-coach-prod

# Check specific resources
kubectl get pods,services,ingress -n career-coach-prod

# Check logs
kubectl logs -n career-coach-prod deployment/frontend-prod
kubectl logs -n career-coach-prod deployment/backend-prod
kubectl logs -n career-coach-prod deployment/ai-service-prod
```

### Scale Applications
```bash
# Scale frontend
kubectl scale deployment frontend-prod --replicas=3 -n career-coach-prod

# Scale backend
kubectl scale deployment backend-prod --replicas=2 -n career-coach-prod

# Scale AI service
kubectl scale deployment ai-service-prod --replicas=2 -n career-coach-prod
```

---

## 🔍 Troubleshooting Commands

### Debug Pods
```bash
# Describe pod
kubectl describe pod <pod-name> -n career-coach-prod

# Get pod logs
kubectl logs <pod-name> -n career-coach-prod -f

# Exec into pod
kubectl exec -it <pod-name> -n career-coach-prod -- /bin/bash
```

### Check Services
```bash
# List services
kubectl get svc -n career-coach-prod

# Describe service
kubectl describe svc <service-name> -n career-coach-prod

# Check endpoints
kubectl get endpoints -n career-coach-prod
```

### Check Ingress
```bash
# List ingress
kubectl get ingress -n career-coach-prod

# Describe ingress
kubectl describe ingress <ingress-name> -n career-coach-prod

# Check ingress controller
kubectl get pods -n ingress-nginx
```

---

**Configuration Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-03-20
