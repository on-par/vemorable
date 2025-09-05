#!/bin/bash

# Script to check migration status locally
# This mimics the GitHub Actions workflow logic

set -e

echo "==================================="
echo "Migration Status Checker"
echo "==================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it to your Supabase database URL"
    exit 1
fi

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
    echo "ERROR: supabase/migrations directory not found"
    exit 1
fi

# Check if any migrations exist
if [ -z "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    echo "No migration files found in supabase/migrations/"
    exit 0
fi

echo ""
echo "Local migration files:"
echo "----------------------"
for migration_file in supabase/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "  - $(basename "$migration_file")"
    fi
done

echo ""
echo "Checking remote database migration status..."
echo "---------------------------------------------"

# Get list of applied migrations from database
applied_migrations=$(supabase migration list --db-url "$DATABASE_URL" 2>&1 || echo "")

if [ -z "$applied_migrations" ] || echo "$applied_migrations" | grep -q "error"; then
    echo "WARNING: Could not fetch migration status from database"
    echo "Output: $applied_migrations"
    echo ""
    echo "Make sure:"
    echo "1. Supabase CLI is installed"
    echo "2. DATABASE_URL is correct"
    echo "3. You have proper permissions"
    exit 1
fi

echo "$applied_migrations"

echo ""
echo "Analyzing migration status..."
echo "-----------------------------"

# Check which migrations are pending
pending_count=0
pending_migrations=""

for migration_file in supabase/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        migration_name=$(basename "$migration_file")
        
        # Check if this migration is in the applied list
        if ! echo "$applied_migrations" | grep -q "$migration_name"; then
            pending_count=$((pending_count + 1))
            pending_migrations="$pending_migrations\n  - $migration_name"
        fi
    fi
done

echo ""
if [ $pending_count -eq 0 ]; then
    echo "✅ All migrations are already applied to the database"
    echo "No action needed - the GitHub Action will skip migration step"
else
    echo "⚠️  Found $pending_count pending migration(s):"
    echo -e "$pending_migrations"
    echo ""
    echo "These migrations will be applied when the GitHub Action runs"
    
    # Ask if user wants to apply them now
    read -p "Do you want to apply these migrations now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Applying migrations..."
        supabase db push --db-url "$DATABASE_URL"
        echo "✅ Migrations applied successfully"
    else
        echo "Skipped applying migrations"
    fi
fi

echo ""
echo "==================================="
echo "Check complete!"
echo "==================================="