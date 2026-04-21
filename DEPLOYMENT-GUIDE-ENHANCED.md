# Career Coach Platform - Production Deployment Guide

## 🚀 QUICK DEPLOYMENT (Current State Fixed)

### **Step 1: Apply Updated Configuration**

```bash
# Apply fixed secrets with stringData (no base64 issues)
kubectl apply -f k8s/career-coach-prod/secrets.yaml

# Apply enhanced AI service deployment
kubectl apply -f k8s/career-coach-prod/ai-service-deployment.yaml

# Restart AI service to pick up new configuration
kubectl rollout restart deployment/ai-service-prod -n career-coach-prod

# Wait for AI service to be ready
kubectl wait --for=condition=available deployment/ai-service-prod -n career-coach-prod --timeout=120s
```

### **Step 2: Verify Configuration**

```bash
# Check Gemini environment variables
kubectl exec -it deployment/ai-service-prod -n career-coach-prod -- printenv | grep GEMINI

# Test AI service health
kubectl exec -it deployment/ai-service-prod -n career-coach-prod -- curl -f http://localhost:5100/health

# Check all pods status
kubectl get pods -n career-coach-prod
```

### **Step 3: Test Service Communication**

```bash
# Test backend → AI service communication
kubectl exec -it deployment/backend-prod -n career-coach-prod -- curl -f http://ai-service:5100/health

# Test from local port-forward
curl -f http://localhost:5100/health
```

---

## 🔧 ENHANCED COMPONENTS

### **1. Kubernetes Secrets (stringData)**
- ✅ **No base64 encoding issues**
- ✅ **Plain text secrets** with automatic encoding
- ✅ **Safe secret management**

### **2. AI Service Deployment**
- ✅ **Readiness & Liveness Probes**
- ✅ **Resource Limits** (512Mi memory, 500m CPU)
- ✅ **Environment Variables** for Gemini API
- ✅ **Retry Logic** in application code
- ✅ **Timeout Handling** (30s default)
- ✅ **Observability** with metrics

### **3. Enhanced Gemini Client**
- ✅ **Retry Logic** with exponential backoff
- ✅ **Timeout Handling** with configurable limits
- ✅ **Metrics Tracking** (success/failure/latency)
- ✅ **Error Logging** with structured output
- ✅ **Health Checks** with API validation

### **4. Fallback Mechanism**
- ✅ **Graceful Degradation** when Gemini fails
- ✅ **Pre-defined Responses** for all endpoints
- ✅ **Context-Aware** fallbacks
- ✅ **Health Status** includes fallback state

---

## 🔍 DEBUG CHECKLIST

### **Pre-Deployment Checks**
- [ ] Minikube running: `minikube status`
- [ ] Namespace exists: `kubectl get ns career-coach-prod`
- [ ] Secrets configured: `kubectl get secret app-secrets -n career-coach-prod`
- [ ] Docker images built: `docker images | grep career-coach`

### **Post-Deployment Verification**
- [ ] All pods running: `kubectl get pods -n career-coach-prod`
- [ ] AI service healthy: `curl http://localhost:5100/health`
- [ ] Backend healthy: `curl http://localhost:4100/api/health`
- [ ] Frontend accessible: `curl http://localhost:3100`
- [ ] Gemini env vars loaded: `kubectl exec... printenv | grep GEMINI`

### **Service Communication Tests**
- [ ] Backend → AI Service: `kubectl exec backend-prod -- curl ai-service:5100/health`
- [ ] AI Service → Gemini: Check logs for API calls
- [ ] End-to-end: Upload resume via frontend

---

## 🛠️ MANAGEMENT COMMANDS

### **Secret Management**
```bash
# Update secrets safely
./scripts/update-secrets.sh update AIzaSyDiLz-GvOPpmLVxDH8nMBK99mkvQQyzyQ0

# Verify current secrets
./scripts/update-secrets.sh verify

# Backup secrets
./scripts/update-secrets.sh backup
```

