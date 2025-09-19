export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
  redirectUri?: string;
  logoutUri?: string;
}

export const auth0Config: Auth0Config = {
  domain: process.env.AUTH0_DOMAIN || 'your-tenant.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-client-secret',
  audience: process.env.AUTH0_AUDIENCE || 'https://your-api-identifier',
  scope: process.env.AUTH0_SCOPE || 'openid profile email',
  redirectUri: process.env.AUTH0_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  logoutUri: process.env.AUTH0_LOGOUT_URI || 'http://localhost:5173/auth/logout'
};

export const validateAuth0Config = (): void => {
  const required = ['AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required Auth0 environment variables: ${missing.join(', ')}`);
  }
};