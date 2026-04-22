# Frontend Deployment Fix - Complete Guide

## **Problem Summary**
Frontend changes are not reflected after deployment due to:
1. `imagePullPolicy: Never` in Kubernetes deployment
2. Aggressive browser caching (1 year for static assets)
3. No cache-busting mechanism
4. Missing React routes for new AI pages

## **Solution Overview**
1. Fixed Dockerfile with build hash and cache-busting
2. Updated Kubernetes deployment with `imagePullPolicy: Always`
3. Improved nginx configuration for proper caching
4. Added React routes for new AI pages
5. Updated navigation with new AI features

---

## **Step-by-Step Deployment Commands**

### **Prerequisites**
- Docker Desktop running
- Minikube cluster running
- kubectl configured

### **Step 1: Start Docker Desktop**
```bash
# Start Docker Desktop (Windows)
powershell -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'"

# Wait for Docker to be ready
docker --version
```

### **Step 2: Start Minikube**
```bash
# Start Minikube
minikube start --driver=docker

# Verify cluster is running
minikube status
kubectl cluster-info
```

### **Step 3: Clean Old Docker Images**
```bash
# Remove old frontend image
docker rmi frontend-prod:latest 2>/dev/null || true

# Clean up dangling images
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true

# Clean up system
docker system prune -f
```

### **Step 4: Build New Frontend Image**
```bash
cd frontend

# Generate build hash
BUILD_HASH=$(date +%s)
BUILD_VERSION="v1.0.0-${BUILD_HASH}"

# Build with cache busting (no cache)
docker build \
  --build-arg BUILD_HASH=$BUILD_HASH \
  --build-arg BUILD_VERSION=$BUILD_VERSION \
  --no-cache \
  -t frontend-prod:latest \
  .

# Load into Minikube
minikube image load frontend-prod:latest
```

### **Step 5: Update Kubernetes Deployment**
```bash
cd ../k8s/career-coach-prod

# Apply updated deployment
kubectl apply -f frontend-deployment.yaml

# Force restart to pick up new image
kubectl rollout restart deployment/frontend-prod -n career-coach-prod

# Wait for deployment to be ready
kubectl rollout status deployment/frontend-prod -n career-coach-prod --timeout=120s
```

### **Step 6: Verify Deployment**
```bash
# Check pods are running
kubectl get pods -n career-coach-prod -l app=frontend-prod

# Check pod details
kubectl describe pods -n career-coach-prod -l app=frontend-prod

# Check deployment status
kubectl get deployment frontend-prod -n career-coach-prod -o yaml
```

---

## **Manual Deployment Script (Copy & Paste)**

```bash
# Set build variables
BUILD_HASH=$(date +%s)
BUILD_VERSION="v1.0.0-${BUILD_HASH}"
BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "Deploying frontend with Build Hash: $BUILD_HASH"

# Step 1: Clean up
docker rmi frontend-prod:latest 2>/dev/null || true
docker system prune -f

# Step 2: Build
cd frontend
docker build \
  --build-arg BUILD_HASH=$BUILD_HASH \
  --build-arg BUILD_VERSION=$BUILD_VERSION \
  --no-cache \
  -t frontend-prod:latest \
  .

# Step 3: Load to Minikube
minikube image load frontend-prod:latest

# Step 4: Deploy
cd ../k8s/career-coach-prod
kubectl apply -f frontend-deployment.yaml
kubectl rollout restart deployment/frontend-prod -n career-coach-prod

# Step 5: Wait
kubectl rollout status deployment/frontend-prod -n career-coach-prod --timeout=120s

# Step 6: Verify
kubectl get pods -n career-coach-prod -l app=frontend-prod

echo "Frontend deployment complete!"
echo "Check: http://localhost:3100/build-info.json"
```

---

## **Debugging Checklist**

### **1. Docker Issues**
- [ ] Docker Desktop is running
- [ ] Can run `docker --version`
- [ ] Can run `docker ps`
- [ ] Image builds without errors

