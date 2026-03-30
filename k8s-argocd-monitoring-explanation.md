# 📊 ArgoCD Monitoring in Kubernetes

## **What is ArgoCD Monitoring?**

ArgoCD monitoring helps you **track the health and status** of your GitOps deployments. It shows:
- **Application sync status** - Is GitHub = Running state?
- **Deployment health** - Are applications working?
- **Sync history** - What changed and when?
- **Resource usage** - How much CPU/memory is ArgoCD using?

---

## **1. ArgoCD Application Monitoring**

### **Application Status**
```yaml
# ArgoCD Application with monitoring labels
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: career-coach-app
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-application
    app.kubernetes.io/component: monitoring
spec:
  source:
    repoURL: https://github.com/bayarmaa01/career-coach-platform.git
    targetRevision: main
    path: k8s  # Monitor k8s folder
  destination:
    server: https://kubernetes.default.svc
    namespace: career-coach-prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### **What This Monitors:**
- **Repo Changes** - Watches `k8s/` folder in GitHub
- **Sync Status** - Are deployed apps matching Git?
- **Health Status** - Are deployments healthy?
- **Retry Logic** - What happens if sync fails?

---

## **2. ArgoCD Server Monitoring**

### **Server Metrics**
```yaml
# ServiceMonitor for ArgoCD server
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-server-metrics
  namespace: argocd
  labels:
    app: argocd
    component: server
spec:
  selector:
    matchLabels:
      app: argocd-server
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

### **What Metrics Are Collected:**
- **`argocd_app_sync_total`** - Total sync operations
- **`argocd_app_health_status`** - Application health (1=Healthy, 0=Unhealthy)
- **`argocd_app_reconcile_bucket`** - Reconciliation time
- **`argocd_redis_request_duration_seconds`** - Redis performance
- **`argocd_api_request_total`** - API request count

---

## **3. Grafana Dashboard for ArgoCD**

### **Key Panels to Create**

#### **1. Application Health Overview**
```
Query: argocd_app_health_status{job="argocd-metrics"}
Visualization: Stat Panel
Legend: 
  1 = Healthy ✅
  0 = Unhealthy ❌
```

#### **2. Sync Success Rate**
```
Query: rate(argocd_app_sync_total{status="succeeded"}[5m])
Visualization: Gauge
Shows: Syncs per minute
```

#### **3. Sync Duration**
```
Query: argocd_app_reconcile_bucket
Visualization: Heatmap
Shows: How long syncs take
```

#### **4. API Request Rate**
```
Query: rate(argocd_api_request_total[5m])
Visualization: Time Series
Shows: API usage over time
```

---

## **4. ArgoCD Alerts**

### **Prometheus Alert Rules**
```yaml
# argocd-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: argocd-alerts
  namespace: argocd
spec:
  groups:
  - name: argocd.rules
    rules:
    # Alert if app is unhealthy
    - alert: ArgoCDAppUnhealthy
      expr: argocd_app_health_status == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "ArgoCD application {{ $labels.app }} is unhealthy"
        description: "Application {{ $labels.app }} has been unhealthy for more than 5 minutes"

    # Alert if sync fails
    - alert: ArgoCDSyncFailed
      expr: argocd_app_sync_status{status="failed"} == 1
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "ArgoCD sync failed for {{ $labels.app }}"
        description: "Failed to sync {{ $labels.app }} for 2 minutes"

    # Alert if API error rate is high
    - alert: ArgoCDHighErrorRate
      expr: rate(argocd_api_request_total{status_code!~"2.."}[5m]) > 0.1
      for: 3m
      labels:
        severity: warning
      annotations:
        summary: "ArgoCD API error rate is high"
        description: "API error rate is {{ $value }} errors per second"
```

---

## **5. How Monitoring Works in Your Project**

### **Data Flow Diagram**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GITHUB REPO  │    │     ARGOCD     │    │  PROMETHEUS    │
│                │    │                │    │                │
│ k8s/ folder    │───▶│  Watches changes │───▶│  Scrapes /metrics│
│                │    │                │    │                │
│ deployment.yaml │    │  Deploys apps  │    │  Stores data    │
│ service.yaml    │    │                │    │                │
└─────────────────┘    └─────────────────┘    └─────────┬───────┘
                                                │ metrics
                                                ▼
┌─────────────────────────────────────────────────────────┐
│                  GRAFANA                        │
│                                                │
│  • App Health Dashboard                       │
│  • Sync Status Panel                         │
│  • Alert Rules                              │
│  • Performance Graphs                         │
└─────────────────────────────────────────────────────────┘
```

### **Real Example from Your Project**

#### **Monitoring Your Backend Deployment**
```yaml
# Your backend application
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-prod
  namespace: career-coach-prod
  labels:
    app.kubernetes.io/name: backend-prod
    app.kubernetes.io/component: application
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: backend-prod
    spec:
      containers:
      - name: backend
        image: backend-prod:latest
        ports:
        - containerPort: 5000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
