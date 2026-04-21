#!/bin/bash

# Production-safe secret management for Career Coach Platform
# Senior DevOps Engineer - Production-Grade Automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NAMESPACE="career-coach-prod"
SECRETS_FILE="k8s/career-coach-prod/secrets.yaml"

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to safely update or create secrets
update_secrets() {
    local gemini_api_key="${1:-}"
    local project_name="${2:-projects/583354103787}"
    local project_number="${3:-583354103787}"
    
    if [ -z "$gemini_api_key" ]; then
        print_error "Gemini API key is required"
        echo "Usage: $0 <gemini_api_key> [project_name] [project_number]"
        exit 1
    fi
    
    print_info "Updating Kubernetes secrets..."
    
    # Create secrets file with stringData (no base64 encoding needed)
    cat > "$SECRETS_FILE" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: $NAMESPACE
type: Opaque
stringData:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: adminpassword
  REDIS_PASSWORD: redispassword
  JWT_SECRET: super_secret_jwt_token_key_for_production
  GEMINI_API_KEY: $gemini_api_key
  GEMINI_PROJECT_NAME: $project_name
  GEMINI_PROJECT_NUMBER: $project_number
  AI_MODEL_API_KEY: $gemini_api_key
EOF

    # Apply secrets safely
    if kubectl apply -f "$SECRETS_FILE"; then
        print_success "Secrets updated successfully"
        
        # Restart AI service to pick up new secrets
        print_info "Restarting AI service..."
        kubectl rollout restart deployment/ai-service-prod -n $NAMESPACE
        
        # Wait for rollout to complete
        print_info "Waiting for AI service to be ready..."
        kubectl wait --for=condition=available deployment/ai-service-prod -n $NAMESPACE --timeout=120s
        
        # Verify environment variables
        print_info "Verifying Gemini environment variables..."
        if kubectl exec -it deployment/ai-service-prod -n $NAMESPACE -- printenv | grep -q "GEMINI_API_KEY"; then
            print_success "Gemini API key is properly configured"
        else
            print_error "Gemini API key not found in environment"
        fi
        
        # Test AI service health
        print_info "Testing AI service health..."
        if kubectl exec -it deployment/ai-service-prod -n $NAMESPACE -- curl -f http://localhost:5100/health >/dev/null 2>&1; then
            print_success "AI service is healthy"
        else
            print_warning "AI service health check failed"
        fi
        
    else
        print_error "Failed to apply secrets"
        exit 1
    fi
}

# Function to verify current secrets
verify_secrets() {
    print_info "Verifying current secrets..."
    
    if kubectl get secret app-secrets -n $NAMESPACE >/dev/null 2>&1; then
        print_success "Secret exists"
        
        # Check for Gemini API key
        if kubectl get secret app-secrets -n $NAMESPACE -o jsonpath='{.data.GEMINI_API_KEY}' 2>/dev/null | grep -q "."; then
            print_success "Gemini API key is configured"
        else
            print_warning "Gemini API key is missing"
        fi
        
        # Show current keys (without values)
        print_info "Current configured keys:"
        kubectl get secret app-secrets -n $NAMESPACE -o jsonpath='{.data.keys}' | tr ' ' '\n' | sed 's/^/  - /'
        
    else
        print_error "Secret app-secrets not found in namespace $NAMESPACE"
    fi
}

# Function to backup secrets
backup_secrets() {
    local backup_file="secrets-backup-$(date +%Y%m%d-%H%M%S).yaml"
    
    if kubectl get secret app-secrets -n $NAMESPACE -o yaml > "$backup_file" 2>/dev/null; then
        print_success "Secrets backed up to $backup_file"
    else
        print_error "Failed to backup secrets"
    fi
}

# Main execution
main() {
    case "${1:-}" in
        "update")
            update_secrets "$2" "$3" "$4"
            ;;
        "verify")
            verify_secrets
            ;;
        "backup")
            backup_secrets
            ;;
        "help"|"-h"|"--help")
            echo "Career Coach Platform - Secret Management"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  update <api_key> [project_name] [project_number]  Update secrets"
            echo "  verify                                      Verify current secrets"
            echo "  backup                                      Backup current secrets"
            echo "  help                                        Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 update AIzaSyDiLz-GvOPpmLVxDH8nMBK99mkvQQyzyQ0"
            echo "  $0 verify"
            echo "  $0 backup"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
