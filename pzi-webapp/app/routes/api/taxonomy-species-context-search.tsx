import { ActionFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getVisibleTaxonomyStatusesList } from "~/.server/user-session";

export interface SpeciesAutocompleteResult {
  id: number;
  taxonomyGenusId: number;
  nameLat?: string;
  nameCz?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const statuses = await getVisibleTaxonomyStatusesList(request);

  // Parse the form data from the request
  const formData = await request.formData();
  const query = formData.get("query") as string;
  const searchNameLat = formData.get("searchNameLat") === "true";
  const searchNameCz = formData.get("searchNameCz") === "true";

  // Make sure we have a query
  if (!query || query.length < 2) {
    return Response.json([]);
  }

  // Make sure at least one search option is selected
  if (!searchNameLat && !searchNameCz) {
    return Response.json([]);
  }

  const response = await apiCall(
    'api/Search/SpeciesAutocomplete',
    "POST",
    JSON.stringify({
      searchText: query,
      searchNameLat,
      searchNameCz,
      zooStatusCodes: statuses.length !== 4
        ? statuses
        : []
    }),
    pziConfig
  );

  const results = await processResponse<SpeciesAutocompleteResult[]>(response);

  return Response.json(results.item || []);
}
