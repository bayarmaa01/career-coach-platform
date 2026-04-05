#!/bin/bash

# Database Fix Script for Career Coach Platform
# This script manually applies the missing database schema

echo "🔧 Fixing Career Coach Platform Database Schema..."

# Get the PostgreSQL pod name
POSTGRES_POD=$(minikube kubectl -- get pods -n career-coach-prod -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POSTGRES_POD" ]; then
    echo "❌ PostgreSQL pod not found!"
    exit 1
fi

echo "📦 Found PostgreSQL pod: $POSTGRES_POD"

# Apply the missing resumes table
echo "🔨 Creating missing resumes table..."

minikube kubectl -- exec -n career-coach-prod $POSTGRES_POD -- psql -U postgres -d career_coach_prod -c "
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'uploaded',
    analysis_data JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# Create indexes for better performance
echo "📈 Creating indexes..."

minikube kubectl -- exec -n career-coach-prod $POSTGRES_POD -- psql -U postgres -d career_coach_prod -c "
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
"

# Verify the table was created
echo "✅ Verifying table creation..."

TABLE_EXISTS=$(minikube kubectl -- exec -n career-coach-prod $POSTGRES_POD -- psql -U postgres -d career_coach_prod -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'resumes');" | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    echo "✅ Resumes table created successfully!"
else
    echo "❌ Failed to create resumes table!"
    exit 1
fi

# Show table structure
echo "📋 Resumes table structure:"
minikube kubectl -- exec -n career-coach-prod $POSTGRES_POD -- psql -U postgres -d career_coach_prod -c "\d resumes"

echo ""
echo "🎉 Database schema fix completed!"
echo "🔄 Please restart the backend pods to pick up the changes:"
echo "   minikube kubectl -- rollout restart deployment/backend-prod -n career-coach-prod"
