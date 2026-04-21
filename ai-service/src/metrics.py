"""
AI Service Metrics - Production-ready observability
Tracks AI requests, failures, response times, and performance
"""

import time
import logging
from typing import Dict, Any, Optional
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import threading

logger = logging.getLogger(__name__)

class AIMetrics:
    """Production-ready AI service metrics"""
    
    def __init__(self):
        # Custom registry for AI metrics
        self.registry = CollectorRegistry()
        
        # Request metrics
        self.ai_requests_total = Counter(
            'ai_requests_total',
            'Total number of AI requests',
            ['endpoint', 'status'],
            registry=self.registry
        )
        
        self.ai_failures_total = Counter(
            'ai_failures_total',
            'Total number of AI failures',
            ['endpoint', 'error_type'],
            registry=self.registry
        )
        
        # Response time metrics
        self.ai_response_time_seconds = Histogram(
            'ai_response_time_seconds',
            'AI response time in seconds',
            ['endpoint'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            registry=self.registry
        )
        
        # Gemini API specific metrics
        self.gemini_requests_total = Counter(
            'gemini_requests_total',
            'Total number of Gemini API requests',
            ['status'],
            registry=self.registry
        )
        
        self.gemini_response_time_seconds = Histogram(
            'gemini_response_time_seconds',
            'Gemini API response time in seconds',
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            registry=self.registry
        )
        
        # Fallback metrics
        self.fallback_usage_total = Counter(
            'fallback_usage_total',
            'Total number of fallback responses',
            ['endpoint'],
            registry=self.registry
        )
        
        # Active connections gauge
        self.active_connections = Gauge(
            'active_connections',
            'Number of active connections',
            registry=self.registry
        )
        
        # Memory usage gauge
        self.memory_usage_bytes = Gauge(
            'memory_usage_bytes',
            'Memory usage in bytes',
            registry=self.registry
        )
        
        # Thread-safe metrics storage
        self._lock = threading.Lock()
        self._request_counts: Dict[str, int] = {}
        self._error_counts: Dict[str, int] = {}
        
        # Start memory monitoring
        self._start_memory_monitoring()
    
    def record_ai_request(self, endpoint: str, status: str, response_time: float):
        """Record AI request metrics"""
        try:
            with self._lock:
                # Update counters
                self.ai_requests_total.labels(endpoint=endpoint, status=status).inc()
                
                # Update response time histogram
                self.ai_response_time_seconds.labels(endpoint=endpoint).observe(response_time)
                
                # Track request counts
                key = f"{endpoint}:{status}"
                self._request_counts[key] = self._request_counts.get(key, 0) + 1
                
                # Log slow responses
                if response_time > 5.0:
                    logger.warning(f"Slow AI response: {endpoint} took {response_time:.2f}s")
                
                logger.debug(f"Recorded AI request: {endpoint} - {status} - {response_time:.2f}s")
                
        except Exception as e:
            logger.error(f"Failed to record AI request metrics: {str(e)}")
    
    def record_ai_failure(self, endpoint: str, error_type: str, error_message: str):
        """Record AI failure metrics"""
        try:
            with self._lock:
                # Update failure counter
                self.ai_failures_total.labels(endpoint=endpoint, error_type=error_type).inc()
                
                # Track error counts
                key = f"{endpoint}:{error_type}"
                self._error_counts[key] = self._error_counts.get(key, 0) + 1
                
                logger.warning(f"AI failure recorded: {endpoint} - {error_type} - {error_message}")
                
        except Exception as e:
            logger.error(f"Failed to record AI failure metrics: {str(e)}")
    
    def record_gemini_request(self, status: str, response_time: float):
        """Record Gemini API request metrics"""
        try:
            # Update Gemini counters
            self.gemini_requests_total.labels(status=status).inc()
            self.gemini_response_time_seconds.observe(response_time)
            
            # Log slow Gemini responses
            if response_time > 10.0:
                logger.warning(f"Slow Gemini response: {response_time:.2f}s")
                
        except Exception as e:
            logger.error(f"Failed to record Gemini request metrics: {str(e)}")
    
    def record_fallback_usage(self, endpoint: str):
        """Record fallback usage metrics"""
        try:
            self.fallback_usage_total.labels(endpoint=endpoint).inc()
            logger.info(f"Fallback used for endpoint: {endpoint}")
        except Exception as e:
            logger.error(f"Failed to record fallback usage metrics: {str(e)}")
    
    def increment_active_connections(self):
        """Increment active connections"""
        try:
            self.active_connections.inc()
        except Exception as e:
            logger.error(f"Failed to increment active connections: {str(e)}")
    
    def decrement_active_connections(self):
        """Decrement active connections"""
        try:
            self.active_connections.dec()
        except Exception as e:
            logger.error(f"Failed to decrement active connections: {str(e)}")
    
    def update_memory_usage(self):
        """Update memory usage gauge"""
        try:
            import psutil
            process = psutil.Process()
            memory_bytes = process.memory_info().rss
            self.memory_usage_bytes.set(memory_bytes)
        except Exception as e:
            logger.error(f"Failed to update memory usage: {str(e)}")
    
    def _start_memory_monitoring(self):
        """Start background memory monitoring"""
        def monitor_memory():
            while True:
                try:
                    self.update_memory_usage()
                    time.sleep(10)  # Update every 10 seconds
                except Exception as e:
                    logger.error(f"Memory monitoring error: {str(e)}")
                    time.sleep(30)  # Wait longer if there's an error
        
        import threading
        monitor_thread = threading.Thread(target=monitor_memory, daemon=True)
        monitor_thread.start()
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of metrics for health checks"""
        try:
            with self._lock:
                total_requests = sum(self._request_counts.values())
                total_failures = sum(self._error_counts.values())
                success_rate = ((total_requests - total_failures) / total_requests * 100) if total_requests > 0 else 100
                
                return {
                    "total_requests": total_requests,
                    "total_failures": total_failures,
                    "success_rate": round(success_rate, 2),
                    "active_connections": self.active_connections._value.get(),
                    "memory_usage_mb": round(self.memory_usage_bytes._value.get() / 1024 / 1024, 2),
                    "request_counts": dict(self._request_counts),
                    "error_counts": dict(self._error_counts)
                }
        except Exception as e:
            logger.error(f"Failed to get metrics summary: {str(e)}")
            return {
                "error": str(e),
                "total_requests": 0,
                "total_failures": 0,
                "success_rate": 0
            }
    
    def get_prometheus_metrics(self) -> str:
        """Get Prometheus-formatted metrics"""
        try:
            return self.registry.generate_latest()
        except Exception as e:
            logger.error(f"Failed to generate Prometheus metrics: {str(e)}")
            return "# Error generating metrics\n"
    
    def reset_metrics(self):
        """Reset all metrics (for testing)"""
        try:
            with self._lock:
                self._request_counts.clear()
                self._error_counts.clear()
                
                # Reset Prometheus metrics
                self.ai_requests_total.clear()
                self.ai_failures_total.clear()
                self.gemini_requests_total.clear()
                self.fallback_usage_total.clear()
                
                logger.info("All metrics have been reset")
        except Exception as e:
            logger.error(f"Failed to reset metrics: {str(e)}")

# Global metrics instance
ai_metrics = AIMetrics()
