# Auth0 Migration Guide

This document provides a comprehensive guide for migrating the PZI system from Active Directory authentication to Auth0.

## Overview

The PZI system has been completely migrated from:
- **Old**: `pzi-login` service with Active Directory/LDAP authentication
- **New**: Auth0 Universal Login with JWT-based authentication and authorization

## Architecture Changes

### Before (Legacy)
```
User → pzi-login (AD/LDAP) → Custom JWT → pzi-webapp → API (API Key)
```

### After (Auth0)
```
User → Auth0 Universal Login → Auth0 JWT → pzi-webapp → API (JWT Validation)
```

## Features Implemented

### ✅ Authentication
- Auth0 Universal Login with customizable branding per tenant
- JWT token-based authentication
- Secure token validation using Auth0 public keys
- Backward compatibility with API key authentication during transition

### ✅ Authorization (RBAC)
- Role-Based Access Control with granular permissions
- **Roles**: `admin`, `curator`, `veterinarian`, `user`, `documentation`
- **Permissions**:
  - `RECORDS:VIEW`, `RECORDS:EDIT`
  - `LISTS:VIEW`, `LISTS:EDIT`
  - `JOURNAL:ACCESS`, `JOURNAL:READ`, `JOURNAL:CONTRIBUTE`
  - `DOCUMENTATION_DEPARTMENT`

### ✅ Multi-Tenancy
- Support for multiple zoo organizations (Zoo Praha, Zoo Brno, etc.)
- Tenant detection via subdomain or email domain
- Isolated user access per tenant
- Custom branding per tenant

### ✅ Single Sign-On (SSO)
- Enterprise identity provider integration
- **Supported**: SAML, OIDC, OAuth2, Active Directory
- **Pre-configured**: Google Workspace, Azure AD, Zoo-specific AD
- Automatic role mapping from external systems

## Environment Variables

### PZI Webapp (.env)
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_SCOPE=openid profile email
AUTH0_REDIRECT_URI=https://your-domain.com/auth/callback
AUTH0_LOGOUT_URI=https://your-domain.com

# Existing PZI Configuration
SESSION_SECRET=your-session-secret
PZI_API_KEY=your-api-key
PZI_API_HOST_URL=https://your-api-host
```

### PZI API (appsettings.json)
```json
{
  "Auth0": {
    "Domain": "your-tenant.auth0.com",
    "Audience": "https://your-api-identifier"
  },
  "Pzi": {
    "ApiKeys": ["legacy-api-key-for-backward-compatibility"]
  }
}
```

## Auth0 Tenant Configuration

### 1. Create Auth0 Application
```bash
# Single Page Application (SPA) for pzi-webapp
Application Type: Single Page Application
Allowed Callback URLs: https://your-domain.com/auth/callback
Allowed Logout URLs: https://your-domain.com
Allowed Web Origins: https://your-domain.com
```

### 2. Create Auth0 API
```bash
# API for pzi-api
Identifier: https://your-api-identifier
Signing Algorithm: RS256
```

### 3. Configure Organizations (Multi-tenancy)
```javascript
// Zoo Praha Organization
{
  "name": "Zoo Praha",
  "display_name": "Zoo Praha",
  "branding": {
    "logo_url": "https://your-domain.com/logos/zoo-praha.png",
    "colors": {
      "primary": "#2E7D32",
      "page_background": "#E8F5E8"
    }
  }
}
```

### 4. Configure Roles and Permissions
```javascript
// Roles
const roles = [
  { name: "admin", description: "System Administrator" },
  { name: "curator", description: "Zoo Curator" },
  { name: "veterinarian", description: "Zoo Veterinarian" },
  { name: "user", description: "Regular User" },
  { name: "documentation", description: "Documentation Department" }
];

// Permissions
const permissions = [
  { name: "records:view", description: "View animal records" },
  { name: "records:edit", description: "Edit animal records" },
  { name: "lists:view", description: "View system lists" },
  { name: "lists:edit", description: "Edit system lists" },
  { name: "journal:access", description: "Access journal system" },
  { name: "documentation:access", description: "Access documentation features" }
];
```

### 5. Configure Enterprise Connections
```javascript
// Active Directory Connection for Zoo Praha
{
  "strategy": "ad",
  "name": "zoo-praha-ad",
  "options": {
    "domain": "zoopraha.local",
    "domain_aliases": ["prague-zoo.cz", "zoopraha.cz"]
  }
}

