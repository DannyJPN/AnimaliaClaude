import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";
import { RegionAutocompleteItem } from "./models";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter"); // Get additional filter from query params

  if (!query) {
    return new Response("Query not specified", {
      status: 400
    });
  }

  let odataFilter = `$filter=contains(name,'${query}')`;
  
  if (filter) {
    odataFilter = `$filter=contains(name,'${query}') and (${filter})`;
  }

  const [fetchError, listResult] = await fetchODataList<RegionAutocompleteItem>(
    `Regions?$count=true&$orderby=section/SectionName&$expand=section($select=SectionName)&$select=id,name,code&${odataFilter}`
  );

    const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: [item.name, item.section.sectionName].filter(x => x).join(' | ')
    };
  });

  return Response.json(autocompleteResults);
}
