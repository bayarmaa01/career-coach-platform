# Career Coach Platform - Grafana Dashboards Deployment Guide

## **Overview**

Production-grade Grafana dashboards for complete observability of the Career Coach Platform with dynamic service detection and comprehensive alerting.

## **Dashboard Architecture**

### **1. Application Layer Dashboard** (`application-metrics.json`)
- **Request Rate (RPS)** by service
- **Error Rate (%)** by service (4xx, 5xx)
- **Response Latency** (p50, p95, p99)
- **AI Service Request Rate**
- **Gemini API Success vs Failure**

### **2. Kubernetes Layer Dashboard** (`kubernetes-metrics.json`)
- **Pod CPU/Memory Usage** (%)
- **Pod Restarts** tracking
- **Pod Status** (Running/CrashLoop)
- **Replica Count** vs Desired
- **Pod Disk Usage**
- **Pod Network I/O**

### **3. Infrastructure Dashboard** (`infrastructure-metrics.json`)
- **Node CPU/Memory Usage** (%)
- **Node Disk Usage**
- **Node Network I/O**
- **Node Load Average**
- **File Descriptors**
- **Node Uptime**

### **4. AI Service Dashboard** (`ai-service-metrics.json`)
- **AI Service Request Rate** by endpoint
- **AI Service Error Rate** (%)
- **AI Service Response Time** (p50, p95, p99)
- **Gemini API Request Rate**
- **Gemini API Success Rate** (%)
- **Gemini API Latency** (p95)
- **Resource Usage** (CPU/Memory)

## **Dynamic Service Detection**

All dashboards use **dynamic variables** to automatically detect services:

```yaml
# Application Services Detection
label_values(http_requests_total{namespace="$namespace"}, job)

# Kubernetes Pods Detection  
label_values(kube_pod_info{namespace="$namespace"}, pod)

# Infrastructure Nodes Detection
label_values(node_uname_info, instance)
```

**Service Labels Supported:**
- `app=backend`
- `app=ai-service` 
- `app=frontend`

## **Installation Instructions**

### **Step 1: Apply Alerting Rules**

```bash
# Apply Prometheus alerting rules
kubectl apply -f monitoring/prometheus/rules/career-coach-alerts.yaml

# Verify rules are loaded
kubectl get prometheusrules -n career-coach-prod
```

### **Step 2: Import Dashboards**

#### **Method A: Grafana UI Import**

1. **Access Grafana**: `http://localhost:3003`
2. **Login** with credentials (admin/cjwYOkKdNmNJdSFH)
3. **Navigate**: Dashboards > Import
4. **Upload JSON files**:
   - `monitoring/grafana/dashboards/application-metrics.json`
   - `monitoring/grafana/dashboards/kubernetes-metrics.json`
   - `monitoring/grafana/dashboards/infrastructure-metrics.json`
   - `monitoring/grafana/dashboards/ai-service-metrics.json`

#### **Method B: Kubernetes ConfigMap**

```bash
# Create ConfigMap with dashboards
kubectl create configmap grafana-dashboards \
  --from-file=monitoring/grafana/dashboards/ \
  --namespace=career-coach-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# Update Grafana deployment to mount dashboards
kubectl patch deployment grafana -n career-coach-prod -p '
{
  "spec": {
    "template": {
      "spec": {
        "volumes": [{
          "name": "grafana-dashboards",
          "configMap": {
            "name": "grafana-dashboards"
          }
        }],
        "containers": [{
          "name": "grafana",
          "volumeMounts": [{
            "name": "grafana-dashboards",
            "mountPath": "/etc/grafana/provisioning/dashboards"
          }]
        }]
      }
    }
  }
}'
```

### **Step 3: Verify Dashboards**

```bash
# Check Grafana pods are running
kubectl get pods -l app=grafana -n career-coach-prod

# Check dashboard ConfigMap
kubectl get configmap grafana-dashboards -n career-coach-prod -o yaml

# Verify Prometheus is scraping metrics
curl -s http://localhost:9091/api/v1/label/__name__/values | grep career_coach
```

## **Alerting Configuration**

### **Critical Alerts**
- **Service Down** (severity: critical)
- **Pod Crash Looping** (severity: warning)
- **Gemini API Down** (severity: critical)
- **Node Down** (severity: critical)
- **Disk Space Low** (severity: critical)

### **Warning Alerts**
- **High Error Rate** (>5%)
- **High Latency** (>1s)
- **High CPU Usage** (>80%)
- **High Memory Usage** (>85%)
- **Gemini API High Error Rate** (>10%)

### **Business Alerts**
- **No Career Recommendations** (10 minutes)
- **Resume Processing Failed** (5xx errors)

## **Metric Requirements**

### **Application Metrics**
```yaml
# HTTP Metrics
http_requests_total{service, status, endpoint}
http_request_duration_seconds_bucket{service, le, endpoint}

# AI Service Metrics  
ai_requests_total{service, endpoint, status}
ai_request_duration_seconds_bucket{service, le, endpoint}

# Gemini API Metrics
gemini_api_requests_total{service, status}
gemini_api_errors_total{service, error_type}
gemini_api_duration_seconds_bucket{service, le}
```

