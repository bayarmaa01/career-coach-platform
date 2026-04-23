# PowerShell script to rebuild AI service with Gemini integration

Write-Host "Rebuilding AI service with Gemini integration..."

# Set minikube docker environment (if using minikube)
# minikube docker-env | Invoke-Expression

# Build AI service image
Set-Location ai-service
docker build -t career-coach-ai-service:latest .

Write-Host "AI service image rebuilt successfully!"

# Restart deployment
kubectl rollout restart deployment/ai-service -n career-coach

Write-Host "AI service deployment restarted!"

# Wait for rollout to complete
kubectl rollout status deployment/ai-service -n career-coach --timeout=60s

Write-Host "AI service rollout completed!"
