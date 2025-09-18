import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SelectItemType } from "~/shared/models";

const levelEnum = z.enum(['department', 'workplace', 'district']);
type LevelType = z.infer<typeof levelEnum>;

const requestSchema = z.object({
  query: z.string().default(''),
  levels: z.array(levelEnum).default([]),
  ignoreIds: z.array(z.number()).optional()
});

type OrganizationLevelItem = {
  id: number;
  name: string;
  level: LevelType;
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { query, levels, ignoreIds } = requestSchema.parse(requestBody);

  if (query.length < 2 && levels.length === 0) {
    return Response.json([]);
  }

  let filterConditions = [];
  
  if (levels.length > 0) {
    const levelFilter = levels
      .map((level) => `level eq '${level}'`)
      .join(' or ');
    filterConditions.push(`(${levelFilter})`);
  }
  
  if (query.length >= 2) {
    filterConditions.push(`contains(name, '${query}')`);
  }

  if (ignoreIds && ignoreIds.length > 0) {
    const ignoreClause = ignoreIds.map(id => `id ne ${id}`).join(' and ');
    filterConditions.push(`(${ignoreClause})`);
  }

  const filterParam = filterConditions.join(' and ');
  const [error, result] = await fetchODataList<OrganizationLevelItem>(
    `OrganizationLevels?$filter=${filterParam}&$orderby=name&$top=15`
  );

  if (error) {
    console.error("Autocomplete fetch error:", error);
    return new Response(JSON.stringify([]), { status: 500 });
  }

  const items: OrganizationLevelItem[] = result?.items || [];

  const orgLevelResults: SelectItemType<number, string>[] = items.map((item) => ({
    key: item.id,
    text: item.name
  }));

  return Response.json(orgLevelResults);
}
