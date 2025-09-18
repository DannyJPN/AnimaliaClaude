import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter"); // Get additional filter from query params

  if (!query) {
    return new Response("Query not specified", {
      status: 400
    });
  }

  let odataFilter = `$filter=contains(nameLat,'${query}')`;
  
  if (filter) {
    odataFilter = `$filter=contains(nameLat,'${query}') and (${filter})`;
  }

  const [fetchError, listResult] = await fetchODataList<{ id: number, nameLat: string }>(
    `TaxonomyClasses?$count=true&$orderby=nameLat&$select=id,nameLat&$top=15&${odataFilter}`
  );

  const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: item.nameLat
    };
  });

  return Response.json(autocompleteResults);
}