// SAML Connection for Zoo Brno
{
  "strategy": "saml",
  "name": "zoo-brno-saml",
  "options": {
    "signInEndpoint": "https://sso.zoobrno.cz/saml/sso",
    "signOutEndpoint": "https://sso.zoobrno.cz/saml/slo"
  }
}
```

## User Migration

### Option 1: Bulk Import via Auth0 Management API
Use the provided migration script: `scripts/migrate-users-to-auth0.js`

```bash
node scripts/migrate-users-to-auth0.js
```

### Option 2: Just-in-Time Migration
Users are automatically migrated when they first log in through their enterprise connection.

### Option 3: Manual User Creation
Create users directly in Auth0 Dashboard with appropriate roles and organization assignments.

## Testing

### Integration Testing
Use the provided test script: `scripts/test-auth0-integration.js`

```bash
node scripts/test-auth0-integration.js
```

### Manual Testing Checklist
- [ ] Login with Auth0 Universal Login
- [ ] Login with enterprise SSO (SAML/AD)
- [ ] Proper role assignment from external systems
- [ ] Multi-tenant access control
- [ ] JWT token validation in API
- [ ] Permission-based authorization
- [ ] Logout functionality
- [ ] Token refresh

## Deployment Steps

### 1. Pre-deployment
- Set up Auth0 tenant and configure applications
- Configure environment variables
- Test in staging environment

### 2. Deployment
- Deploy API changes with Auth0 JWT validation
- Deploy webapp changes with Auth0 integration
- Update load balancer/reverse proxy if needed

### 3. Post-deployment
- Verify authentication flows
- Monitor error logs
- Migrate users gradually if using JIT migration
- Update monitoring and alerts

### 4. Legacy Cleanup (After full migration)
- Remove `pzi-login` service
- Remove API key authentication
- Clean up old authentication code

## Rollback Plan

If issues arise, the system can be rolled back:

1. **API**: Revert to `ApiKeyValidationMiddleware` only
2. **Webapp**: Revert authentication routes to use `pzi-login`
3. **Database**: No schema changes required
4. **Monitoring**: Watch for authentication failures

## Security Considerations

- All tokens are validated using Auth0 public keys
- Sensitive configuration stored in environment variables
- HTTPS required for all authentication flows
- Session management with secure cookies
- Proper CORS configuration
- Rate limiting on authentication endpoints

## Monitoring and Logs

### Key Metrics to Monitor
- Authentication success/failure rates
- Token validation failures
- SSO connection health
- User login patterns by tenant

### Log Locations
- **Webapp**: Console/file logs for authentication events
- **API**: Serilog output for JWT validation
- **Auth0**: Auth0 Dashboard logs and monitoring

## Support and Troubleshooting

### Common Issues

**"Invalid token" errors**
- Check Auth0 domain and audience configuration
- Verify token hasn't expired
- Ensure proper CORS settings

**SSO connection failures**
- Verify enterprise connection configuration
- Check certificate validity for SAML
- Validate attribute mappings

**Permission denied errors**
- Check user role assignments in Auth0
- Verify permission mappings in code
- Check organization membership

### Debug Mode
Enable detailed logging by setting environment variables:
```env
SERILOG_LOGLEVEL=Debug
AUTH0_DEBUG=true
```

## Migration Timeline

**Phase 1 (Week 1-2): Setup**
- Auth0 tenant configuration
- Environment setup
- Integration testing

**Phase 2 (Week 3-4): Deployment**
- Staging deployment
- User acceptance testing
- Production deployment

**Phase 3 (Week 5-6): Migration**
- User migration
- SSO configuration
- Legacy cleanup

**Phase 4 (Week 7-8): Optimization**
- Performance optimization
- Monitoring setup
- Documentation finalization