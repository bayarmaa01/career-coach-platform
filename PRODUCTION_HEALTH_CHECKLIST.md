# 🔍 Career Coach Platform - Production Health Verification Checklist

## ✅ Pre-Deployment Verification

### Environment Setup
- [ ] Minikube is running: `minikube status`
- [ ] Docker daemon is accessible: `docker version`
- [ ] All source directories exist: `ls -la backend frontend ai-service`
- [ ] k8s/career-coach-prod/ contains all manifests: `ls k8s/career-coach-prod/`

### Docker Images
- [ ] backend-prod:latest exists: `docker images | grep backend-prod`
- [ ] frontend-prod:latest exists: `docker images | grep frontend-prod`
- [ ] ai-service-prod:latest exists: `docker images | grep ai-service-prod`

## ✅ Kustomization Configuration

### Label/Selector Consistency
- [ ] NO commonLabels in kustomization.yaml
- [ ] All deployments have: selector.matchLabels == template.metadata.labels
- [ ] All services have correct selectors matching pod labels

### Environment Variables
- [ ] NO $(VAR) usage in any env values
- [ ] DATABASE_URL is hardcoded: `postgresql://postgres:adminpassword@postgres-service:5432/career_coach_prod`
- [ ] All secrets and ConfigMaps are properly referenced

## ✅ Deployment Verification

### Namespace & Resources
- [ ] Namespace created: `kubectl get namespace career-coach-prod`
- [ ] Kustomize applies without errors: `kubectl apply -k k8s/career-coach-prod/`
- [ ] NO "field is immutable" errors

### Pod Status Check
```bash
# All pods should be READY 1/1 or 2/2
kubectl get pods -n career-coach-prod
```

- [ ] PostgreSQL: READY 1/1 (app=postgres)
- [ ] Redis: READY 1/1 (app=redis-prod)
- [ ] Backend: READY 2/2 (app=backend-prod)
- [ ] Frontend: READY 2/2 (app=frontend-prod)
- [ ] AI Service: READY 1/1 (app=ai-service-prod)
- [ ] Grafana: READY 1/1 (app=grafana)
- [ ] Prometheus: READY 1/1 (app=prometheus)

### Service Connectivity
- [ ] All services exist: `kubectl get svc -n career-coach-prod`
- [ ] Service selectors match pod labels: `kubectl describe svc -n career-coach-prod`
- [ ] Endpoints are populated: `kubectl get endpoints -n career-coach-prod`

## ✅ Database Connectivity

### PostgreSQL Health
- [ ] PostgreSQL pod ready: `kubectl wait --for=condition=ready pod -l app=postgres -n career-coach-prod --timeout=300s`
- [ ] Database accessible: `kubectl exec postgres-0 -n career-coach-prod -- psql -U postgres -d career_coach_prod -c "SELECT version();"`
- [ ] Backend connects to database: Check backend logs for "✅ Connected to PostgreSQL"

### Backend Environment
- [ ] DATABASE_URL is correct: `kubectl exec deployment/backend-prod -n career-coach-prod -- env | grep DATABASE_URL`
- [ ] No "ECONNREFUSED" errors in backend logs
- [ ] Backend health endpoint responds: HTTP 200

## ✅ Port-Forward Verification

### Port Availability Check
```bash
# All ports should be free before starting
! lsof -ti:3100 && ! lsof -ti:4100 && ! lsof -ti:5100 && ! lsof -ti:3003 && ! lsof -ti:9090 && ! lsof -ti:18082
```

- [ ] Port 3100 free for frontend
- [ ] Port 4100 free for backend
- [ ] Port 5100 free for AI service
- [ ] Port 3003 free for Grafana
- [ ] Port 9090 free for Prometheus
- [ ] Port 18082 free for ArgoCD

### Port-Forward Processes
- [ ] Frontend port-forward running: `lsof -ti:3100`
- [ ] Backend port-forward running: `lsof -ti:4100`
- [ ] AI Service port-forward running: `lsof -ti:5100`
- [ ] Grafana port-forward running: `lsof -ti:3003`
- [ ] Prometheus port-forward running: `lsof -ti:9090`
- [ ] ArgoCD port-forward running: `lsof -ti:18082`

