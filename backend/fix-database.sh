#!/bin/bash

# Fix database schema - add missing content_text column
echo "Fixing database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    echo "Please set it to: postgresql://username:password@localhost:5432/database_name"
    exit 1
fi

# Run the migration
echo "Running migration to add content_text column..."
psql "$DATABASE_URL" -f migrations/add_content_text_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo "Database schema fix completed!"
