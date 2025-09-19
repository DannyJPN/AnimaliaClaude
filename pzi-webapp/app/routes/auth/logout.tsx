import { LoaderFunctionArgs, redirectDocument } from "react-router";
import { destroySession } from "~/.server/session-storage";
import { getUserSession } from "~/.server/user-session";
import { auth0Config, validateAuth0Config } from "~/.server/auth0-config";
import { logger } from "~/.server/logger";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getUserSession(request);
  const url = new URL(request.url);

  try {
    validateAuth0Config();

    // Get return URL
    const returnTo = url.searchParams.get("returnUrl") || url.origin;

    // Destroy the session
    const sessionCookie = await destroySession(session);

    // Build Auth0 logout URL for universal logout
    const logoutUrl = `https://${auth0Config.domain}/v2/logout?` +
      new URLSearchParams({
        client_id: auth0Config.clientId,
        returnTo: returnTo
      }).toString();

    logger.info('User logging out via Auth0', { returnTo });

    return redirectDocument(logoutUrl, {
      headers: { "set-cookie": sessionCookie }
    });
  } catch (err) {
    logger.error('Logout failed:', err);

    // Fallback to local logout only
    return redirectDocument("/", {
      headers: { "set-cookie": await destroySession(session) }
    });
  }
}