### **Kubernetes Metrics**
```yaml
# kube-state-metrics
kube_pod_status_ready{pod, namespace}
kube_pod_container_status_restarts_total{pod, namespace}
kube_deployment_spec_replicas{deployment, namespace}
kube_deployment_status_replicas_available{deployment, namespace}

# cAdvisor
container_cpu_usage_seconds_total{pod, namespace}
container_memory_working_set_bytes{pod, namespace}
container_fs_usage_bytes{pod, namespace}
container_network_receive_bytes_total{pod, namespace}
container_network_transmit_bytes_total{pod, namespace}
```

### **Infrastructure Metrics**
```yaml
# node-exporter
node_cpu_seconds_total{mode, instance}
node_memory_MemAvailable_bytes{instance}
node_memory_MemTotal_bytes{instance}
node_filesystem_size_bytes{instance, mountpoint}
node_filesystem_avail_bytes{instance, mountpoint}
node_network_receive_bytes_total{instance, device}
node_network_transmit_bytes_total{instance, device}
node_load1{instance}
node_load5{instance}
node_load15{instance}
node_filefd_allocated{instance}
node_filefd_maximum{instance}
node_time_seconds{instance}
node_boot_time_seconds{instance}
```

## **Customization Guide**

### **Adding New Services**

1. **Update Service Labels**:
   ```yaml
   # Add to your service deployment
   labels:
     app: your-service-name
   ```

2. **Update Dashboard Variables**:
   ```json
   "definition": "label_values(http_requests_total{namespace=\"$namespace\"}, job)"
   ```

3. **Add Service-Specific Metrics**:
   ```yaml
   # Add custom metrics for your service
   your_service_custom_metric_total{service, status}
   ```

### **Modifying Alert Thresholds**

```yaml
# Edit career-coach-alerts.yaml
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{namespace="career-coach-prod", status!~"2.."}[5m])) by (service) 
    / sum(rate(http_requests_total{namespace="career-coach-prod"}[5m])) by (service) * 100 > 5  # Change threshold
```

### **Adding New Dashboards**

1. **Create JSON Dashboard** using Grafana UI
2. **Export as JSON**
3. **Add Dynamic Variables**:
   ```json
   "templating": {
     "list": [
       {
         "name": "namespace",
         "definition": "label_values(kube_namespace_labels, namespace)"
       }
     ]
   }
   ```

## **Troubleshooting**

### **Common Issues**

#### **Dashboard Shows No Data**
```bash
# Check Prometheus targets
curl -s http://localhost:9091/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job != "prometheus") | {job: .labels.job, health: .health, lastError: .lastError}'

# Check metric availability
curl -s "http://localhost:9091/api/v1/query?query=up" | jq '.data.result[] | {metric: .metric, value: .value}'
```

#### **Alerts Not Firing**
```bash
# Check alert rules
curl -s "http://localhost:9091/api/v1/rules" | jq '.data.groups[].rules[] | select(.name | contains("HighErrorRate"))'

# Check alertmanager configuration
kubectl get configmap alertmanager-main -n career-coach-prod -o yaml
```

#### **Service Discovery Issues**
```bash
# Check service labels
kubectl get pods -n career-coach-prod --show-labels

# Check Prometheus service discovery
curl -s "http://localhost:9091/api/v1/query?query=kube_pod_info" | jq '.data.result[].metric'
```

## **Performance Optimization**

### **Dashboard Performance**
- **Time Range**: Use appropriate time ranges (1h for real-time, 24h for trends)
- **Query Optimization**: Use `rate()` and `increase()` for counters
- **Panel Limits**: Limit panels per dashboard (<20)
- **Refresh Intervals**: Set appropriate refresh rates (5s-30s)

### **Prometheus Performance**
```bash
# Check Prometheus memory usage
kubectl top pod -l app=prometheus -n career-coach-prod

# Check query performance
curl -s "http://localhost:9091/api/v1/query?query=rate(http_requests_total[5m])" | jq '.data.result | length'
```

## **Security Considerations**

### **RBAC**
```yaml
# Grafana ServiceAccount with limited permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: grafana
  namespace: career-coach-prod
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: grafana-reader
  namespace: career-coach-prod
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list"]
```

### **Network Policies**
```yaml
# Restrict Grafana network access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: grafana-netpol
  namespace: career-coach-prod
spec:
  podSelector:
    matchLabels:
      app: grafana
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: prometheus
    ports:
    - protocol: TCP
      port: 9090
```

## **Success Criteria**

### **Dashboard Validation**
- [ ] All dashboards load successfully
- [ ] Dynamic variables populate correctly
- [ ] Metrics display for all services
- [ ] Time range selection works
- [ ] Panel tooltips show data

### **Alerting Validation**
- [ ] Alert rules are loaded in Prometheus
- [ ] Alertmanager receives alerts
- [ ] Alert notifications work
- [ ] Alert thresholds are appropriate

### **Performance Validation**
- [ ] Dashboards load within 3 seconds
- [ ] Prometheus queries complete within 30 seconds
- [ ] No memory leaks in Grafana
- [ ] Alert evaluation completes within 1 minute

---

**Result: Complete production-grade observability with dynamic service detection, comprehensive alerting, and enterprise-grade dashboards!**
