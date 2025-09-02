#!/bin/bash

# Migration validation script for CI/CD
set -e

echo "🔍 Validating Supabase migrations..."

MIGRATIONS_DIR="supabase/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "❌ Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo "⚠️ No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

echo "Found $MIGRATION_COUNT migration file(s)"

# Validate migration file naming convention
echo "Checking migration file naming..."
for file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$file")
  
  # Check if filename follows pattern: XXX_description.sql
  if [[ ! "$filename" =~ ^[0-9]{3}_[a-z_]+\.sql$ ]]; then
    echo "⚠️ Warning: $filename doesn't follow naming convention (XXX_description.sql)"
  fi
done

# Check for duplicate migration numbers
echo "Checking for duplicate migration numbers..."
duplicates=$(ls -1 "$MIGRATIONS_DIR"/*.sql | xargs -n1 basename | cut -d'_' -f1 | sort | uniq -d)
if [ -n "$duplicates" ]; then
  echo "❌ Duplicate migration numbers found: $duplicates"
  exit 1
fi

# Validate SQL syntax (basic checks)
echo "Performing basic SQL validation..."
for file in "$MIGRATIONS_DIR"/*.sql; do
  filename=$(basename "$file")
  echo "  Checking $filename..."
  
  # Check for common SQL issues
  if grep -q "DROP TABLE.*CASCADE" "$file"; then
    echo "  ⚠️ Warning: Found DROP TABLE CASCADE in $filename - ensure this is intentional"
  fi
  
  if grep -q "DELETE FROM" "$file" && ! grep -q "WHERE" "$file"; then
    echo "  ⚠️ Warning: Found DELETE without WHERE clause in $filename"
  fi
  
  # Check for transaction blocks
  if ! grep -q "BEGIN;" "$file" && ! grep -q "COMMIT;" "$file"; then
    echo "  ℹ️ Note: $filename doesn't use explicit transaction blocks"
  fi
  
  # Check for RLS policies
  if grep -q "CREATE TABLE" "$file" && ! grep -q "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" "$file"; then
    echo "  ⚠️ Warning: Table created without RLS enabled in $filename"
  fi
done

# Check migration order
echo "Verifying migration sequence..."
expected=1
for file in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
  num=$(basename "$file" | cut -d'_' -f1 | sed 's/^0*//')
  if [ "$num" -ne "$expected" ]; then
    echo "⚠️ Warning: Gap in migration sequence. Expected $expected, found $num"
  fi
  expected=$((num + 1))
done

echo "✅ Migration validation completed"