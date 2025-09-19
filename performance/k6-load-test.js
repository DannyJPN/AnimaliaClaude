import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const apiRequests = new Counter('api_requests');

// Test configuration
export let options = {
  scenarios: {
    // Load test - normal usage
    load_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'load' },
    },
    // Stress test - find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },
    // Spike test - sudden traffic increase
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '10s', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '10s', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },
    // Soak test - extended period
    soak_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1h',
      tags: { test_type: 'soak' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],
    api_response_time: ['p(95)<300'],
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'Test123!' },
  { email: 'test2@example.com', password: 'Test123!' },
  { email: 'test3@example.com', password: 'Test123!' },
];

// Authentication token cache
let authTokens = {};

function getAuthToken(userEmail) {
  if (!authTokens[userEmail]) {
    const response = http.post(`${API_URL}/auth/login`, {
      email: userEmail,
      password: 'Test123!'
    });

    if (response.status === 200) {
      const token = JSON.parse(response.body).token;
      authTokens[userEmail] = token;
    }
  }
  return authTokens[userEmail];
}

function makeAuthenticatedRequest(method, url, payload = null, userEmail = 'test1@example.com') {
  const token = getAuthToken(userEmail);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const params = {
    headers,
    tags: { endpoint: url.replace(API_URL, '') },
  };

  let response;
  const startTime = new Date();

  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, params);
      break;
    case 'POST':
      response = http.post(url, payload ? JSON.stringify(payload) : null, params);
      break;
    case 'PUT':
      response = http.put(url, payload ? JSON.stringify(payload) : null, params);
      break;
    case 'DELETE':
      response = http.del(url, null, params);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  const endTime = new Date();
  const responseTime = endTime - startTime;

  // Record metrics
  apiResponseTime.add(responseTime);
  apiRequests.add(1);
  errorRate.add(response.status >= 400);

  return response;
}

export default function () {
  const testUser = testUsers[Math.floor(Math.random() * testUsers.length)];

  group('Authentication Flow', () => {
    // Login test
    const loginResponse = http.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    check(loginResponse, {
      'login successful': (r) => r.status === 200,
      'login response time < 200ms': (r) => r.timings.duration < 200,
    });

    if (loginResponse.status === 200) {
      const token = JSON.parse(loginResponse.body).token;

      // Token validation
      const profileResponse = makeAuthenticatedRequest('GET', `${API_URL}/user/profile`, null, testUser.email);

      check(profileResponse, {
        'profile retrieved': (r) => r.status === 200,
        'profile response time < 100ms': (r) => r.timings.duration < 100,
      });
    }
  });

  group('API Operations', () => {
    // Health check
    const healthResponse = http.get(`${API_URL}/health`);
    check(healthResponse, {
      'health check successful': (r) => r.status === 200,
      'health response time < 50ms': (r) => r.timings.duration < 50,
    });

    // Version endpoint
    const versionResponse = http.get(`${API_URL}/version/full`);
    check(versionResponse, {
      'version endpoint working': (r) => r.status === 200,
      'version response time < 50ms': (r) => r.timings.duration < 50,
    });

    // Protected resources
    const tenantsResponse = makeAuthenticatedRequest('GET', `${API_URL}/tenants`, null, testUser.email);
    check(tenantsResponse, {
      'tenants list retrieved': (r) => r.status === 200 || r.status === 403,
      'tenants response time < 200ms': (r) => r.timings.duration < 200,
    });
  });

  group('Multi-tenant Operations', () => {
    // Test tenant isolation under load
    const tenantId = Math.floor(Math.random() * 100) + 1;

    // Records operations
    const recordsResponse = makeAuthenticatedRequest('GET', `${API_URL}/tenants/${tenantId}/records`, null, testUser.email);
    check(recordsResponse, {
      'records request processed': (r) => r.status === 200 || r.status === 403 || r.status === 404,
      'records response time < 300ms': (r) => r.timings.duration < 300,
    });

    // Export operations (typically slower)
    const exportResponse = makeAuthenticatedRequest('GET', `${API_URL}/tenants/${tenantId}/export`, null, testUser.email);
    check(exportResponse, {
      'export request processed': (r) => r.status === 200 || r.status === 403 || r.status === 404,
      'export response time < 5000ms': (r) => r.timings.duration < 5000,
    });
  });

  group('Database Operations', () => {
    // Search operations (database intensive)
    const searchParams = {
      query: 'test',
      page: Math.floor(Math.random() * 10) + 1,
      limit: 20,
    };

    const searchUrl = `${API_URL}/search?${new URLSearchParams(searchParams).toString()}`;
    const searchResponse = makeAuthenticatedRequest('GET', searchUrl, null, testUser.email);

    check(searchResponse, {
      'search completed': (r) => r.status === 200 || r.status === 403,
      'search response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    // Aggregation operations
    const statsResponse = makeAuthenticatedRequest('GET', `${API_URL}/stats/dashboard`, null, testUser.email);
    check(statsResponse, {
      'stats retrieved': (r) => r.status === 200 || r.status === 403,
      'stats response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  // Random sleep to simulate user think time
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'performance/results/summary.json': JSON.stringify(data, null, 2),
    'performance/results/summary.html': generateHTMLReport(data),
  };
}

function generateHTMLReport(data) {
  const metrics = data.metrics;
  const scenarios = data.root_group.groups;

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007cba; }
        .threshold-pass { border-color: #28a745; }
        .threshold-fail { border-color: #dc3545; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>

    <h2>Summary</h2>
    <div class="metric">
        <strong>Test Duration:</strong> ${data.state.testRunDurationMs / 1000}s
    </div>
    <div class="metric">
        <strong>Total Requests:</strong> ${metrics.http_reqs.values.count}
    </div>
    <div class="metric">
        <strong>Request Rate:</strong> ${metrics.http_reqs.values.rate.toFixed(2)} req/s
    </div>
    <div class="metric">
        <strong>Error Rate:</strong> ${((metrics.http_req_failed.values.rate || 0) * 100).toFixed(2)}%
    </div>

    <h2>Response Time Statistics</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Average</th>
            <th>p95</th>
            <th>p99</th>
            <th>Max</th>
        </tr>
        <tr>
            <td>HTTP Request Duration</td>
            <td>${metrics.http_req_duration.values.avg.toFixed(2)}ms</td>
            <td>${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
            <td>${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td>
            <td>${metrics.http_req_duration.values.max.toFixed(2)}ms</td>
        </tr>
    </table>

    <h2>Test Groups</h2>
    ${Object.keys(scenarios || {}).map(groupName => `
        <h3>${groupName}</h3>
        <div class="metric">
            Checks: ${scenarios[groupName].checks.passes}/${scenarios[groupName].checks.fails + scenarios[groupName].checks.passes}
            (${((scenarios[groupName].checks.passes / (scenarios[groupName].checks.fails + scenarios[groupName].checks.passes)) * 100).toFixed(1)}% pass rate)
        </div>
    `).join('')}
</body>
</html>
  `;
}