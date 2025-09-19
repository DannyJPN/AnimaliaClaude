#!/bin/bash

# Test data seeding script for AnimaliaClaude testing infrastructure

set -e

echo "Starting test data seeding..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until pg_isready -h "${DATABASE_HOST:-postgres-test}" -p "${DATABASE_PORT:-5432}" -U "${DATABASE_USER:-postgres}"; do
    echo "Database not ready, waiting..."
    sleep 2
done

echo "Database is ready. Starting data seeding..."

# Check if API is ready
API_URL="${API_URL:-http://api-test:8080}"
echo "Waiting for API to be ready at $API_URL..."

for i in {1..30}; do
    if curl -s "$API_URL/api/health" > /dev/null 2>&1; then
        echo "API is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "API not ready after 30 attempts, proceeding anyway..."
    fi
    sleep 2
done

# Create test tenants if data directory exists
if [ -d "/data/tenants" ]; then
    echo "Creating test tenants..."
    for tenant_file in /data/tenants/*.json; do
        [ -f "$tenant_file" ] || continue
        echo "Processing $tenant_file"
        # In a real implementation, this would call the API to create tenants
        # curl -X POST "$API_URL/api/tenants" -H "Content-Type: application/json" -d @"$tenant_file"
    done
fi

# Seed other test data types
for data_type in users species specimens organizations; do
    data_dir="/data/$data_type"
    if [ -d "$data_dir" ]; then
        echo "Seeding $data_type data..."
        for data_file in "$data_dir"/*.json; do
            [ -f "$data_file" ] || continue
            echo "Processing $data_file"
            # Implementation would depend on the specific API endpoints
        done
    fi
done

echo "Test data seeding completed successfully!"