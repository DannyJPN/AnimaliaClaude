import { LoaderFunctionArgs, redirect } from "react-router";
import { auth0Config, validateAuth0Config } from "~/.server/auth0-config";
import { TenantService } from "~/.server/tenant-service";
import { SSOService } from "~/.server/sso-service";
import { logger } from "~/.server/logger";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const returnUrl = searchParams.get("returnUrl") || "/";
  const tenantHint = searchParams.get("tenant");
  const ssoConnection = searchParams.get("connection");

  try {
    validateAuth0Config();

    // Determine tenant from subdomain or explicit hint
    let tenant = tenantHint ?
      TenantService.getTenantById(tenantHint) :
      TenantService.getTenantFromSubdomain(url.hostname);

    if (!tenant) {
      tenant = TenantService.getTenantById('default')!;
    }

    // If specific SSO connection requested
    if (ssoConnection) {
      const connection = SSOService.getConnectionById(ssoConnection);
      if (connection && connection.tenantId === tenant.id && connection.enabled) {
        const ssoLoginUrl = SSOService.generateSSOLoginUrl(connection, tenant, returnUrl);
        return redirect(ssoLoginUrl);
      }
    }

    // Generate Auth0 Universal Login URL
    const loginUrl = TenantService.generateAuth0LoginUrl(tenant, returnUrl);

    logger.info('Redirecting to Auth0 login', {
      tenant: tenant.id,
      returnUrl,
      ssoConnection
    });

    return redirect(loginUrl);
  } catch (err) {
    logger.error('Login redirect failed:', err);

    return new Response("Login configuration error", {
      status: 500
    });
  }
}

export default function Login() {
  // This component won't render as the loader redirects
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Přesměrování na přihlášení...</h2>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}