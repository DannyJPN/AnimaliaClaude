import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

type GenusItem = {
  id: number,
  nameLat?: string,
  nameCz?: string
};

const ActionSchema = z.object({
  query: z.string().trim().min(2),
  ignoreIds: z.number().array().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const requestData = await ActionSchema.parseAsync(await request.json());
  const { query, ignoreIds } = requestData;

  let ignoreIdsFilter = '';

  if (ignoreIds && ignoreIds.length) {
    const ignoreClause = ignoreIds.map(id => `id ne ${id}`).join(' and ');
    ignoreIdsFilter = ` and (${ignoreClause})`;
  }

  const queryLatClauses = [
    'TaxonomyGenera?$count=true',
    `$filter=contains(nameLat,'${query}')${ignoreIdsFilter}`,
    '$orderby=nameLat',
    '$top=15'
  ];

  const queryCzClauses = [
    'TaxonomyGenera?$count=true',
    `$filter=contains(nameCz,'${query}')${ignoreIdsFilter}`,
    '$orderby=nameLat',
    '$top=15'
  ];

  const [latResults, czResults] = await Promise.all([
    fetchODataList<GenusItem>(queryLatClauses.join('&')),
    fetchODataList<GenusItem>(queryCzClauses.join('&'))
  ]);

  const [latError, latData] = latResults;
  const [czError, czData] = czResults;

  const latItems = latData?.items || [];
  const czItems = czData?.items || [];

  const mergedItems = new Map<number, GenusItem>();

  latItems.forEach(item => {
    mergedItems.set(item.id, item);
  });

  czItems.forEach(item => {
    if (!mergedItems.has(item.id)) {
      mergedItems.set(item.id, item);
    }
  });

  const generaResults: SelectItemType<number, string>[] = Array.from(mergedItems.values())
    .slice(0, 15)
    .map((item) => ({
      key: item.id,
      text: `${item.nameLat} (${item.nameCz || ''})`
    }));

  return Response.json(generaResults);
}
