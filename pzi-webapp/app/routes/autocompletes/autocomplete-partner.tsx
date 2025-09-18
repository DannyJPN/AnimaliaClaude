import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") ?? "";

  if (!query) {
    return new Response("Query not specified", {
      status: 400
    });
  }

  const filter = `$filter=startswith(keyword,'${query}')`;

  const [fetchError, listResult] = await fetchODataList<{ id: number, keyword: string }>(
    `partners?$count=true&$orderby=keyword&select=id,keyword&$top=15&${filter}`
  );

  const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: item.keyword
    };
  });

  return Response.json(autocompleteResults);
}
