#!/bin/bash

# Fix database schema - add missing content_text column
echo "Fixing database schema..."

# Try to connect to the database and add the missing column
kubectl exec -n career-coach-prod postgres-0 -- psql -U postgres -d career_coach_prod -c "
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS content_text TEXT;
"

echo "Database schema fix completed."
