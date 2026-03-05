#!/bin/bash

# Download spaCy model at startup if not available
if ! python -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null; then
    echo "Downloading spaCy model..."
    python -m spacy download en_core_web_sm
fi

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port 8000 "$@"
