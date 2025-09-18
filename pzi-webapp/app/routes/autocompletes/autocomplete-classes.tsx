import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

type ClassItem = {
  id: number,
  nameLat?: string,
  nameCz?: string
};

const ActionSchema = z.object({
  query: z.string().trim().min(2),
  ignoreIds: z.number().array().optional(),
  filter: z.string().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const requestData = await ActionSchema.parseAsync(await request.json());
  const { filter, query, ignoreIds } = requestData;

  let ignoreIdsFilter = '';

  if (ignoreIds && ignoreIds.length) {
    const ignoreClause = ignoreIds.map(id => `id ne ${id}`).join(' and ');
    ignoreIdsFilter = ` and (${ignoreClause})`;
  }

  let queryLatFilter = `$filter=contains(nameLat,'${query}')${ignoreIdsFilter}`; 
  let queryCzFilter = `$filter=contains(nameCz,'${query}')${ignoreIdsFilter}`;

  if (filter) {
    queryLatFilter = `$filter=contains(nameLat,'${query}')${ignoreIdsFilter} and (${filter})`;
    queryCzFilter = `$filter=contains(nameCz,'${query}')${ignoreIdsFilter} and (${filter})`;
  }

  const queryLatClauses = [
    'TaxonomyClasses?$count=true',
    queryLatFilter,
    '$orderby=nameLat',
    '$top=15'
  ];

  const queryCzClauses = [
    'TaxonomyClasses?$count=true',
    queryCzFilter,
    '$orderby=nameLat',
    '$top=15'
  ];

  const [latResults, czResults] = await Promise.all([
    fetchODataList<ClassItem>(queryLatClauses.join('&')),
    fetchODataList<ClassItem>(queryCzClauses.join('&'))
  ]);

  const [latError, latData] = latResults;
  const [czError, czData] = czResults;

  const latItems = latData?.items || [];
  const czItems = czData?.items || [];

  const mergedItems = new Map<number, ClassItem>();

  latItems.forEach(item => {
    mergedItems.set(item.id, item);
  });

  czItems.forEach(item => {
    if (!mergedItems.has(item.id)) {
      mergedItems.set(item.id, item);
    }
  });

  const classResults: SelectItemType<number, string>[] = Array.from(mergedItems.values())
    .slice(0, 15)
    .map((item) => ({
      key: item.id,
      text: `${item.nameLat}${item.nameCz ? ` (${item.nameCz})` : ''}`
    }));

  return Response.json(classResults);
}
