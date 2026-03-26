FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir -r requirements-simple.txt

# Download spaCy model (skip if fails)
RUN python -m spacy download en_core_web_sm || echo "SpaCy model download failed, will use fallback"

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Expose port 5100 (matching service configuration)
EXPOSE 5100

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5100/health || exit 1

# Start the application directly (no entrypoint script)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5100"]
