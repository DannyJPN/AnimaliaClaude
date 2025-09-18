import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

type SpeciesItem = {
  id: number,
  nameLat?: string,
  nameCz?: string
};

const ActionSchema = z.object({
  query: z.string().trim().min(1),
  ignoreIds: z.number().array().optional(),
  ignoreNotInZoo: z.boolean().optional(),
  filter: z.string().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const requestData = await ActionSchema.parseAsync(await request.json());
  const { filter, query, ignoreIds, ignoreNotInZoo } = requestData;

  let ignoreIdsFilter = '';

  if (ignoreIds && ignoreIds.length) {
    const ignoreClause = ignoreIds.map(id => `id ne ${id}`).join(' and ');
    ignoreIdsFilter = ` and (${ignoreClause})`;
  }

  const ignoreNotInZooFilter =  !ignoreNotInZoo  
    ? ''
    : ' and quantityInZoo gt 0'

  let queryLatFilter = `$filter=contains(nameLat,'${query}')${ignoreIdsFilter}${ignoreNotInZooFilter}`; 
  let queryCzFilter = `$filter=contains(nameCz,'${query}')${ignoreIdsFilter}${ignoreNotInZooFilter}`;

  if (filter) {
    queryLatFilter = `$filter=contains(nameLat,'${query}')${ignoreIdsFilter}${ignoreNotInZooFilter} and (${filter})`;
    queryCzFilter = `$filter=contains(nameCz,'${query}')${ignoreIdsFilter}${ignoreNotInZooFilter} and (${filter})`;
  }

  const queryLatClauses = [
    'Species?$count=true',
    queryLatFilter,
    '$orderby=nameLat',
    '$top=15'
  ];

  const queryCzClauses = [
    'Species?$count=true',
    queryCzFilter,
    '$orderby=nameLat',
    '$top=15'
  ];

  const [latResults, czResults] = await Promise.all([
    fetchODataList<SpeciesItem>(queryLatClauses.join('&')),
    fetchODataList<SpeciesItem>(queryCzClauses.join('&'))
  ]);

  const [latError, latData] = latResults;
  const [czError, czData] = czResults;

  const latItems = latData?.items || [];
  const czItems = czData?.items || [];

  const mergedItems = new Map<number, SpeciesItem>();

  latItems.forEach(item => {
    mergedItems.set(item.id, item);
  });

  czItems.forEach(item => {
    if (!mergedItems.has(item.id)) {
      mergedItems.set(item.id, item);
    }
  });

  const speciesResults: SelectItemType<number, string>[] = Array.from(mergedItems.values())
    .slice(0, 15)
    .map((item) => ({
      key: item.id,
      text: `${item.nameLat}${item.nameCz ? ` (${item.nameCz})` : ''}`
    }));

  return Response.json(speciesResults);
}
