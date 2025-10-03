# CI/CD Pipeline Updates for Auth0 Integration

This document outlines the required changes to CI/CD pipelines after implementing Auth0 authentication.

## Required Environment Variables

### GitHub Secrets/Variables to Add

**For all environments (dev, staging, production):**

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_CLIENT_SECRET=your-spa-client-secret
AUTH0_AUDIENCE=https://pzi-api

# PZI WebApp Environment Variables
AUTH0_REDIRECT_URI=https://your-domain.com/auth/callback
AUTH0_LOGOUT_URI=https://your-domain.com

# Optional for testing
TEST_USER_EMAIL=test@zoopraha.cz
TEST_USER_PASSWORD=secure-test-password

# Keep existing variables for backward compatibility during transition
PZI_API_KEY=existing-api-key
SESSION_SECRET=existing-session-secret
```

## Pipeline Updates Required

### 1. pzi-webapp Pipeline Updates

**File: `.github/workflows/pzi-webapp-main.yml`**

```yaml
# Add after "Install dependencies" step
- name: Install dependencies
  run: npm ci

# NEW: Add Auth0 integration tests
- name: Run Auth0 Integration Tests
  run: |
    npm install puppeteer auth0 axios # Install test dependencies
    node scripts/test-auth0-integration.js --skip-webapp
  env:
    AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
    AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
    AUTH0_CLIENT_SECRET: ${{ secrets.AUTH0_CLIENT_SECRET }}
    AUTH0_AUDIENCE: ${{ secrets.AUTH0_AUDIENCE }}
    PZI_API_URL: ${{ vars.PZI_API_URL || 'http://localhost:5230' }}

# Update build step to include Auth0 environment variables
- name: Build app
  run: npm run build
  env:
    AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
    AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
    AUTH0_AUDIENCE: ${{ secrets.AUTH0_AUDIENCE }}
    AUTH0_REDIRECT_URI: ${{ vars.AUTH0_REDIRECT_URI }}
    AUTH0_LOGOUT_URI: ${{ vars.AUTH0_LOGOUT_URI }}
```

### 2. pzi-api Pipeline Updates

**File: `.github/workflows/pzi-api-main.yml`**

```yaml
# Add after "Set up .NET Core" step
- name: Set up .NET Core
  uses: actions/setup-dotnet@v1
  with:
    dotnet-version: '8.x'
    include-prerelease: true

# NEW: Add Auth0 configuration for tests
- name: Configure Auth0 for Tests
  run: |
    dotnet user-secrets set "Auth0:Domain" "${{ secrets.AUTH0_DOMAIN }}"
    dotnet user-secrets set "Auth0:Audience" "${{ secrets.AUTH0_AUDIENCE }}"
  working-directory: pzi-api/PziApi

# Update tests step
- name: tests
  run: dotnet test
  env:
    Auth0__Domain: ${{ secrets.AUTH0_DOMAIN }}
    Auth0__Audience: ${{ secrets.AUTH0_AUDIENCE }}

# NEW: Add Auth0 integration test
- name: Test Auth0 JWT Validation
  run: |
    npm install auth0 axios # Install Node.js dependencies for testing
    node ../scripts/test-auth0-integration.js --skip-webapp
  env:
    AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
    AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
    AUTH0_CLIENT_SECRET: ${{ secrets.AUTH0_CLIENT_SECRET }}
    AUTH0_AUDIENCE: ${{ secrets.AUTH0_AUDIENCE }}
    PZI_API_URL: "http://localhost:5230"
  working-directory: pzi-api
```

### 3. New: Auth0 Migration Pipeline

**Create new file: `.github/workflows/auth0-migration.yml`**

```yaml
name: Auth0 User Migration

on:
  workflow_dispatch:
    inputs:
      migration_mode:
        description: 'Migration mode'
        required: true
        default: 'dry-run'
        type: choice
        options:
        - dry-run
        - migrate
      batch_size:
        description: 'Batch size for migration'
        required: false
        default: '10'
        type: string

