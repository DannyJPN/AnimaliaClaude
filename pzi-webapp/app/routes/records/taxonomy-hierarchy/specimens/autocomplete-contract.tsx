import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { ContractAutocompleteItem } from "./models";
import { SelectItemType } from "~/shared/models";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") ?? "";

  if (!query) {
    return new Response("Query not specified", {
      status: 400
    });
  }


  const filter = `$filter=contains(number,'${query}')`;

  const [fetchError, listResult] = await fetchODataList<ContractAutocompleteItem>(
    `contracts?$count=true&$orderby=number&select=id,number&$top=15&${filter}`
  );

  const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: item.number
    };
  });

  return Response.json(autocompleteResults);
}
