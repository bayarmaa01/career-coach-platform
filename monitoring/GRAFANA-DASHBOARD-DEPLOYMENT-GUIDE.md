# Grafana Dashboard Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the comprehensive AI Career Coach Platform monitoring dashboard.

## Files Created

1. **`ai-career-coach-dashboard.json`** - Complete Grafana dashboard configuration
2. **`alert-rules.yml`** - Prometheus alert rules for the platform
3. **`GRAFANA-DASHBOARD-DEPLOYMENT-GUIDE.md`** - This deployment guide

## Dashboard Features

### 🔹 System Overview
- **CPU Usage**: Real-time CPU usage percentage with thresholds (green/yellow/red)
- **Memory Usage**: Memory consumption in bytes with visual indicators
- **Pod Restarts**: Monitor container restart counts
- **Node Health**: Kubernetes node availability status

### 🔹 Backend API Monitoring
- **Request Rate (RPS)**: Requests per second with thresholds
- **Error Rate**: 4xx/5xx error percentage with alerting
- **Latency Percentiles**: P50, P95, P99 response times
- **Active Requests**: Current concurrent requests

### 🔹 AI Service Monitoring
- **Request Count**: AI service request rate
- **Response Latency**: AI service response times
- **Failure Rate**: AI service error percentage
- **Model Inference Time**: AI model processing time

### 🔹 Frontend Monitoring
- **Request Rate**: Frontend request monitoring
- **Response Time**: Frontend latency tracking

### 🔹 Kubernetes Health
- **Pod Status**: Running/Pending/Failed pod distribution
- **Deployment Replicas**: Current vs desired replica counts
- **Container Restarts**: Restart rate monitoring

## Dashboard Variables

- **Namespace**: Filter by Kubernetes namespace
- **Pod**: Select specific pods (supports multi-select)
- **Service**: Filter by Kubernetes service

## Alert Rules

### System Alerts
- High CPU usage (>80% for 5min)
- High memory usage (>85% for 5min)
- Pod crash looping detection

### Backend API Alerts
- High error rate (>5% for 2min)
- High latency (P95 > 1s for 5min)
- Low throughput (<10 RPS for 10min)

### AI Service Alerts
- High error rate (>3% for 2min)
- High inference time (>10s for 5min)
- Service down detection

### Kubernetes Health Alerts
- Pod not ready (10min)
- Replica mismatch (10min)
- Node down (5min)

## Deployment Instructions

### 1. Prerequisites

Ensure you have:
- Grafana installed and accessible
- Prometheus configured with Kubernetes metrics
- Proper network connectivity between Grafana and Prometheus

### 2. Import Dashboard

1. **Access Grafana UI**
   ```
   http://your-grafana-url:3000
   ```

2. **Navigate to Dashboard Import**
   - Click the `+` icon in the left sidebar
   - Select "Import Dashboard"

3. **Upload Dashboard JSON**
   - Choose "Upload JSON file"
   - Select `ai-career-coach-dashboard.json`
   - Click "Import"

4. **Configure Data Source**
   - Select "Prometheus" as the data source
   - Ensure the Prometheus URL is correctly configured

### 3. Configure Alert Rules

1. **Copy Alert Rules**
   ```bash
   # Copy alert rules to Prometheus configuration
   cp alert-rules.yml /path/to/prometheus/rules/
   ```

2. **Reload Prometheus**
   ```bash
   # Reload Prometheus configuration
   curl -X POST http://your-prometheus-url:9090/-/reload
   ```

### 4. Verify Dashboard

1. **Check Variables**
   - Verify namespace variable populates correctly
   - Test pod and service filters

2. **Validate Metrics**
   - Ensure all panels show data
   - Check for any query errors

3. **Test Alerts**
   - Verify alert rules are loaded in Prometheus
   - Test alert notifications

## Prometheus Metrics Required

Ensure your Prometheus instance is scraping the following metrics:

### Kubernetes Metrics
- `container_cpu_usage_seconds_total`
- `container_memory_usage_bytes`
- `kube_pod_status_phase`
- `kube_deployment_status_replicas`
- `kube_deployment_spec_replicas`
- `kube_pod_container_status_restarts_total`

### Application Metrics
- `http_requests_total` (with labels: job, status_code)
- `http_request_duration_seconds_bucket` (histogram)
- `active_connections`
- `model_inference_duration_seconds_bucket` (for AI service)

### Node Metrics
- `kube_node_status_allocatable_memory_bytes`
- `kube_node_status_condition`
- `up` (for node health)

## Customization

### Adding New Services

1. **Update Dashboard Variables**
   ```json
   "query": "label_values(kube_service_info{namespace=\"$namespace\"}, service)"
   ```

2. **Add New Panels**
   - Copy existing panel configuration
   - Update job labels and queries
   - Adjust thresholds as needed

### Modifying Thresholds

Edit the `thresholds` section in each panel:

```json
"thresholds": {
  "mode": "absolute",
  "steps": [
    {
      "color": "green",
      "value": null
    },
    {
      "color": "yellow",
      "value": 70
    },
    {
      "color": "red",
      "value": 90
    }
  ]
}
```

### Custom Time Ranges

Modify the time section in the dashboard JSON:

```json
"time": {
  "from": "now-6h",
  "to": "now"
}
```

## Troubleshooting

### Common Issues

1. **No Data Showing**
   - Check Prometheus data source connection
   - Verify metrics are being scraped
   - Check time range settings

2. **Variable Not Populating**
   - Verify Prometheus query syntax
   - Check metric names exist in Prometheus
   - Ensure proper permissions

3. **Alert Rules Not Working**
   - Check Prometheus rule file syntax
   - Verify alertmanager configuration
   - Check notification channels

### Debug Queries

Use the Prometheus UI to test queries:

```bash
# Test basic metric availability
up{job="backend"}

# Test specific queries
sum(rate(http_requests_total{job="backend"}[5m]))

# Check Kubernetes metrics
kube_pod_status_phase{namespace="default"}
```

## Performance Optimization

### Query Optimization

1. **Use Rate Functions**: Always use `rate()` for counter metrics
2. **Avoid High Cardinality**: Limit label combinations
3. **Time Window Selection**: Use appropriate time windows (5m for most cases)

### Dashboard Performance

1. **Refresh Interval**: Set appropriate refresh rates (5s recommended)
2. **Panel Limits**: Avoid too many panels in single dashboard
3. **Query Complexity**: Keep queries simple and efficient

## Security Considerations

1. **Data Source Permissions**: Restrict Prometheus access
2. **Dashboard Permissions**: Use Grafana role-based access
3. **Alert Notifications**: Secure alert channels

## Maintenance

### Regular Tasks

1. **Update Thresholds**: Adjust based on usage patterns
2. **Review Alerts**: Fine-tune alert rules
3. **Backup Dashboard**: Export dashboard configuration regularly

### Scaling Considerations

1. **Multiple Dashboards**: Split complex monitoring into multiple dashboards
2. **Grafana HA**: Consider Grafana high availability setup
3. **Prometheus Scaling**: Plan for Prometheus storage and performance

## Support

For issues or questions:
1. Check Grafana documentation
2. Review Prometheus metrics documentation
3. Consult Kubernetes monitoring best practices

---

**Dashboard UID**: `ai-career-coach-comprehensive`
**Version**: 1.0
**Last Updated**: 2025-04-25
