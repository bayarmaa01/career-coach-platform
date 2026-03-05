#!/bin/bash

# Download spaCy model at startup if not available
if ! python -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null; then
    echo "Downloading spaCy model..."
    python -m spacy download en_core_web_sm
fi

# Try to import spaCy, if fails use simple processor
if ! python -c "import spacy" 2>/dev/null; then
    echo "SpaCy not available, using simple processor..."
    export USE_SIMPLE_PROCESSOR=true
fi

# Start application
if [ "$USE_SIMPLE_PROCESSOR" = "true" ]; then
    exec uvicorn main:app --host 0.0.0.0 --port 8000 "$@"
else
    exec uvicorn main:app --host 0.0.0.0 --port 8000 "$@"
fi
