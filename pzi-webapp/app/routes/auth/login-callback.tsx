import jwt from "jsonwebtoken";
import { LoaderFunctionArgs, redirectDocument } from "react-router";
import { commitSession } from "~/.server/session-storage";
import { getUserSession } from "~/.server/user-session";
import { apiCall, processResponse } from '../../.server/api-actions';
import { pziConfig } from "../../.server/pzi-config";
import { logger } from "~/.server/logger";

function verifyJwt(token: string, secret: string) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      }

      resolve(decoded);
    });
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;

  const token = searchParams.get("token");
  const returnUrl = searchParams.get("returnUrl") || "/";

  if (!token) {
    return new Response("Token not provided", {
      status: 400
    });
  }

  try {
    const refreshTokenUrl = `${pziConfig.SSO_AUTH_URL}/authenticate/refreshtoken`;
    const refreshTokenRequest = {
      Token: token
    };

    const refreshTokenResponse = await fetch(refreshTokenUrl, {
      method: "POST",
      body: JSON.stringify(refreshTokenRequest),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!refreshTokenResponse.ok) {
      throw new Error("Failed to retrieve user data");
    }

    const { token: newToken } = await refreshTokenResponse.json();

    const decodedToken = await verifyJwt(newToken, pziConfig.AUTH_SECRET) as jwt.JwtPayload;

    const userName: string = decodedToken["unique_name"];

    let roles: string[];

    if (!decodedToken["role"]) {
      roles = [];
    } else if (typeof decodedToken["role"] === "string") {
      roles = [decodedToken["role"]];
    } else {
      roles = decodedToken["role"]
    };

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

    return redirectDocument(returnUrl, {
      headers: { "set-cookie": await commitSession(session) }
    });
  } catch (err) {
    logger.error(err);

    return new Response("Invalid token", {
      status: 401
    });
  }
}
