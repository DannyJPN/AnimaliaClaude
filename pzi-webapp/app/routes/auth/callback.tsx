import { LoaderFunctionArgs, redirectDocument } from "react-router";
import { commitSession } from "~/.server/session-storage";
import { getUserSession } from "~/.server/user-session";
import { apiCall, processResponse } from '../../.server/api-actions';
import { pziConfig } from "../../.server/pzi-config";
import { logger } from "~/.server/logger";
import { auth0Config, validateAuth0Config } from "~/.server/auth0-config";
import { Auth0Service } from "~/.server/auth0-service";
import { TenantService } from "~/.server/tenant-service";
import { SSOService } from "~/.server/sso-service";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    logger.error('Auth0 callback error:', { error, errorDescription });
    return new Response(`Authentication failed: ${errorDescription || error}`, {
      status: 400
    });
  }

  if (!code) {
    return new Response("Authorization code not provided", {
      status: 400
    });
  }

  try {
    validateAuth0Config();

    // Extract tenant and return URL from state
    const { tenant: tenantId, returnUrl = '/', sso: ssoConnectionId } =
      TenantService.extractTenantFromState(state || '{}');

    const tenant = tenantId ? TenantService.getTenantById(tenantId) : null;

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://${auth0Config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        code,
        redirect_uri: auth0Config.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    const { access_token, id_token } = tokens;

    // Verify and decode the ID token
    const auth0User = await Auth0Service.verifyToken(id_token);

    // Process SSO attributes if this was an SSO login
    if (ssoConnectionId) {
      const ssoConnection = SSOService.getConnectionById(ssoConnectionId);
      if (ssoConnection) {
        const ssoData = SSOService.processIdTokenClaims(auth0User, ssoConnection);
        const roles = SSOService.mapGroupsToRoles(ssoData.groups || [], ssoConnection);

        // Update user data with SSO information
        auth0User['custom:roles'] = roles;
        auth0User['custom:tenant'] = tenant?.id;
      }
    }

    // Determine tenant from user if not already set
    let userTenant = tenant;
    if (!userTenant && auth0User.email) {
      userTenant = TenantService.getTenantFromEmailDomain(auth0User.email);
    }

    // Process user data for PZI API
    const processedUserData = await Auth0Service.processUserForPziApi(auth0User);

    // Update tenant information
    if (userTenant) {
      processedUserData.tenant = userTenant.id;
    }

    // Call PZI API to validate user and get additional data
    const userLoggedInRequest = {
      userName: processedUserData.userName,
      email: processedUserData.email,
      roles: processedUserData.roles,
      tenant: processedUserData.tenant
    };

    const userResponse = await apiCall(
      "api/users/userloggedin",
      "POST",
      JSON.stringify(userLoggedInRequest),
      pziConfig
    );

    const parsedUserResponse = await processResponse<{
      userId: number,
      visibleTaxonomyStatuses: string[],
      taxonomySearchByCz: boolean,
      taxonomySearchByLat: boolean,
      permissions: string[]
    }>(userResponse);

    // Create session with Auth0 and PZI data
    const session = await getUserSession(request);

    // Store Auth0 tokens for API calls
    session.set("auth0_access_token", access_token);
    session.set("auth0_id_token", id_token);
    session.set("auth0_user_id", auth0User.sub);

    // Store processed user data
    session.set("userId", parsedUserResponse.item!.userId);
    session.set("userName", processedUserData.userName);
    session.set("userEmail", processedUserData.email);
    session.set("roles", processedUserData.roles);
    session.set("tenant", processedUserData.tenant);
    session.set("visibleTaxonomyStatuses", parsedUserResponse.item!.visibleTaxonomyStatuses);
    session.set('taxonomySearchBy', {
      'cz': parsedUserResponse.item!.taxonomySearchByCz,
      'lat': parsedUserResponse.item!.taxonomySearchByLat
    });
    session.set('permissions', parsedUserResponse.item!.permissions || []);

    logger.info('User successfully authenticated via Auth0', {
      userId: auth0User.sub,
      email: auth0User.email,
      tenant: processedUserData.tenant,
      sso: !!ssoConnectionId
    });

    return redirectDocument(returnUrl, {
      headers: { "set-cookie": await commitSession(session) }
    });
  } catch (err) {
    logger.error('Auth0 callback processing failed:', err);

    return new Response("Authentication processing failed", {
      status: 500
    });
  }
}