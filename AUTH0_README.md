# Auth0 Integration for PZI System

This document provides setup instructions and configuration details for the Auth0 authentication system.

## Quick Start

### 1. Auth0 Tenant Setup

1. **Create Auth0 Account**
   - Sign up at [auth0.com](https://auth0.com)
   - Create a new tenant (e.g., `pzi-production.auth0.com`)

2. **Create Applications**

   **SPA Application (for pzi-webapp):**
   ```
   Application Type: Single Page Application
   Name: PZI WebApp
   Allowed Callback URLs: https://your-domain.com/auth/callback
   Allowed Logout URLs: https://your-domain.com
   Allowed Web Origins: https://your-domain.com
   Allowed Origins (CORS): https://your-domain.com
   ```

   **API (for pzi-api):**
   ```
   Name: PZI API
   Identifier: https://pzi-api
   Signing Algorithm: RS256
   ```

3. **Configure Environment Variables**

   **pzi-webapp/.env:**
   ```env
   AUTH0_DOMAIN=pzi-production.auth0.com
   AUTH0_CLIENT_ID=your-spa-client-id
   AUTH0_CLIENT_SECRET=your-spa-client-secret
   AUTH0_AUDIENCE=https://pzi-api
   AUTH0_REDIRECT_URI=https://your-domain.com/auth/callback
   AUTH0_LOGOUT_URI=https://your-domain.com
   ```

   **pzi-api/appsettings.json:**
   ```json
   {
     "Auth0": {
       "Domain": "pzi-production.auth0.com",
       "Audience": "https://pzi-api"
     }
   }
   ```

### 2. Role and Permission Setup

**Roles to Create in Auth0:**
- `admin` - Full system access
- `curator` - Curator-level access
- `veterinarian` - Veterinary access
- `user` - Basic user access
- `documentation` - Documentation department access

**Permissions to Create:**
- `records:view` - View animal records
- `records:edit` - Edit animal records
- `lists:view` - View system lists
- `lists:edit` - Edit system lists
- `journal:access` - Access journal system
- `documentation:access` - Documentation features

### 3. Multi-Tenant Organizations

**Create Organizations:**
```javascript
// Zoo Praha
{
  name: "zoo-praha",
  display_name: "Zoo Praha",
  branding: {
    logo_url: "https://your-domain.com/logos/zoo-praha.png",
    colors: {
      primary: "#2E7D32",
      page_background: "#E8F5E8"
    }
  }
}

// Zoo Brno
{
  name: "zoo-brno",
  display_name: "Zoo Brno",
  branding: {
    logo_url: "https://your-domain.com/logos/zoo-brno.png",
    colors: {
      primary: "#1976D2",
      page_background: "#E3F2FD"
    }
  }
}
```

## Advanced Configuration

### Enterprise Connections (SSO)

#### Active Directory Connection
```javascript
{
  "strategy": "ad",
  "name": "zoo-praha-ad",
  "options": {
    "domain": "zoopraha.local",
    "domain_aliases": ["zoopraha.cz", "prague-zoo.cz"],
    "use_kerberos": false,
    "disable_cache": false
  },
  "enabled_clients": ["your-spa-client-id"]
}
```

#### SAML Connection
```javascript
{
  "strategy": "saml",
  "name": "zoo-brno-saml",
  "options": {
    "signInEndpoint": "https://sso.zoobrno.cz/saml/login",
    "signOutEndpoint": "https://sso.zoobrno.cz/saml/logout",
    "x509cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "debug": false,
    "signatureAlgorithm": "rsa-sha256",
    "digestAlgorithm": "sha256"
  },
  "enabled_clients": ["your-spa-client-id"]
}
```

#### Google Workspace Connection
```javascript
{
  "strategy": "google-oauth2",
  "name": "google-workspace",
  "options": {
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "domain": "pzi.cz",
    "domain_aliases": ["zoo-pzi.cz"]
  }
}
```

### Custom Claims (Rules/Actions)

**Add Custom Claims Action:**
```javascript
/**
* Handler that will be called during the execution of a PostLogin flow.
*/
exports.onExecutePostLogin = async (event, api) => {
  const { user, organization } = event;

  // Add tenant information based on organization
  if (organization) {
    api.idToken.setCustomClaim('custom:tenant', organization.name);
    api.accessToken.setCustomClaim('custom:tenant', organization.name);
  } else {
    // Determine tenant from email domain
    const emailDomain = user.email ? user.email.split('@')[1] : null;
    let tenant = 'default';

    if (emailDomain === 'zoopraha.cz' || emailDomain === 'prague-zoo.cz') {
      tenant = 'zoo-praha';
    } else if (emailDomain === 'zoobrno.cz' || emailDomain === 'brno-zoo.cz') {
      tenant = 'zoo-brno';
    }

    api.idToken.setCustomClaim('custom:tenant', tenant);
    api.accessToken.setCustomClaim('custom:tenant', tenant);
  }

  // Add roles and permissions
  if (user.app_metadata && user.app_metadata.roles) {
    api.idToken.setCustomClaim('custom:roles', user.app_metadata.roles);
    api.accessToken.setCustomClaim('custom:roles', user.app_metadata.roles);
  }

  if (user.app_metadata && user.app_metadata.permissions) {
    api.idToken.setCustomClaim('custom:permissions', user.app_metadata.permissions);
    api.accessToken.setCustomClaim('custom:permissions', user.app_metadata.permissions);
  }
};
```

## User Management

### User Creation via Management API

```javascript
const ManagementClient = require('auth0').ManagementClient;

const management = new ManagementClient({
  domain: 'pzi-production.auth0.com',
  clientId: 'your-m2m-client-id',
  clientSecret: 'your-m2m-client-secret',
  scope: 'create:users update:users read:users'
});

// Create user with roles and organization
const createUser = async (userData) => {
  const user = await management.createUser({
    email: userData.email,
    name: userData.name,
    password: 'temp-password-123!',
    connection: 'Username-Password-Authentication',
    app_metadata: {
      roles: userData.roles,
      permissions: userData.permissions,
      tenant: userData.tenant
    }
  });

  // Assign to organization
  if (userData.organizationId) {
    await management.addUsersToOrganization({
      id: userData.organizationId
    }, {
      users: [user.user_id]
    });
  }

  return user;
};
```

### Bulk User Import

Use Auth0's bulk import feature with CSV file:

```csv
email,name,given_name,family_name,nickname,picture,user_metadata,app_metadata
john.doe@zoopraha.cz,John Doe,John,Doe,johnd,,"{""department"":""Mammals""}","{""roles"":[""curator""],""tenant"":""zoo-praha""}"
```

## Development Setup

### Local Development Environment

1. **Install Dependencies**
   ```bash
   cd pzi-webapp
   npm install

   cd ../pzi-api
   dotnet restore
   ```

2. **Configure Local Environment**

   **pzi-webapp/.env.local:**
   ```env
   AUTH0_DOMAIN=pzi-dev.auth0.com
   AUTH0_CLIENT_ID=dev-spa-client-id
   AUTH0_CLIENT_SECRET=dev-spa-client-secret
   AUTH0_AUDIENCE=https://pzi-api-dev
   AUTH0_REDIRECT_URI=http://localhost:5173/auth/callback
   AUTH0_LOGOUT_URI=http://localhost:5173
   ```

3. **Run Applications**
   ```bash
   # Terminal 1 - API
   cd pzi-api
   dotnet run --project PziApi

   # Terminal 2 - WebApp
   cd pzi-webapp
   npm run dev
   ```

## Testing

### Unit Tests

**WebApp - Auth Service Tests:**
```typescript
describe('Auth0Service', () => {
  test('should process user for PZI API', async () => {
    const auth0User = {
      sub: 'auth0|123',
      email: 'test@zoopraha.cz',
      name: 'Test User',
      'custom:roles': ['curator'],
      'custom:tenant': 'zoo-praha'
    };

    const result = await Auth0Service.processUserForPziApi(auth0User);

    expect(result.userId).toBe('auth0|123');
    expect(result.email).toBe('test@zoopraha.cz');
    expect(result.roles).toContain('curator');
    expect(result.tenant).toBe('zoo-praha');
  });
});
```

**API - JWT Validation Tests:**
```csharp
[Test]
public async Task ValidateAuth0Token_ValidToken_ReturnsClaimsPrincipal()
{
    // Arrange
    var token = GenerateValidJwtToken();
    var middleware = new Auth0JwtValidationMiddleware(_config, _logger, _httpClient);

    // Act
    var result = await middleware.ValidateAuth0Token(token);

    // Assert
    Assert.IsNotNull(result);
    Assert.IsTrue(result.Identity.IsAuthenticated);
}
```

### Integration Tests

Use the provided script: `scripts/test-auth0-integration.js`

```bash
node scripts/test-auth0-integration.js
```

## Security Best Practices

### Token Security
- Use HTTPS for all communications
- Implement proper token refresh logic
- Store refresh tokens securely (HttpOnly cookies)
- Validate token expiration and audience

### CORS Configuration
```javascript
// Auth0 Application Settings
Allowed Web Origins: https://your-domain.com
Allowed Origins (CORS): https://your-domain.com
```

### Rate Limiting
Configure rate limiting in Auth0 Dashboard:
- Login attempts: 10 per minute per IP
- API requests: 1000 per minute per user

### Monitoring
- Enable Auth0 logs
- Set up alerts for failed authentications
- Monitor token validation errors
- Track SSO connection health

## Troubleshooting

### Common Issues

**"Access Denied" for organization users:**
- Check organization membership
- Verify organization is enabled for application
- Check custom claims action

**SSO connection not working:**
- Verify connection is enabled
- Check certificate validity (SAML)
- Validate attribute mappings
- Test connection in Auth0 dashboard

**Token validation failures:**
- Check Auth0 domain configuration
- Verify audience matches
- Check system time synchronization
- Validate JWKS endpoint accessibility

**Multi-tenant issues:**
- Verify tenant detection logic
- Check organization assignments
- Validate custom claims

### Debug Commands

**Test JWT token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api-domain.com/api/test-endpoint
```

**Validate token manually:**
Visit [jwt.io](https://jwt.io) and paste your token to inspect claims.

**Auth0 Management API test:**
```javascript
const auth0 = require('auth0');

const management = new auth0.ManagementClient({
  domain: 'your-tenant.auth0.com',
  clientId: 'your-m2m-client-id',
  clientSecret: 'your-m2m-client-secret'
});

// Test connection
management.getUsers().then(users => {
  console.log('Connected successfully, found', users.length, 'users');
}).catch(err => {
  console.error('Connection failed:', err);
});
```

## Support

For additional support:
- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Community](https://community.auth0.com)
- Internal PZI Development Team