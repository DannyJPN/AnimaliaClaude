import { redirect } from "react-router";
import { getSession } from "./session-storage";
import { pziConfig, PziConfig } from "./pzi-config";

export async function getUserSession(request: Request) {
  const session = await getSession(request.headers.get("cookie"));
  return session;
}

export async function getUserId(request: Request) {
  const userSession = await getUserSession(request);
  return userSession.get("userId");
}

export async function getUserName(request: Request) {
  const userSession = await getUserSession(request);
  return userSession.get("userName");
}

export async function getUserRoles(request: Request) {
  const userSession = await getUserSession(request);
  return userSession.get("roles");
}

export async function getVisibleTaxonomyStatusesList(request: Request) {
  const userSession = await getUserSession(request);
  const visibleTaxonomyStatuses = userSession.get("visibleTaxonomyStatuses") || ['N', 'A', 'D', 'Z'];

  return visibleTaxonomyStatuses;
}

export async function getTaxonomySearchBy(request: Request) {
  const userSession = await getUserSession(request);
  const taxonomySearchBy = userSession.get('taxonomySearchBy') || { 'cz': false, 'lat': true };

  return taxonomySearchBy;
}

export async function getUserPermissions(request: Request) {
  const userSession = await getUserSession(request);
  const permissions = userSession.get('permissions') || [];

  return permissions;
}

export async function requireLoggedInUser(
  request: Request,
  config: PziConfig = pziConfig,
  redirectTo: string = new URL(request.url).pathname,
) {
  const userId = await getUserId(request);

  if (userId === undefined) {
    const searchParams = new URLSearchParams([
      ["callback", config.SSO_CALLBACK_URL],
      ["returnUrl", redirectTo],
    ]);

    throw redirect(`${config.SSO_LOGIN_URL}?${searchParams}`);
  }
}