### **Service Management**
```bash
# Restart specific service
kubectl rollout restart deployment/ai-service-prod -n career-coach-prod
kubectl rollout restart deployment/backend-prod -n career-coach-prod

# Check rollout status
kubectl rollout status deployment/ai-service-prod -n career-coach-prod

# Scale services
kubectl scale deployment/ai-service-prod --replicas=2 -n career-coach-prod
```

### **Monitoring**
```bash
# View logs
kubectl logs -f deployment/ai-service-prod -n career-coach-prod
kubectl logs -f deployment/backend-prod -n career-coach-prod

# Port forwarding (if not using devops-smart.sh)
kubectl port-forward svc/ai-service 5100:5100 -n career-coach-prod &
kubectl port-forward svc/backend-service 4100:4100 -n career-coach-prod &
kubectl port-forward svc/frontend-service 3100:3100 -n career-coach-prod &
```

---

## 🎯 PRODUCTION BEST PRACTICES

### **Secret Management**
- ✅ **Use stringData** instead of base64-encoded data
- ✅ **External Secret Store** (Sealed Secrets/AWS Secrets Manager)
- ✅ **Rotate keys regularly**
- ✅ **Audit secret access**

### **Scaling AI Service**
- ✅ **Horizontal Pod Autoscaler** based on CPU/memory
- ✅ **Load Balancing** with multiple replicas
- ✅ **Circuit Breaker** for Gemini API calls
- ✅ **Rate Limiting** to prevent API abuse

### **Observability**
- ✅ **Structured Logging** with JSON format
- ✅ **Metrics Export** to Prometheus
- ✅ **Distributed Tracing** with Jaeger
- ✅ **Health Endpoints** for all services

---

## 🚨 TROUBLESHOOTING

### **Common Issues & Solutions**

#### **Gemini API Not Working**
```bash
# Check environment variables
kubectl exec -it deployment/ai-service-prod -n career-coach-prod -- printenv | grep GEMINI

# Check API key format
kubectl get secret app-secrets -n career-coach-prod -o yaml | grep GEMINI_API_KEY

# Test API directly
kubectl exec -it deployment/ai-service-prod -n career-coach-prod -- curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1beta/models
```

#### **Service Communication Issues**
```bash
# Test DNS resolution
kubectl exec -it deployment/backend-prod -n career-coach-prod -- nslookup ai-service

# Check service endpoints
kubectl get endpoints -n career-coach-prod

# Test network policies
kubectl get networkpolicies -n career-coach-prod
```

#### **Pod Restart Loops**
```bash
# Check resource limits
kubectl describe pod -l app=ai-service-prod -n career-coach-prod

# Check events
kubectl get events -n career-coach-prod --sort-by='.lastTimestamp'

# Check liveness/readiness probes
kubectl describe deployment ai-service-prod -n career-coach-prod | grep -A 10 Liveness\|Readiness
```

---

## 📊 SUCCESS METRICS

### **Deployment Success Criteria**
- ✅ All pods running and ready
- ✅ All health checks passing
- ✅ Gemini API key configured and working
- ✅ Service-to-service communication working
- ✅ Frontend shows career recommendations (not "No recommendations yet")

### **Performance Targets**
- ✅ AI service response time < 5 seconds
- ✅ Backend response time < 200ms
- ✅ Frontend load time < 2 seconds
- ✅ 99.9% uptime for all services

---

## 🔄 DEPLOYMENT AUTOMATION

### **Using Enhanced DevOps Script**
```bash
# Fast mode (reuses existing cluster)
./devops-smart.sh --fast

# Full mode (complete rebuild)
./devops-smart.sh --full

# Auto-detect optimal mode
./devops-smart.sh
```

### **CI/CD Integration**
- ✅ **ArgoCD** for GitOps deployments
- ✅ **Kustomize** for environment management
- ✅ **Helm Charts** for package management
- ✅ **Automated Testing** in deployment pipeline

---

**🎯 RESULT: Production-ready Kubernetes deployment with enhanced reliability, observability, and Gemini API integration!**
