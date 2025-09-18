import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

type ZooItem = {
  id: string,
  keyword: string
};

const ActionSchema = z.object({
  query: z.string().trim().min(1)
});

export async function action({ request }: ActionFunctionArgs) {
  const requestData = await ActionSchema.parseAsync(await request.json());
  const { query } = requestData;

  const filter = `$filter=startswith(keyword,'${query}')`;

  const [fetchError, listResult] = await fetchODataList<ZooItem>(
    `Zoos?$count=true&$orderby=keyword&select=id,keyword&$top=15&${filter}`
  );

  if (fetchError) {
    // TODO: Proper error handling
    console.error(fetchError);
    return Response.json([], { status: 500 });
  }

  const autocompleteResults: SelectItemType<string, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: item.keyword
    };
  });

  return Response.json(autocompleteResults);
}
