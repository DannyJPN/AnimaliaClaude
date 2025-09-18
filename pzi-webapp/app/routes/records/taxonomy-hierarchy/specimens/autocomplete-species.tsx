import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { TaxonomySpeciesAutocompleteItem } from "./models";
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

  const filterParts: string[] = [];

  // Add name search conditions
  filterParts.push(`contains(nameLat,'${query}')`);
  filterParts.push(`contains(nameCz,'${query}')`);

  // Build the OData filter
  let odataFilter = `$filter=${filterParts.join(' or ')}`;
  
  // If additional filter is provided, add it with AND condition
  if (filter) {
    odataFilter = `$filter=(${filterParts.join(' or ')}) and (${filter})`;
  }

  const [fetchError, listResult] = await fetchODataList<TaxonomySpeciesAutocompleteItem>(
    `species?$count=true&$orderby=nameLat&$select=id,nameLat,nameCz&$top=20&${odataFilter}`
  );

  const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: [item.nameLat, item.nameCz].filter(x => x).join(' / ')
    };
  });

  return Response.json(autocompleteResults);
}
