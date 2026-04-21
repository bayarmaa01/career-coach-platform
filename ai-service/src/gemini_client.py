"""
Enhanced Gemini API Client with Retry Logic, Timeout Handling, and Observability
Production-ready implementation for Career Coach Platform
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GeminiAPIClient:
    """Production-ready Gemini API client with retry logic and observability"""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY') or os.getenv('AI_MODEL_API_KEY')
        self.project_name = os.getenv('GEMINI_PROJECT_NAME')
        self.project_number = os.getenv('GEMINI_PROJECT_NUMBER')
        self.model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        self.timeout = int(os.getenv('GEMINI_TIMEOUT', '30'))
        self.max_retries = int(os.getenv('GEMINI_MAX_RETRIES', '3'))
        self.base_url = 'https://generativelanguage.googleapis.com/v1beta'
        
        # Metrics tracking
        self.metrics = {
            'requests_total': 0,
            'requests_success': 0,
            'requests_failed': 0,
            'total_latency': 0,
            'avg_latency': 0
        }
        
        # Validate configuration
        self._validate_config()
        
        # Setup session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        
        logger.info(f"Gemini client initialized - Model: {self.model}, Timeout: {self.timeout}s, Max Retries: {self.max_retries}")
    
    def _validate_config(self):
        """Validate required environment variables"""
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY or AI_MODEL_API_KEY environment variable is required")
        
        if not self.project_name:
            logger.warning("GEMINI_PROJECT_NAME not set, using default")
        
        if not self.project_number:
            logger.warning("GEMINI_PROJECT_NUMBER not set, using default")
    
    def _update_metrics(self, success: bool, latency: float):
        """Update request metrics"""
        self.metrics['requests_total'] += 1
        if success:
            self.metrics['requests_success'] += 1
        else:
            self.metrics['requests_failed'] += 1
        
        self.metrics['total_latency'] += latency
        self.metrics['avg_latency'] = self.metrics['total_latency'] / self.metrics['requests_total']
        
        logger.info(f"Metrics: {self.metrics}")
    
    def _make_request(self, prompt: str, retry_count: int = 0) -> Optional[str]:
        """Make API request with timeout and error handling"""
        start_time = time.time()
        
        try:
            url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 1024,
                }
            }
            
            response = self.session.post(
                url,
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            latency = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'candidates' in data and len(data['candidates']) > 0:
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    self._update_metrics(True, latency)
                    logger.info(f"Gemini API request successful - Latency: {latency:.2f}s")
                    return content
                else:
                    logger.error(f"Invalid response format: {data}")
                    self._update_metrics(False, latency)
                    return None
            else:
                logger.error(f"Gemini API error - Status: {response.status_code}, Response: {response.text}")
                self._update_metrics(False, latency)
                return None
                
        except requests.exceptions.Timeout:
            latency = time.time() - start_time
            logger.error(f"Gemini API timeout after {latency:.2f}s")
            self._update_metrics(False, latency)
            return None
            
        except requests.exceptions.RequestException as e:
            latency = time.time() - start_time
            logger.error(f"Gemini API request failed: {str(e)}")
            self._update_metrics(False, latency)
            return None
    
    def generate_content(self, prompt: str) -> Optional[str]:
        """Generate content with retry logic"""
        for attempt in range(self.max_retries):
            logger.info(f"Gemini API request attempt {attempt + 1}/{self.max_retries}")
            
            result = self._make_request(prompt, attempt)
            if result:
                return result
            
            if attempt < self.max_retries - 1:
                # Exponential backoff
                backoff_time = 2 ** attempt
                logger.info(f"Retrying in {backoff_time} seconds...")
                time.sleep(backoff_time)
        
        logger.error(f"All {self.max_retries} attempts failed for Gemini API request")
        return None
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        return self.metrics.copy()
    
    def health_check(self) -> Dict[str, Any]:
        """Health check endpoint"""
        try:
            # Simple test prompt
            test_result = self.generate_content("Respond with 'OK' only")
            if test_result and "OK" in test_result:
                return {
                    "status": "healthy",
                    "api_key_configured": bool(self.api_key),
                    "model": self.model,
                    "metrics": self.metrics
                }
            else:
                return {
                    "status": "unhealthy",
                    "error": "API test failed"
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global instance
gemini_client = GeminiAPIClient()