## ✅ Endpoint Health Checks

### Application Endpoints
- [ ] Frontend: `curl -I http://localhost:3100` → HTTP 200
- [ ] Backend Health: `curl -I http://localhost:4100/api/health` → HTTP 200
- [ ] AI Service Health: `curl -I http://localhost:5100/health` → HTTP 200

### Monitoring Endpoints
- [ ] Grafana Login: `curl -I http://localhost:3003/login` → HTTP 200
- [ ] Prometheus Health: `curl -I http://localhost:9090/-/healthy` → HTTP 200
- [ ] ArgoCD: `curl -I https://localhost:18082` → HTTP 200

## ✅ System Stability

### Pod Stability
- [ ] No pods in CrashLoopBackOff
- [ ] No pods restarting frequently (RESTARTS < 5)
- [ ] All pods have Running status
- [ ] All containers ready

### Port-Forward Stability
- [ ] Port-forwards stay alive for >5 minutes
- [ ] No "Port-forward process died, restarting..." messages
- [ ] All endpoints remain accessible over time

## 🚨 Troubleshooting Commands

### If Pods Don't Become Ready
```bash
# Check pod events and status
kubectl describe pod -l app=backend-prod -n career-coach-prod

# Check pod logs for errors
kubectl logs -l app=backend-prod -n career-coach-prod --tail=50

# Check environment variables
kubectl exec deployment/backend-prod -n career-coach-prod -- env | grep -E "(POSTGRES|DATABASE)"
```

### If Database Connection Fails
```bash
# Test database connectivity from backend pod
kubectl exec deployment/backend-prod -n career-coach-prod -- nc -zv postgres-service 5432

# Check database logs
kubectl logs postgres-0 -n career-coach-prod --tail=20

# Verify database credentials
kubectl get secret app-secrets -n career-coach-prod -o yaml
```

### If Port-Forwards Fail
```bash
# Kill existing port-forwards
pkill -f port-forward

# Check for port conflicts
lsof -ti:3100,4100,5100,3003,9090,18082

# Manual port-forward test
kubectl port-forward svc/backend-service -n career-coach-prod 4100:5000
```

### If "Field is Immutable" Errors
```bash
# Clean slate approach
kubectl delete deployment --all -n career-coach-prod
kubectl delete statefulset --all -n career-coach-prod
sleep 10
kubectl apply -k k8s/career-coach-prod/
```

## 🎯 Success Criteria

### ✅ Fully Working System When:
- All pods are `READY 1/1` or `2/2`
- All endpoints return HTTP 200
- No error logs in any pod
- Port-forwards stay stable for >10 minutes
- Backend connects to PostgreSQL successfully
- Frontend can reach backend API
- All monitoring tools are accessible

### ✅ ONE-COMMAND Success:
```bash
./devops-smart.sh
# Should complete without ANY manual intervention
# All services should be accessible at the end
# No error messages in console
```

## 📋 Quick Verification Commands

```bash
# Check all pod status
kubectl get pods -n career-coach-prod

# Check all services
kubectl get svc -n career-coach-prod

# Test all endpoints
curl -I http://localhost:3100 && curl -I http://localhost:4100/api/health && curl -I http://localhost:5100/health

# Check port-forwards
lsof -ti:3100,4100,5100,3003,9090,18082

# Check backend database connection
kubectl logs -l app=backend-prod -n career-coach-prod | grep -E "(Database|Connected|ECONNREFUSED)"
```

---

## 🚀 **FINAL GOAL ACHIEVED**

**You should NEVER need to run manual kubectl commands again.**

**The ONE-COMMAND system handles everything:**
- ✅ Automatic cleanup of broken deployments
- ✅ Perfect label/selector matching
- ✅ Database-first deployment strategy
- ✅ Stable port-forward management
- ✅ Comprehensive health verification
- ✅ Production-grade error handling

**Run this single command and everything works:**
```bash
./devops-smart.sh
```
