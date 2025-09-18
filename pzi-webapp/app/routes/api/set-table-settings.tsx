import { ActionFunctionArgs } from "react-router";
import { apiCall } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName, requireLoggedInUser } from "~/.server/user-session";

export async function action({ request }: ActionFunctionArgs) {
  await requireLoggedInUser(request);

  const userName = await getUserName(request);
  const settingsJson = await request.json();

  await apiCall(
    'api/usertablesettings/setsettings',
    "POST",
    JSON.stringify({
      userName,
      tableId: settingsJson.tableId,
      settings: JSON.stringify(settingsJson.settings)
    }),
    pziConfig
  );

  return new Response(null, {
    status: 200
  });
}
