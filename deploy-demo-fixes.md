# Deploy Demo AI Fixes to Production

The production pods are still running the old code without the demo AI functionality. Run these commands to update the deployments:

## 1. Restart Frontend Deployment
```bash
kubectl rollout restart deployment/frontend-prod -n career-coach-prod
```

## 2. Restart Backend Deployment  
```bash
kubectl rollout restart deployment/backend-prod -n career-coach-prod
```

## 3. Restart AI Service Deployment
```bash
kubectl rollout restart deployment/ai-service-prod -n career-coach-prod
```

## 4. Check Deployment Status
```bash
kubectl get pods -n career-coach-prod
```

## 5. Check Logs (if needed)
```bash
kubectl logs -f deployment/frontend-prod -n career-coach-prod
kubectl logs -f deployment/backend-prod -n career-coach-prod
```

## What This Fixes

✅ **Frontend Demo AI Service** - Adds fallback demo AI responses when backend is unavailable
✅ **Career Chat Page** - Uses demo AI service when Gemini API fails  
✅ **Career Service** - Provides demo career recommendations when backend fails
✅ **API Connection** - Updated to connect to correct backend port
✅ **Error Handling** - Seamless fallback to demo mode with user notification

## Expected Result

After restarting the deployments, when users ask questions like "How do I prepare for a technical interview?", they should get intelligent demo AI responses instead of "Gemini API request failed: 400 Bad Request" errors.

The system will automatically:
1. Try to connect to the backend AI service
2. If that fails, use the frontend demo AI service
3. Show a subtle "Demo mode: AI responses are simulated for demonstration" notification
4. Provide realistic, helpful responses about interview preparation
