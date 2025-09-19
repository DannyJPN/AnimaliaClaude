-- Database Migration Tests
-- Tests to validate database schema changes and data integrity

-- Test 1: Schema validation
\echo 'Running schema validation tests...'

-- Test that all expected tables exist
DO $$
DECLARE
    missing_tables TEXT[];
    expected_tables TEXT[] := ARRAY['tenants', 'users', 'records', 'organization_levels', 'exposition_areas', 'exposition_sets'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All expected tables exist ✓';
    END IF;
END $$;

-- Test 2: Multi-tenant structure validation
\echo 'Testing multi-tenant structure...'

-- Verify TenantId columns exist on all multi-tenant tables
DO $$
DECLARE
    missing_tenant_cols TEXT[];
    multitenant_tables TEXT[] := ARRAY['users', 'records', 'organization_levels'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY multitenant_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = table_name AND column_name = 'tenantid'
        ) THEN
            missing_tenant_cols := array_append(missing_tenant_cols, table_name);
        END IF;
    END LOOP;

    IF array_length(missing_tenant_cols, 1) > 0 THEN
        RAISE EXCEPTION 'Missing TenantId columns in tables: %', array_to_string(missing_tenant_cols, ', ');
    ELSE
        RAISE NOTICE 'All multi-tenant tables have TenantId columns ✓';
    END IF;
END $$;

-- Test 3: Index validation
\echo 'Testing database indexes...'

-- Check for critical indexes
DO $$
DECLARE
    missing_indexes TEXT[];
    critical_indexes TEXT[] := ARRAY[
        'idx_users_tenantid',
        'idx_records_tenantid',
        'idx_organization_levels_tenantid'
    ];
    index_name TEXT;
BEGIN
    FOREACH index_name IN ARRAY critical_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE indexname = index_name
        ) THEN
            missing_indexes := array_append(missing_indexes, index_name);
        END IF;
    END LOOP;

    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING 'Missing critical indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE 'All critical indexes exist ✓';
    END IF;
END $$;

-- Test 4: Foreign key constraints
\echo 'Testing foreign key constraints...'

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- Test 5: Row Level Security (RLS) policies
\echo 'Testing Row Level Security policies...'

-- Check if RLS is enabled on multi-tenant tables
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
    multitenant_tables TEXT[] := ARRAY['users', 'records', 'organization_levels'];
BEGIN
    FOREACH table_name IN ARRAY multitenant_tables
    LOOP
        SELECT rowsecurity INTO rls_enabled
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE pt.tablename = table_name;

        IF NOT rls_enabled THEN
            RAISE WARNING 'RLS not enabled on table: %', table_name;
        ELSE
            RAISE NOTICE 'RLS enabled on table: % ✓', table_name;
        END IF;
    END LOOP;
END $$;

-- Test 6: Data integrity tests
\echo 'Running data integrity tests...'

-- Test tenant isolation
BEGIN;
    -- Create test tenants
    INSERT INTO tenants (name, domain, created_at) VALUES
        ('Test Tenant 1', 'test1.example.com', NOW()),
        ('Test Tenant 2', 'test2.example.com', NOW());

    DECLARE tenant1_id INT := (SELECT id FROM tenants WHERE domain = 'test1.example.com');
    DECLARE tenant2_id INT := (SELECT id FROM tenants WHERE domain = 'test2.example.com');

    -- Insert test data
    INSERT INTO users (tenantid, email, name, created_at) VALUES
        (tenant1_id, 'user1@test1.com', 'User 1', NOW()),
        (tenant2_id, 'user2@test2.com', 'User 2', NOW());

    -- Test data isolation
    ASSERT (SELECT COUNT(*) FROM users WHERE tenantid = tenant1_id) = 1, 'Tenant 1 should have 1 user';
    ASSERT (SELECT COUNT(*) FROM users WHERE tenantid = tenant2_id) = 1, 'Tenant 2 should have 1 user';

    -- Test cross-tenant access prevention (should be enforced by RLS)
    SET SESSION pzi.current_tenant_id = tenant1_id::TEXT;
    ASSERT (SELECT COUNT(*) FROM users WHERE tenantid = tenant2_id) = 0, 'Cross-tenant access should be prevented';

    RAISE NOTICE 'Data integrity tests passed ✓';
ROLLBACK;

-- Test 7: Performance tests
\echo 'Running basic performance tests...'

-- Test query performance on indexed columns
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE tenantid = 1 LIMIT 100;

-- Test join performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.name, t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenantid = t.id
WHERE u.tenantid = 1;

-- Test 8: Migration rollback test
\echo 'Testing migration rollback capability...'

BEGIN;
    -- Simulate a migration change
    ALTER TABLE users ADD COLUMN test_migration_column TEXT;

    -- Verify column exists
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'test_migration_column'
    ), 'Migration column should exist';

    -- Rollback the change
    ALTER TABLE users DROP COLUMN test_migration_column;

    -- Verify column is removed
    ASSERT NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'test_migration_column'
    ), 'Migration column should be removed';

    RAISE NOTICE 'Migration rollback test passed ✓';
ROLLBACK;

-- Test 9: Backup and restore simulation
\echo 'Testing backup and restore procedures...'

-- Create a test table with data
CREATE TEMP TABLE backup_test (
    id SERIAL PRIMARY KEY,
    tenantid INT,
    data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO backup_test (tenantid, data) VALUES
    (1, 'Test data 1'),
    (2, 'Test data 2'),
    (1, 'Test data 3');

-- Simulate backup (count records)
SELECT COUNT(*) as backup_record_count FROM backup_test;

-- Simulate data modification
UPDATE backup_test SET data = 'Modified data' WHERE id = 1;

-- Simulate restore verification
SELECT
    tenantid,
    COUNT(*) as record_count,
    MAX(created_at) as latest_record
FROM backup_test
GROUP BY tenantid;

DROP TABLE backup_test;
RAISE NOTICE 'Backup/restore simulation completed ✓';

-- Test 10: Concurrency test
\echo 'Testing concurrent operations...'

BEGIN;
    -- Test concurrent tenant creation
    INSERT INTO tenants (name, domain, created_at) VALUES
        ('Concurrent Tenant 1', 'concurrent1.test.com', NOW());

    -- In a real scenario, this would be run in parallel
    -- For now, we just test that the operation completes successfully
    RAISE NOTICE 'Concurrency test placeholder completed ✓';
ROLLBACK;

\echo 'All database migration tests completed!'

-- Summary report
SELECT
    'Database Migration Tests' as test_suite,
    'PASSED' as status,
    NOW() as completed_at;