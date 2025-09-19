#!/usr/bin/env node

/**
 * Auth0 User Migration Script
 *
 * This script migrates users from the existing Active Directory system to Auth0.
 * It handles user creation, role assignment, and organization membership.
 *
 * Usage: node migrate-users-to-auth0.js [options]
 *
 * Required Environment Variables:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain
 * - AUTH0_M2M_CLIENT_ID: Machine-to-Machine application client ID
 * - AUTH0_M2M_CLIENT_SECRET: Machine-to-Machine application client secret
 * - PZI_DB_CONNECTION_STRING: PostgreSQL connection string (optional, for user export)
 */

const { ManagementClient } = require('auth0');
const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  auth0: {
    domain: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
    clientId: process.env.AUTH0_M2M_CLIENT_ID,
    clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
    scope: 'create:users update:users read:users create:organization_members read:organizations'
  },
  database: {
    connectionString: process.env.PZI_DB_CONNECTION_STRING
  }
};

// Initialize Auth0 Management Client
const management = new ManagementClient(config.auth0);

// Organization mappings
const ORGANIZATIONS = {
  'zoo-praha': {
    id: null, // Will be populated from Auth0
    domains: ['zoopraha.cz', 'prague-zoo.cz']
  },
  'zoo-brno': {
    id: null,
    domains: ['zoobrno.cz', 'brno-zoo.cz']
  },
  'default': {
    id: null,
    domains: ['pzi.cz']
  }
};

// Role mappings from AD groups to Auth0 roles
const ROLE_MAPPINGS = {
  'CN=Zoo-Admins': ['admin'],
  'CN=Zoo-Curators': ['curator'],
  'CN=Zoo-Vets': ['veterinarian'],
  'CN=Zoo-Users': ['user'],
  'CN=Zoo-Documentation': ['documentation'],
  'Administrators': ['admin'],
  'Curators': ['curator'],
  'Veterinarians': ['veterinarian'],
  'Users': ['user']
};

// Permission mappings based on roles
const PERMISSION_MAPPINGS = {
  'admin': ['records:view', 'records:edit', 'lists:view', 'lists:edit', 'journal:access', 'documentation:access'],
  'curator': ['records:view', 'records:edit', 'lists:view', 'journal:access'],
  'veterinarian': ['records:view', 'journal:access'],
  'user': ['records:view'],
  'documentation': ['documentation:access']
};

/**
 * Load users from CSV file or database
 */
async function loadUsersToMigrate() {
  const csvPath = path.join(__dirname, 'users-to-migrate.csv');

  try {
    // Try to load from CSV first
    const csvData = await fs.readFile(csvPath, 'utf-8');
    console.log('Loading users from CSV file...');
    return parseCSVUsers(csvData);
  } catch (error) {
    console.log('CSV file not found, attempting to load from database...');

    if (config.database.connectionString) {
      return await loadUsersFromDatabase();
    } else {
      throw new Error('No user source available. Provide either users-to-migrate.csv or PZI_DB_CONNECTION_STRING');
    }
  }
}

/**
 * Parse users from CSV data
 */
function parseCSVUsers(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const user = {};

    headers.forEach((header, index) => {
      user[header] = values[index] || '';
    });

    return user;
  });
}

/**
 * Load users from PZI database
 */
async function loadUsersFromDatabase() {
  const client = new Client({ connectionString: config.database.connectionString });

  try {
    await client.connect();

    const query = `
      SELECT
        u.email,
        u.name,
        u.first_name as given_name,
        u.last_name as family_name,
        array_agg(r.name) as roles,
        u.department,
        u.last_login,
        u.active
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.active = true
      GROUP BY u.id, u.email, u.name, u.first_name, u.last_name, u.department, u.last_login, u.active
    `;

    const result = await client.query(query);
    console.log(`Loaded ${result.rows.length} users from database`);

    return result.rows;
  } finally {
    await client.end();
  }
}

/**
 * Get or create organizations in Auth0
 */
