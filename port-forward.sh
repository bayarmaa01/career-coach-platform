#!/bin/bash

# Simple port-forwarding script for Career Coach Platform
# Use this after deployment to access services

NAMESPACE="career-coach-prod"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kill existing port forwards
cleanup() {
    print_info "Cleaning up existing port forwards..."
    pkill -f "port-forward.*career-coach-prod" || true
    sleep 2
}

# Setup port forwards
setup_forwards() {
    print_info "Setting up port forwards..."
    
    # Frontend (service port: 3100)
    minikube kubectl -- port-forward svc/frontend-service 3100:3100 -n $NAMESPACE &
    echo $! > /tmp/frontend.pid
    print_success "Frontend: http://localhost:3100"
    
    # Backend (service port: 4100)
    minikube kubectl -- port-forward svc/backend-service 4100:4100 -n $NAMESPACE &
    echo $! > /tmp/backend.pid
    print_success "Backend: http://localhost:4100"
    
    # AI Service (service port: 5100)
    minikube kubectl -- port-forward svc/ai-service 5100:5100 -n $NAMESPACE &
    echo $! > /tmp/ai-service.pid
    print_success "AI Service: http://localhost:5100"
    
    # Grafana (service port: 3003)
    minikube kubectl -- port-forward svc/grafana-service 3003:3003 -n $NAMESPACE &
    echo $! > /tmp/grafana.pid
    print_success "Grafana: http://localhost:3003"
    
    # Prometheus (service port: 9090)
    minikube kubectl -- port-forward svc/prometheus-service 9090:9090 -n $NAMESPACE &
    echo $! > /tmp/prometheus.pid
    print_success "Prometheus: http://localhost:9090"
}

# Stop all port forwards
stop_forwards() {
    print_info "Stopping all port forwards..."
    
    for pid_file in /tmp/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file" 2>/dev/null || echo "")
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
                print_info "Stopped process $pid"
            fi
            rm -f "$pid_file"
        fi
    done
    
    pkill -f "port-forward.*career-coach-prod" || true
    print_success "All port forwards stopped"
}

# Show status
show_status() {
    print_info "Checking port forward status..."
    
    echo ""
    echo "Services should be accessible at:"
    echo "  Frontend:   http://localhost:3100"
    echo "  Backend:    http://localhost:4100" 
    echo "  AI Service: http://localhost:5100"
    echo "  Grafana:    http://localhost:3003"
    echo "  Prometheus: http://localhost:9090"
    echo ""
    
    print_info "Active port-forward processes:"
    ps aux | grep "port-forward.*career-coach-prod" | grep -v grep || echo "  No active port-forwards found"
}

# Main menu
case "${1:-start}" in
    start)
        cleanup
        setup_forwards
        print_info "Port forwards are running. Press Ctrl+C to stop, or run '$0 stop'"
        print_info "Use '$0 status' to check status"
        
        # Keep script running
        trap stop_forwards EXIT
        while true; do
            sleep 5
            # Restart dead port-forwards if needed
            if ! pgrep -f "port-forward.*frontend-service" > /dev/null; then
                print_info "Restarting frontend port-forward..."
                minikube kubectl -- port-forward svc/frontend-service 3100:3100 -n $NAMESPACE &
            fi
        done
        ;;
    stop)
        stop_forwards
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|stop|status|cleanup}"
        echo "  start   - Start all port forwards"
        echo "  stop    - Stop all port forwards" 
        echo "  status  - Show status"
        echo "  cleanup - Kill existing processes"
        exit 1
        ;;
esac