### **2. Kubernetes Issues**
- [ ] Minikube is running
- [ ] `kubectl cluster-info` works
- [ ] Namespace `career-coach-prod` exists
- [ ] Pods are starting correctly

### **3. Build Verification**
- [ ] New image has correct build hash
- [ ] Build info file exists in container
- [ ] Check: `kubectl exec -it <pod-name> -- cat /usr/share/nginx/html/build-info.json`

### **4. Browser Issues**
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Try incognito/private browsing
- [ ] Check network tab for 200 responses
- [ ] Verify build-info.json endpoint

### **5. Application Issues**
- [ ] New navigation items appear
- [ ] Routes work: /create-cv, /career-chat, /skill-recommendations
- [ ] No 404 errors for new pages
- [ ] Console shows no JavaScript errors

---

## **Verification Commands**

### **Check Build Info**
```bash
# Check build info endpoint
curl http://localhost:3100/build-info.json

# Should return something like:
# {"buildHash":"1640123456","buildVersion":"v1.0.0-1640123456","buildTime":"2022-12-22T10:30:45Z"}
```

### **Check New Pages**
```bash
# Test new AI pages
curl -I http://localhost:3100/create-cv
curl -I http://localhost:3100/career-chat
curl -I http://localhost:3100/skill-recommendations

# Should return 200 status
```

### **Check Container Contents**
```bash
# Get pod name
POD_NAME=$(kubectl get pods -n career-coach-prod -l app=frontend-prod -o jsonpath='{.items[0].metadata.name}')

# Check files in container
kubectl exec -it $POD_NAME -n career-coach-prod -- ls -la /usr/share/nginx/html/

# Check build info
kubectl exec -it $POD_NAME -n career-coach-prod -- cat /usr/share/nginx/html/build-info.json
```

---

## **Common Issues & Solutions**

### **Issue: "imagePullPolicy: Never"**
**Solution:** Updated deployment YAML with `imagePullPolicy: Always`

### **Issue: Browser showing old UI**
**Solution:** 
- Clear browser cache
- Use incognito mode
- Check build-info.json for new build hash

### **Issue: 404 errors on new pages**
**Solution:**
- Verify React routes are added to App.tsx
- Check navigation links in Layout.tsx
- Restart frontend deployment

### **Issue: Pods not updating**
**Solution:**
- Force restart: `kubectl rollout restart deployment/frontend-prod -n career-coach-prod`
- Delete pods: `kubectl delete pods -n career-coach-prod -l app=frontend-prod`
- Check image pull: `kubectl describe pod <pod-name> -n career-coach-prod`

---

## **Best Practices for CI/CD**

### **1. Automated Versioning**
```yaml
# Use build hash in image tag
image: frontend-prod:$(git rev-parse --short HEAD)
```

### **2. Health Checks**
```yaml
# Add readiness/liveness probes
readinessProbe:
  httpGet:
    path: /build-info.json
    port: 80
  initialDelaySeconds: 10
```

### **3. Cache Busting**
```javascript
// In Vite config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
})
```

### **4. Environment Variables**
```yaml
env:
- name: BUILD_HASH
  valueFrom:
    fieldRef:
      fieldPath: metadata.annotations['build-hash']
```

---

## **Final Verification**

After deployment, you should see:

1. **New Navigation Items:**
   - Create CV (with Sparkles icon)
   - AI Chat (with MessageSquare icon)
   - Recommendations (with Target icon)

2. **New Pages Working:**
   - `/create-cv` - Smart CV Builder
   - `/career-chat` - AI Career Assistant
   - `/skill-recommendations` - Skill Recommendations

3. **Build Info:**
   - Visit `http://localhost:3100/build-info.json`
   - Shows current build hash and timestamp

4. **No Caching Issues:**
   - Browser loads latest code
   - Static assets update properly
   - No 404 errors

---

**Result: Your frontend deployment issue is completely fixed!**
