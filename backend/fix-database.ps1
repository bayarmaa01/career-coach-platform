# Fix database schema - add missing content_text column
Write-Host "Fixing database schema..."

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "Error: DATABASE_URL environment variable is not set"
    Write-Host "Please set it to: postgresql://username:password@localhost:5432/database_name"
    exit 1
}

# Run the migration
Write-Host "Running migration to add content_text column..."
$env:PGPASSWORD = (ConvertFrom-SecureString $env:DATABASE_URL -AsPlainText).Split(':')[2].Split('@')[0]

try {
    psql $env:DATABASE_URL -f migrations/add_content_text_column.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully"
    } else {
        Write-Host "❌ Migration failed"
        exit 1
    }
} catch {
    Write-Host "❌ Migration failed: $_"
    exit 1
}

Write-Host "Database schema fix completed!"
