import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

const requestSchema = z.object({
  query: z.string().default(''),
  ignoredIds: z.array(z.number()).optional()
});

type ExpositionSetItem = {
  id: number;
  name: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { query, ignoredIds } = requestSchema.parse(requestBody);

  if (query.length < 1) {
    return Response.json([]);
  }

  const filterConditions: string[] = [];

  if (query.length >= 1) {
    filterConditions.push(`contains(name, '${query}')`);
  }

  if (ignoredIds && ignoredIds.length > 0) {
    const ignoreClause = ignoredIds.map(id => `id ne ${id}`).join(" and ");
    filterConditions.push(`(${ignoreClause})`);
  }

  const filterParam = filterConditions.join(' and ');
  const [error, result] = await fetchODataList<ExpositionSetItem>(
    `ExpositionSets?$filter=${filterParam}&$orderby=name&$top=15`
  );

  if (error) {
    console.error("Autocomplete fetch error:", error);
    return new Response(JSON.stringify([]), { status: 500 });
  }

  const items: ExpositionSetItem[] = result?.items || [];

  const options: SelectItemType<number, string>[] = items.map((item) => ({
    key: item.id,
    text: item.name
  }));

  return Response.json(options);
}
