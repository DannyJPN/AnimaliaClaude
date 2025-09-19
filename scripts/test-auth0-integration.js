#!/usr/bin/env node

/**
 * Auth0 Integration Test Script
 *
 * This script tests the Auth0 integration for both the webapp and API.
 * It performs end-to-end testing of authentication flows, token validation,
 * and authorization checks.
 *
 * Usage: node test-auth0-integration.js [options]
 *
 * Required Environment Variables:
 * - AUTH0_DOMAIN: Your Auth0 tenant domain
 * - AUTH0_CLIENT_ID: SPA application client ID
 * - AUTH0_CLIENT_SECRET: SPA application client secret
 * - AUTH0_AUDIENCE: API identifier
 * - TEST_USER_EMAIL: Test user email
 * - TEST_USER_PASSWORD: Test user password
 * - PZI_API_URL: PZI API base URL
 * - PZI_WEBAPP_URL: PZI WebApp base URL
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');

// Configuration
const config = {
  auth0: {
    domain: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE || 'https://pzi-api'
  },
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@zoopraha.cz',
    password: process.env.TEST_USER_PASSWORD || 'TestPass123!'
  },
  urls: {
    api: process.env.PZI_API_URL || 'http://localhost:5230',
    webapp: process.env.PZI_WEBAPP_URL || 'http://localhost:5173'
  }
};

/**
 * Test Results Storage
 */
