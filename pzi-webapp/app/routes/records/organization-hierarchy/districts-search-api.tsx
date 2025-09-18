import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const requestSchema = z.object({
  query: z.string().default('')
});

export type DistrictItem = {
  id: number,
  name: string,
  parentId: number
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { query } = requestSchema.parse(requestBody);

  if (query.length < 1) {
    return Response.json([]);
  }

  let filterConditions = [
    "level eq 'district'"
  ];

  if (query.length >= 1) {
    filterConditions.push(`contains(name, '${query}')`);
  }

  const filterParam = filterConditions.join(' and ');
  const [error, result] = await fetchODataList<DistrictItem>(
    `OrganizationLevels?$filter=${filterParam}&$orderby=name&$top=15`
  );

  if (error) {
    console.error("Autocomplete fetch error:", error);
    return new Response(JSON.stringify([]), { status: 500 });
  }

  const items: DistrictItem[] = result?.items || [];

  return Response.json(items);
}