jobs:
  migrate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install migration dependencies
        run: |
          npm install auth0 pg

      - name: Run Auth0 User Migration
        run: |
          if [ "${{ github.event.inputs.migration_mode }}" = "dry-run" ]; then
            node scripts/migrate-users-to-auth0.js --dry-run --batch-size=${{ github.event.inputs.batch_size }}
          else
            node scripts/migrate-users-to-auth0.js --batch-size=${{ github.event.inputs.batch_size }}
          fi
        env:
          AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
          AUTH0_M2M_CLIENT_ID: ${{ secrets.AUTH0_M2M_CLIENT_ID }}
          AUTH0_M2M_CLIENT_SECRET: ${{ secrets.AUTH0_M2M_CLIENT_SECRET }}
          PZI_DB_CONNECTION_STRING: ${{ secrets.PZI_DB_CONNECTION_STRING }}

      - name: Upload migration report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: migration-report
          path: scripts/migration-report-*.json
```

### 4. Update Docker Compose for Development

**File: `docker-compose.yml`**

```yaml
# Add Auth0 environment variables to services
services:
  postgresql:
    # ... existing configuration

  # NEW: Remove pzi-login service (no longer needed)
  # pzi-login:
  #   build: ./pzi-login
  #   ports:
  #     - "5220:80"

  pzi-webapp:
    build: ./pzi-webapp
    ports:
      - "5173:5173"
    environment:
      - AUTH0_DOMAIN=${AUTH0_DOMAIN:-your-tenant.auth0.com}
      - AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
      - AUTH0_CLIENT_SECRET=${AUTH0_CLIENT_SECRET}
      - AUTH0_AUDIENCE=${AUTH0_AUDIENCE:-https://pzi-api}
      - AUTH0_REDIRECT_URI=${AUTH0_REDIRECT_URI:-http://localhost:5173/auth/callback}
      - AUTH0_LOGOUT_URI=${AUTH0_LOGOUT_URI:-http://localhost:5173}
      - PZI_API_KEY=${PZI_API_KEY:-Key1}
      - PZI_API_HOST_URL=http://pzi-api:80
      - SESSION_SECRET=${SESSION_SECRET:-dev-session-secret}
    depends_on:
      - pzi-api

  pzi-api:
    build: ./pzi-api
    ports:
      - "5230:80"
    environment:
      - Auth0__Domain=${AUTH0_DOMAIN:-your-tenant.auth0.com}
      - Auth0__Audience=${AUTH0_AUDIENCE:-https://pzi-api}
      - ConnectionStrings__Default=${PZI_DB_CONNECTION_STRING:-Host=postgresql;Database=pzi;Username=postgres;Password=${POSTGRES_PASSWORD}}
      - Pzi__ApiKeys__0=${PZI_API_KEY:-Key1}
    depends_on:
      - postgresql
```

## Deployment Configuration Updates

### Environment Variables for Production

**Azure App Service / Container Instances:**

```bash
# Auth0 Configuration
AUTH0_DOMAIN=pzi-production.auth0.com
AUTH0_CLIENT_ID=prod-spa-client-id
AUTH0_CLIENT_SECRET=prod-spa-client-secret
AUTH0_AUDIENCE=https://pzi-api

# WebApp Specific
AUTH0_REDIRECT_URI=https://metazoa.zoopraha.cz/auth/callback
AUTH0_LOGOUT_URI=https://metazoa.zoopraha.cz

# API Specific (appsettings.json or environment)
Auth0__Domain=pzi-production.auth0.com
Auth0__Audience=https://pzi-api

# Keep existing for backward compatibility during transition
Pzi__ApiKeys__0=legacy-api-key-for-transition-period
```

**Kubernetes ConfigMaps/Secrets:**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth0-config
type: Opaque
stringData:
  AUTH0_DOMAIN: "pzi-production.auth0.com"
  AUTH0_CLIENT_ID: "prod-spa-client-id"
  AUTH0_CLIENT_SECRET: "prod-spa-client-secret"
  AUTH0_AUDIENCE: "https://pzi-api"

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth0-public-config
data:
  AUTH0_REDIRECT_URI: "https://metazoa.zoopraha.cz/auth/callback"
  AUTH0_LOGOUT_URI: "https://metazoa.zoopraha.cz"
```

## Health Check Updates

### API Health Check Endpoint

Add to API controllers for monitoring:

```csharp
[HttpGet("health/auth")]
public async Task<IActionResult> AuthHealthCheck()
{
    try
    {
        var domain = _configuration["Auth0:Domain"];
        var audience = _configuration["Auth0:Audience"];

        if (string.IsNullOrEmpty(domain) || string.IsNullOrEmpty(audience))
        {
            return Ok(new { status = "degraded", message = "Auth0 not configured, using API key fallback" });
        }

        // Test JWKS endpoint
        using var client = new HttpClient();
        var response = await client.GetAsync($"https://{domain}/.well-known/jwks.json");

        if (response.IsSuccessStatusCode)
        {
            return Ok(new { status = "healthy", message = "Auth0 integration operational" });
        }

        return Ok(new { status = "degraded", message = "Auth0 JWKS endpoint not accessible" });
    }
    catch (Exception ex)
    {
        return Ok(new { status = "unhealthy", message = ex.Message });
    }
}
```

### Monitoring and Alerts

**Azure Application Insights queries:**

```kusto
// Auth0 authentication failures
traces
| where message contains "Auth0" and severityLevel >= 3
| summarize count() by bin(timestamp, 5m)

// JWT validation errors
exceptions
| where outerMessage contains "Token validation failed"
| summarize count() by bin(timestamp, 5m)

// SSO connection health
customEvents
| where name == "SSO_LOGIN"
| summarize success_rate = avg(toint(customDimensions.success)) by bin(timestamp, 15m)
```

## Migration Rollback Plan

If issues occur, rollback can be performed by:

1. **Revert environment variables:**
   ```bash
   # Disable Auth0, re-enable API key only
   unset AUTH0_DOMAIN AUTH0_CLIENT_ID AUTH0_CLIENT_SECRET AUTH0_AUDIENCE
   ```

2. **Redeploy previous version:**
   ```bash
   # Use previous container tags
   docker pull $REGISTRY/pzi/web:previous-version
   docker pull $REGISTRY/pzi/api:previous-version
   ```

3. **Re-enable pzi-login service:**
   ```bash
   # Redeploy pzi-login container
   docker run -p 5220:80 $REGISTRY/pzi/login:latest
   ```

## Testing in CI/CD

### Pre-deployment Tests

- Auth0 token acquisition
- JWT validation
- Role-based authorization
- Multi-tenant access control
- SSO connection validation

### Post-deployment Smoke Tests

- Login flow end-to-end
- API authentication
- Permission verification
- Logout functionality

### Performance Tests

- Token validation latency
- Auth0 API response times
- JWKS caching effectiveness

## Security Considerations

### Secrets Management

- Store Auth0 credentials in secure key vault
- Rotate secrets regularly
- Use least-privilege Auth0 scopes
- Monitor for credential leakage

### Network Security

- Whitelist Auth0 IP ranges if applicable
- Use HTTPS for all Auth0 communications
- Implement proper CORS policies

### Monitoring

- Set up alerts for authentication failures
- Monitor Auth0 rate limits
- Track unusual login patterns
- Alert on JWT validation errors

## Implementation Checklist

- [ ] Add Auth0 environment variables to GitHub secrets
- [ ] Update webapp CI/CD pipeline with Auth0 tests
- [ ] Update API CI/CD pipeline with JWT validation tests
- [ ] Create Auth0 migration workflow
- [ ] Update Docker Compose configuration
- [ ] Configure production environment variables
- [ ] Set up health checks and monitoring
- [ ] Test rollback procedures
- [ ] Update documentation and runbooks
- [ ] Schedule migration window
- [ ] Prepare support team for Auth0 troubleshooting

## Notes

- **Backward Compatibility**: API key authentication remains as fallback during transition
- **Gradual Migration**: Users can be migrated in batches to minimize disruption
- **Monitoring**: Enhanced logging and monitoring during initial deployment
- **Support**: Ensure support team is trained on Auth0 troubleshooting