async function setupOrganizations() {
  console.log('Setting up organizations...');

  try {
    const existingOrgs = await management.getOrganizations();

    for (const [orgKey, orgConfig] of Object.entries(ORGANIZATIONS)) {
      const existing = existingOrgs.find(org => org.name === orgKey);

      if (existing) {
        ORGANIZATIONS[orgKey].id = existing.id;
        console.log(`Found existing organization: ${orgKey} (${existing.id})`);
      } else {
        const newOrg = await management.createOrganization({
          name: orgKey,
          display_name: orgKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          branding: {
            logo_url: `https://your-domain.com/logos/${orgKey}.png`
          }
        });

        ORGANIZATIONS[orgKey].id = newOrg.id;
        console.log(`Created organization: ${orgKey} (${newOrg.id})`);
      }
    }
  } catch (error) {
    console.error('Error setting up organizations:', error);
    throw error;
  }
}

/**
 * Determine tenant from email domain
 */
function determineTenant(email) {
  if (!email) return 'default';

  const domain = email.split('@')[1]?.toLowerCase();

  for (const [tenantKey, tenantConfig] of Object.entries(ORGANIZATIONS)) {
    if (tenantConfig.domains.includes(domain)) {
      return tenantKey;
    }
  }

  return 'default';
}

/**
 * Map AD groups to Auth0 roles
 */
function mapRoles(adGroups) {
  if (!Array.isArray(adGroups)) {
    adGroups = typeof adGroups === 'string' ? [adGroups] : [];
  }

  const roles = new Set();

  adGroups.forEach(group => {
    const normalizedGroup = group.split(',')[0]; // Take first part of DN
    const mappedRoles = ROLE_MAPPINGS[normalizedGroup];

    if (mappedRoles) {
      mappedRoles.forEach(role => roles.add(role));
    }
  });

  // Default to 'user' role if no roles found
  if (roles.size === 0) {
    roles.add('user');
  }

  return Array.from(roles);
}

/**
 * Get permissions for roles
 */
