# 🔍 Career Coach Platform - Health Verification Checklist

## ✅ Pre-Deployment Checks

### Environment
- [ ] Minikube is running: `minikube status`
- [ ] Docker daemon is accessible
- [ ] All source code directories exist (backend, frontend, ai-service)
- [ ] k8s/career-coach-prod/ directory contains all manifests

### Images
- [ ] backend-prod:latest image exists: `docker images | grep backend-prod`
- [ ] frontend-prod:latest image exists: `docker images | grep frontend-prod`
- [ ] ai-service-prod:latest image exists: `docker images | grep ai-service-prod`

## ✅ Deployment Verification

### Namespace & Resources
- [ ] Namespace created: `kubectl get namespace career-coach-prod`
- [ ] All manifests applied: `kubectl apply -k k8s/career-coach-prod/`
- [ ] No "field is immutable" errors

### Pods Status
- [ ] PostgreSQL pod: `kubectl get pods -l app=postgres -n career-coach-prod` (READY 1/1)
- [ ] Redis pod: `kubectl get pods -l app=redis-prod -n career-coach-prod` (READY 1/1)
- [ ] Backend pods: `kubectl get pods -l app=backend-prod -n career-coach-prod` (READY 2/2)
- [ ] Frontend pods: `kubectl get pods -l app=frontend-prod -n career-coach-prod` (READY 2/2)
- [ ] AI Service pod: `kubectl get pods -l app=ai-service-prod -n career-coach-prod` (READY 1/1)
- [ ] Grafana pod: `kubectl get pods -l app=grafana -n career-coach-prod` (READY 1/1)
- [ ] Prometheus pod: `kubectl get pods -l app=prometheus -n career-coach-prod` (READY 1/1)

### Services Status
- [ ] All services exist: `kubectl get svc -n career-coach-prod`
- [ ] Service selectors match pod labels: `kubectl describe svc -n career-coach-prod`

## ✅ Port-Forward Verification

### Port Availability
- [ ] Port 3100 is free: `! lsof -ti:3100`
- [ ] Port 4100 is free: `! lsof -ti:4100`
- [ ] Port 5100 is free: `! lsof -ti:5100`
- [ ] Port 3003 is free: `! lsof -ti:3003`
- [ ] Port 9090 is free: `! lsof -ti:9090`
- [ ] Port 18082 is free: `! lsof -ti:18082`

### Port-Forward Processes
- [ ] Frontend port-forward running: `lsof -ti:3100`
- [ ] Backend port-forward running: `lsof -ti:4100`
- [ ] AI Service port-forward running: `lsof -ti:5100`
- [ ] Grafana port-forward running: `lsof -ti:3003`
- [ ] Prometheus port-forward running: `lsof -ti:9090`
- [ ] ArgoCD port-forward running: `lsof -ti:18082`

## ✅ Endpoint Health Checks

### Application Endpoints
- [ ] Frontend: `curl -I http://localhost:3100` (HTTP 200)
- [ ] Backend Health: `curl -I http://localhost:4100/api/health` (HTTP 200)
- [ ] AI Service Health: `curl -I http://localhost:5100/health` (HTTP 200)

### Monitoring Endpoints
- [ ] Grafana Login: `curl -I http://localhost:3003/login` (HTTP 200)
- [ ] Prometheus Health: `curl -I http://localhost:9090/-/healthy` (HTTP 200)
- [ ] ArgoCD: `curl -I https://localhost:18082` (HTTP 200)

## ✅ Database Connectivity

### PostgreSQL
- [ ] PostgreSQL pod is ready: `kubectl wait --for=condition=ready pod -l app=postgres -n career-coach-prod --timeout=300s`
- [ ] Database is accessible: `kubectl exec postgres-0 -n career-coach-prod -- psql -U postgres -d career_coach_prod -c "SELECT version();"`
- [ ] Backend connects to database: Check backend logs for "✅ Connected to PostgreSQL database"

### Backend Database Connection
- [ ] Backend pods show correct DATABASE_URL: `kubectl exec deployment/backend-prod -n career-coach-prod -- env | grep DATABASE_URL`
- [ ] No "ECONNREFUSED" errors in backend logs
- [ ] Backend health endpoint responds with database status

## ✅ System Stability

### Pod Stability
- [ ] No pods in CrashLoopBackOff
- [ ] No pods restarting frequently (check RESTARTS column)
- [ ] All pods have Running status

### Port-Forward Stability
- [ ] Port-forwards stay alive for >5 minutes
- [ ] No "Port-forward process died, restarting..." messages
- [ ] All endpoints remain accessible over time

## 🚨 Troubleshooting Commands

### If Pods Don't Become Ready
```bash
# Check pod events
kubectl describe pod -l app=backend-prod -n career-coach-prod

# Check pod logs
kubectl logs -l app=backend-prod -n career-coach-prod

# Check pod environment variables
kubectl exec deployment/backend-prod -n career-coach-prod -- env | grep -E "(POSTGRES|DATABASE)"
```

### If Port-Forwards Fail
```bash
# Kill existing port-forwards
pkill -f port-forward

# Check port conflicts
lsof -ti:3100,4100,5100,3003,9090,18082

# Manual port-forward test
kubectl port-forward svc/backend-service -n career-coach-prod 4100:5000
```

### If Database Connection Fails
```bash
# Test database connectivity from backend pod
kubectl exec deployment/backend-prod -n career-coach-prod -- nc -zv postgres-service 5432

# Check database logs
kubectl logs postgres-0 -n career-coach-prod

# Verify database user/password
kubectl get secret app-secrets -n career-coach-prod -o yaml
```

## 🎯 Success Criteria

✅ **Fully Working System When:**
- All pods are `READY 1/1` or `2/2`
- All endpoints return HTTP 200
- No error logs in any pod
- Port-forwards stay stable
- Backend connects to PostgreSQL successfully
- Frontend can reach backend API
- All monitoring tools are accessible

✅ **ONE-COMMAND Success:**
```bash
./devops-smart.sh
# Should complete without any manual intervention
# All services should be accessible at the end
```
