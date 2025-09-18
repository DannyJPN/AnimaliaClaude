import { ActionFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";

export interface PartnerAutocompleteResult {
  id: number;
  keyword: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const query = formData.get("query") as string;

  if (!query || query.length < 2) {
    return Response.json([]);
  }

  const response = await apiCall(
    'api/Search/PartnersAutocomplete',
    "POST",
    JSON.stringify({
      searchText: query,
    }),
    pziConfig
  );

  const results = await processResponse<PartnerAutocompleteResult[]>(response);

  return Response.json(results.item || []);
}
