import { LoaderFunctionArgs, redirectDocument } from "react-router";
import { apiCall, processResponse } from '~/.server/api-actions';
import { pziConfig } from "~/.server/pzi-config";
import { commitSession } from "~/.server/session-storage";
import { getUserSession } from "~/.server/user-session";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!pziConfig.ALLOW_TEST_LOGIN) {
    return new Response('Not allowed', {
      status: 405
    });
  }

  const searchParams = new URL(request.url).searchParams;
  const userParam = searchParams.get("u");

  let testLoginToUse = pziConfig.TEST_LOGINS
        .find((tl) => tl.name?.toUpperCase() === userParam?.toUpperCase());

  if (!testLoginToUse) {
    testLoginToUse = {
      name: 'test-user',
      roles: ['CN=SG_zoopraha_Metazoa_Dokumentacni,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local']
    };
  }

  const { name: userName, roles } = testLoginToUse;

  const userLoggedInRequest = {
    userName,
    roles
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

  const session = await getUserSession(request);

  session.set("userId", parsedUserResponse.item!.userId);
  session.set("userName", userName);
  session.set("roles", roles);
  session.set("visibleTaxonomyStatuses", parsedUserResponse.item!.visibleTaxonomyStatuses);
  session.set('taxonomySearchBy', { 'cz': parsedUserResponse.item!.taxonomySearchByCz, 'lat': parsedUserResponse.item!.taxonomySearchByLat });
  session.set('permissions', parsedUserResponse.item!.permissions || []);

  return redirectDocument('/', {
    headers: { "set-cookie": await commitSession(session) }
  });
}