```

#### **ArgoCD Monitors This By:**
1. **Watching GitHub** for changes to `backend-deployment-prod.yaml`
2. **Comparing** deployed version vs Git version
3. **Syncing** if differences found
4. **Checking health** via liveness probe
5. **Reporting** status to Prometheus

---

## **6. Setting Up Monitoring**

### **Step 1: Install Prometheus Operator**
```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### **Step 2: Enable ArgoCD Metrics**
```bash
# Edit ArgoCD config to enable metrics
kubectl edit configmap argocd-cm -n argocd

# Add these settings:
data:
  metrics.enabled: "true"
  metrics.application.labels: "app.kubernetes.io/name,app.kubernetes.io/component"
```

### **Step 3: Create ServiceMonitor**
```bash
# Apply the ServiceMonitor
kubectl apply -f argocd-servicemonitor.yaml
```

### **Step 4: Import Grafana Dashboard**
```bash
# Import ArgoCD dashboard (ID: 10980)
# Or create custom dashboard with queries above
```

---

## **7. What You'll See in Grafana**

### **Dashboard Panels**

#### **Application Status Panel**
```
┌─────────────────────────────────────┐
│ Application Health Status           │
│                                 │
│ ✅ backend-prod     Healthy    │
│ ✅ frontend-prod    Healthy    │
│ ✅ postgres-prod     Healthy    │
│ ❌ ai-service-prod  Sync Error  │
└─────────────────────────────────────┘
```

#### **Sync History Panel**
```
┌─────────────────────────────────────┐
│ Recent Sync Activity              │
│                                 │
│ 14:30  backend-prod  Success   │
│ 14:25  frontend-prod Success   │
│ 14:20  postgres-prod  Success   │
│ 14:15  ai-service-prod Failed    │
└─────────────────────────────────────┘
```

#### **Performance Metrics**
```
┌─────────────────────────────────────┐
│ ArgoCD Performance               │
│                                 │
│ CPU Usage:    15%               │
│ Memory:       120MiB             │
│ API Requests: 45/min             │
│ Sync Time:    2.3s avg          │
└─────────────────────────────────────┘
```

---

## **8. Troubleshooting Monitoring**

### **Common Issues**

#### **No Metrics in Grafana**
```bash
# Check if ServiceMonitor exists
kubectl get servicemonitor -n argocd

# Check if Prometheus is scraping
kubectl get prometheus -n monitoring
```

#### **ArgoCD Not Syncing**
```bash
# Check ArgoCD application status
kubectl get application -n argocd

# Force sync manually
argocd app sync career-coach-app
```

#### **Alerts Not Firing**
```bash
# Check Prometheus rules
kubectl get prometheusrule -n argocd

# Check alertmanager config
kubectl get secret alertmanager-main-config -n monitoring
```

---

## **9. Best Practices**

### **Monitoring Setup**
1. **Label Everything** - Use consistent labels for filtering
2. **Create Meaningful Alerts** - Alert on real problems
3. **Build Useful Dashboards** - Show what matters
4. **Set Up Notification** - Email/Slack for critical alerts

### **For Your Project**
- **Monitor backend health** - `/api/health` endpoint
- **Track database connections** - PostgreSQL metrics
- **Watch frontend errors** - JavaScript error tracking
- **Monitor AI service** - Response time and accuracy

---

## **10. Quick Reference**

### **Key Metrics to Watch**
- `argocd_app_health_status` - App health (0/1)
- `argocd_app_sync_total` - Sync operations
- `argocd_app_reconcile_bucket` - Sync duration
- `argocd_api_request_total` - API usage

### **Important Alerts**
- **ArgoCDAppUnhealthy** - App is down
- **ArgoCDSyncFailed** - GitOps not working
- **ArgoCDHighErrorRate** - API problems

### **Useful Commands**
```bash
# Check ArgoCD status
argocd app list

# Check application details
argocd app get career-coach-app

# Force sync
argocd app sync career-coach-app

# Check Prometheus targets
kubectl get prometheustarget -n monitoring
```

---

**This monitoring setup gives you complete visibility into your GitOps pipeline!** 🎯

You'll know immediately when:
- Deployments fail
- Apps become unhealthy  
- Sync problems occur
- Performance degrades

**Modern DevOps requires observability - this is how you achieve it!** 🚀