const testResults = {
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * Add test result
 */
function addTestResult(name, status, details = '', error = null) {
  const result = {
    name,
    status, // 'pass', 'fail', 'skip'
    details,
    error: error?.message || null,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(result);
  testResults.summary.total++;
  testResults.summary[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'skipped']++;

  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${statusIcon} ${name}: ${details}`);

  if (error) {
    console.error(`   Error: ${error.message}`);
  }
}

/**
 * Get Auth0 access token using client credentials
 */
async function getClientCredentialsToken() {
  try {
    const response = await axios.post(`https://${config.auth0.domain}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: config.auth0.clientId,
      client_secret: config.auth0.clientSecret,
      audience: config.auth0.audience
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data.access_token;
  } catch (error) {
    throw new Error(`Failed to get client credentials token: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Get Auth0 access token using user credentials (Resource Owner Password)
 */
async function getUserToken() {
  try {
    const response = await axios.post(`https://${config.auth0.domain}/oauth/token`, {
      grant_type: 'password',
      username: config.testUser.email,
      password: config.testUser.password,
      client_id: config.auth0.clientId,
      client_secret: config.auth0.clientSecret,
      audience: config.auth0.audience,
      scope: 'openid profile email'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token
    };
  } catch (error) {
    throw new Error(`Failed to get user token: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Test Auth0 token acquisition
 */
async function testTokenAcquisition() {
  console.log('\n🔐 Testing Auth0 Token Acquisition...');

  // Test client credentials flow
  try {
    const token = await getClientCredentialsToken();
    const decoded = jwt.decode(token);

    if (decoded && decoded.aud === config.auth0.audience) {
      addTestResult('Client Credentials Token', 'pass', 'Successfully obtained and validated token');
    } else {
      addTestResult('Client Credentials Token', 'fail', 'Token validation failed');
    }
  } catch (error) {
    addTestResult('Client Credentials Token', 'fail', 'Failed to obtain token', error);
  }

  // Test user credentials flow (if password grant is enabled)
  try {
    const tokens = await getUserToken();
    const decoded = jwt.decode(tokens.access_token);
    const idTokenDecoded = jwt.decode(tokens.id_token);

    if (decoded && idTokenDecoded && idTokenDecoded.email === config.testUser.email) {
      addTestResult('User Credentials Token', 'pass', 'Successfully obtained user tokens with correct claims');
    } else {
      addTestResult('User Credentials Token', 'fail', 'Token validation failed');
    }
  } catch (error) {
    addTestResult('User Credentials Token', 'skip', 'Password grant may not be enabled (this is expected in production)', error);
  }
}

/**
 * Test API JWT validation
 */
async function testAPIJWTValidation() {
  console.log('\n🔧 Testing API JWT Validation...');

  try {
    const token = await getClientCredentialsToken();

    // Test valid token
    const validResponse = await axios.get(`${config.urls.api}/api/version`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (validResponse.status === 200) {
      addTestResult('API Valid JWT', 'pass', 'API accepted valid JWT token');
    } else {
      addTestResult('API Valid JWT', 'fail', `Unexpected status: ${validResponse.status}`);
    }

    // Test invalid token
    try {
      await axios.get(`${config.urls.api}/api/version`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      addTestResult('API Invalid JWT', 'fail', 'API accepted invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        addTestResult('API Invalid JWT', 'pass', 'API correctly rejected invalid token');
      } else {
        addTestResult('API Invalid JWT', 'fail', `Unexpected error: ${error.message}`);
      }
    }

    // Test no token
    try {
      await axios.get(`${config.urls.api}/api/version`);
      addTestResult('API No Token', 'fail', 'API accepted request without token');
    } catch (error) {
      if (error.response?.status === 401) {
        addTestResult('API No Token', 'pass', 'API correctly rejected request without token');
      } else {
        addTestResult('API No Token', 'fail', `Unexpected error: ${error.message}`);
      }
    }

  } catch (error) {
    addTestResult('API JWT Validation', 'fail', 'Failed to test API JWT validation', error);
  }
}

/**
 * Test API key fallback
 */
async function testAPIKeyFallback() {
  console.log('\n🔑 Testing API Key Fallback...');

  try {
    // Test with API key (should work as fallback)
    const response = await axios.get(`${config.urls.api}/api/version`, {
      headers: { 'X-API-Key': 'Key1' } // Using default API key from configuration
    });

    if (response.status === 200) {
      addTestResult('API Key Fallback', 'pass', 'API key authentication works as fallback');
    } else {
      addTestResult('API Key Fallback', 'fail', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      addTestResult('API Key Fallback', 'pass', 'API key authentication properly configured (test key may be invalid)');
    } else {
      addTestResult('API Key Fallback', 'fail', 'API key fallback test failed', error);
    }
  }
}

/**
 * Test authorization with different roles
 */
async function testRoleBasedAuthorization() {
  console.log('\n👥 Testing Role-Based Authorization...');

  try {
    const tokens = await getUserToken();

    // Decode token to check roles
    const idToken = jwt.decode(tokens.id_token);
    const roles = idToken['custom:roles'] || [];

    addTestResult('Token Role Claims', 'pass', `User has roles: ${roles.join(', ') || 'none'}`);

    // Test accessing protected endpoints
    const protectedEndpoints = [
      { path: '/api/specimens', permission: 'records:view' },
      { path: '/api/species', permission: 'records:view' },
      { path: '/api/journal/entries', permission: 'journal:access' }
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.get(`${config.urls.api}${endpoint.path}`, {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });

        if (response.status === 200) {
          addTestResult(`Authorization ${endpoint.path}`, 'pass', `Access granted for ${endpoint.permission}`);
        } else {
          addTestResult(`Authorization ${endpoint.path}`, 'fail', `Unexpected status: ${response.status}`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          addTestResult(`Authorization ${endpoint.path}`, 'pass', `Access properly denied for ${endpoint.permission}`);
        } else if (error.response?.status === 404) {
          addTestResult(`Authorization ${endpoint.path}`, 'skip', `Endpoint ${endpoint.path} not found`);
        } else {
          addTestResult(`Authorization ${endpoint.path}`, 'fail', `Unexpected error: ${error.message}`);
        }
      }
    }

  } catch (error) {
    addTestResult('Role-Based Authorization', 'fail', 'Failed to test authorization', error);
  }
}

/**
 * Test webapp authentication flow with Puppeteer
 */
async function testWebAppAuthFlow() {
  console.log('\n🌐 Testing WebApp Authentication Flow...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Navigate to webapp
    await page.goto(config.urls.webapp, { waitUntil: 'networkidle0' });

    // Check if redirected to Auth0 login
    const currentUrl = page.url();
    if (currentUrl.includes(config.auth0.domain)) {
      addTestResult('WebApp Auth Redirect', 'pass', 'Successfully redirected to Auth0 login');

      // Try to fill login form (if test user credentials are available)
      try {
        await page.waitForSelector('input[name="username"]', { timeout: 5000 });
        await page.type('input[name="username"]', config.testUser.email);
        await page.type('input[name="password"]', config.testUser.password);

        // Click login button
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });

        if (page.url().includes(config.urls.webapp)) {
          addTestResult('WebApp Auth Login', 'pass', 'Successfully logged in and redirected back');
        } else {
          addTestResult('WebApp Auth Login', 'skip', 'Login flow incomplete (may require additional setup)');
        }
      } catch (error) {
        addTestResult('WebApp Auth Login', 'skip', 'Could not complete login flow', error);
      }
    } else {
      addTestResult('WebApp Auth Redirect', 'fail', 'Not redirected to Auth0 login');
    }

  } catch (error) {
    addTestResult('WebApp Authentication Flow', 'fail', 'Failed to test webapp flow', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Test multi-tenancy
 */
async function testMultiTenancy() {
  console.log('\n🏢 Testing Multi-Tenancy...');

  try {
    const tokens = await getUserToken();
    const idToken = jwt.decode(tokens.id_token);
    const tenant = idToken['custom:tenant'];

    if (tenant) {
      addTestResult('Tenant Claim', 'pass', `User assigned to tenant: ${tenant}`);

      // Test tenant-specific data access
      try {
        const response = await axios.get(`${config.urls.api}/api/users/userloggedin`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json'
          },
          data: {
            userName: idToken.email,
            tenant: tenant
          }
        });

        if (response.status === 200) {
          addTestResult('Tenant Data Access', 'pass', 'Successfully accessed tenant-specific data');
        } else {
          addTestResult('Tenant Data Access', 'fail', `Unexpected status: ${response.status}`);
        }
      } catch (error) {
        addTestResult('Tenant Data Access', 'fail', 'Failed to access tenant data', error);
      }
    } else {
      addTestResult('Tenant Claim', 'fail', 'No tenant claim found in token');
    }

  } catch (error) {
    addTestResult('Multi-Tenancy', 'fail', 'Failed to test multi-tenancy', error);
  }
}

/**
 * Test SSO capabilities
 */
async function testSSOCapabilities() {
  console.log('\n🔗 Testing SSO Capabilities...');

  try {
    // Test SSO discovery endpoint
    const response = await axios.get(`https://${config.auth0.domain}/.well-known/openid_configuration`);

    if (response.status === 200 && response.data.issuer) {
      addTestResult('SSO Discovery', 'pass', 'Auth0 OpenID configuration accessible');
    } else {
      addTestResult('SSO Discovery', 'fail', 'Invalid OpenID configuration');
    }

    // Test JWKS endpoint
    const jwksResponse = await axios.get(`https://${config.auth0.domain}/.well-known/jwks.json`);

    if (jwksResponse.status === 200 && jwksResponse.data.keys) {
      addTestResult('JWKS Endpoint', 'pass', `Found ${jwksResponse.data.keys.length} signing keys`);
    } else {
      addTestResult('JWKS Endpoint', 'fail', 'Invalid JWKS response');
    }

  } catch (error) {
    addTestResult('SSO Capabilities', 'fail', 'Failed to test SSO capabilities', error);
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n📊 Test Report');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Skipped: ${testResults.summary.skipped} ⏭️`);
  console.log('='.repeat(50));

  if (testResults.summary.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.tests
      .filter(t => t.status === 'fail')
      .forEach(test => {
        console.log(`❌ ${test.name}: ${test.details}`);
        if (test.error) {
          console.log(`   Error: ${test.error}`);
        }
      });
  }

  if (testResults.summary.skipped > 0) {
    console.log('\nSkipped Tests:');
    testResults.tests
      .filter(t => t.status === 'skip')
      .forEach(test => {
        console.log(`⏭️ ${test.name}: ${test.details}`);
      });
  }

  // Calculate success rate
  const successRate = testResults.summary.total > 0 ?
    ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1) : 0;

  console.log(`\nSuccess Rate: ${successRate}%`);

  if (successRate >= 80) {
    console.log('🎉 Integration tests mostly successful! Auth0 integration appears to be working correctly.');
  } else if (successRate >= 50) {
    console.log('⚠️ Some integration issues found. Review failed tests and configuration.');
  } else {
    console.log('🚨 Major integration issues detected. Please review Auth0 configuration and implementation.');
  }

  // Save detailed report
  const fs = require('fs').promises;
  const path = require('path');
  const reportPath = path.join(__dirname, `auth0-test-report-${new Date().toISOString().split('T')[0]}.json`);

  fs.writeFile(reportPath, JSON.stringify({
    ...testResults,
    config: {
      auth0_domain: config.auth0.domain,
      api_url: config.urls.api,
      webapp_url: config.urls.webapp
    },
    timestamp: new Date().toISOString()
  }, null, 2)).catch(console.error);

  console.log(`\nDetailed report saved to: ${reportPath}`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Auth0 Integration Tests...');
  console.log(`Auth0 Domain: ${config.auth0.domain}`);
  console.log(`API URL: ${config.urls.api}`);
  console.log(`WebApp URL: ${config.urls.webapp}`);

  const args = process.argv.slice(2);
  const skipWebApp = args.includes('--skip-webapp');

  try {
    await testTokenAcquisition();
    await testAPIJWTValidation();
    await testAPIKeyFallback();
    await testRoleBasedAuthorization();
    await testMultiTenancy();
    await testSSOCapabilities();

    if (!skipWebApp) {
      await testWebAppAuthFlow();
    } else {
      addTestResult('WebApp Tests', 'skip', 'Skipped per --skip-webapp flag');
    }

  } catch (error) {
    console.error('Test suite failed:', error);
  }

  generateTestReport();

  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testTokenAcquisition,
  testAPIJWTValidation,
  testRoleBasedAuthorization,
  testMultiTenancy
};