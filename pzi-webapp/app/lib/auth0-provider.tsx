import { Auth0Provider, AppState } from '@auth0/auth0-react';
import { ReactNode } from 'react';

interface Auth0ProviderWrapperProps {
  children: ReactNode;
  domain: string;
  clientId: string;
  audience?: string;
  redirectUri?: string;
}

export const Auth0ProviderWrapper = ({
  children,
  domain,
  clientId,
  audience,
  redirectUri = window.location.origin + '/auth/callback'
}: Auth0ProviderWrapperProps) => {
  const onRedirectCallback = (appState?: AppState) => {
    window.location.replace(
      appState?.returnTo || window.location.pathname
    );
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email'
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
};