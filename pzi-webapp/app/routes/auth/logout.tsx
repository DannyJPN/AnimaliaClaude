import { LoaderFunctionArgs, redirectDocument } from "react-router";
import { destroySession } from "~/.server/session-storage";
import { getUserSession } from "~/.server/user-session";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getUserSession(request);

  return redirectDocument("/", {
    headers: { "set-cookie": await destroySession(session) }
  });
}