function getPermissionsForRoles(roles) {
  const permissions = new Set();

  roles.forEach(role => {
    const rolePermissions = PERMISSION_MAPPINGS[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  });

  return Array.from(permissions);
}

/**
 * Create or update user in Auth0
 */
async function createOrUpdateUser(userData, dryRun = false) {
  const tenant = determineTenant(userData.email);
  const roles = mapRoles(userData.roles || userData.groups || []);
  const permissions = getPermissionsForRoles(roles);

  const auth0User = {
    email: userData.email,
    name: userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim(),
    given_name: userData.given_name,
    family_name: userData.family_name,
    nickname: userData.nickname || userData.email.split('@')[0],
    email_verified: true,
    connection: 'Username-Password-Authentication',
    password: `TempPass${Math.random().toString(36).substring(2)}!`, // Temporary password
    app_metadata: {
      roles: roles,
      permissions: permissions,
      tenant: tenant,
      migrated_from: 'ad',
      migration_date: new Date().toISOString()
    },
    user_metadata: {
      department: userData.department,
      last_ad_login: userData.last_login
    }
  };

  if (dryRun) {
    console.log(`[DRY RUN] Would create user: ${userData.email} with roles: ${roles.join(', ')} in tenant: ${tenant}`);
    return { user_id: 'dry-run-id', email: userData.email };
  }

  try {
    // Check if user already exists
    const existingUsers = await management.getUsersByEmail(userData.email);

    if (existingUsers.length > 0) {
      // Update existing user
      const userId = existingUsers[0].user_id;
      const updatedUser = await management.updateUser({ id: userId }, {
        app_metadata: auth0User.app_metadata,
        user_metadata: auth0User.user_metadata
      });

      console.log(`Updated existing user: ${userData.email}`);
      return updatedUser;
    } else {
      // Create new user
      const newUser = await management.createUser(auth0User);
      console.log(`Created user: ${userData.email} (${newUser.user_id})`);
      return newUser;
    }
  } catch (error) {
    console.error(`Error creating/updating user ${userData.email}:`, error.message);
    return null;
  }
}

/**
 * Assign user to organization
 */
async function assignUserToOrganization(userId, tenant, dryRun = false) {
  const orgId = ORGANIZATIONS[tenant]?.id;

  if (!orgId) {
    console.warn(`No organization ID found for tenant: ${tenant}`);
    return;
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would assign user ${userId} to organization ${tenant} (${orgId})`);
    return;
  }

  try {
    await management.addUsersToOrganization({ id: orgId }, { users: [userId] });
    console.log(`Assigned user ${userId} to organization ${tenant}`);
  } catch (error) {
    // Ignore if user is already in organization
    if (!error.message.includes('already exists')) {
      console.error(`Error assigning user to organization:`, error.message);
    }
  }
}

/**
 * Generate migration report
 */
async function generateMigrationReport(results) {
  const report = {
    total_users: results.length,
    successful_migrations: results.filter(r => r.success).length,
    failed_migrations: results.filter(r => !r.success).length,
    tenant_breakdown: {},
    role_breakdown: {},
    errors: results.filter(r => !r.success).map(r => ({ email: r.email, error: r.error }))
  };

  results.forEach(result => {
    if (result.success) {
      // Tenant breakdown
      const tenant = result.tenant || 'unknown';
      report.tenant_breakdown[tenant] = (report.tenant_breakdown[tenant] || 0) + 1;

      // Role breakdown
      result.roles?.forEach(role => {
        report.role_breakdown[role] = (report.role_breakdown[role] || 0) + 1;
      });
    }
  });

  const reportPath = path.join(__dirname, `migration-report-${new Date().toISOString().split('T')[0]}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== Migration Report ===');
  console.log(`Total Users: ${report.total_users}`);
  console.log(`Successful: ${report.successful_migrations}`);
  console.log(`Failed: ${report.failed_migrations}`);
  console.log('\nTenant Breakdown:');
  Object.entries(report.tenant_breakdown).forEach(([tenant, count]) => {
    console.log(`  ${tenant}: ${count} users`);
  });
  console.log('\nRole Breakdown:');
  Object.entries(report.role_breakdown).forEach(([role, count]) => {
    console.log(`  ${role}: ${count} users`);
  });

  if (report.errors.length > 0) {
    console.log('\nErrors:');
    report.errors.forEach(error => {
      console.log(`  ${error.email}: ${error.error}`);
    });
  }

  console.log(`\nDetailed report saved to: ${reportPath}`);
}

/**
 * Main migration function
 */
async function migrateUsers() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;

  console.log('Starting Auth0 user migration...');
  console.log(`Dry run: ${dryRun}`);
  console.log(`Batch size: ${batchSize}`);

  try {
    // Setup organizations
    if (!dryRun) {
      await setupOrganizations();
    }

    // Load users to migrate
    const users = await loadUsersToMigrate();
    console.log(`Found ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log('No users to migrate');
      return;
    }

    // Process users in batches
    const results = [];

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);

      const batchPromises = batch.map(async (userData) => {
        try {
          const user = await createOrUpdateUser(userData, dryRun);

          if (user) {
            const tenant = determineTenant(userData.email);

            if (!dryRun) {
              await assignUserToOrganization(user.user_id, tenant, dryRun);
            }

            return {
              success: true,
              email: userData.email,
              userId: user.user_id,
              tenant: tenant,
              roles: mapRoles(userData.roles || userData.groups || [])
            };
          } else {
            return {
              success: false,
              email: userData.email,
              error: 'User creation/update failed'
            };
          }
        } catch (error) {
          return {
            success: false,
            email: userData.email,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting - wait between batches
      if (i + batchSize < users.length) {
        console.log('Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Generate report
    await generateMigrationReport(results);

    console.log('\nMigration completed!');

    if (dryRun) {
      console.log('\nThis was a dry run. No actual changes were made.');
      console.log('Run without --dry-run flag to perform the actual migration.');
    } else {
      console.log('\nUsers have been migrated to Auth0.');
      console.log('Next steps:');
      console.log('1. Send password reset emails to users');
      console.log('2. Configure enterprise connections for SSO');
      console.log('3. Test authentication flows');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsers().catch(console.error);
}

module.exports = {
  migrateUsers,
  loadUsersToMigrate,
  createOrUpdateUser,
  setupOrganizations
};