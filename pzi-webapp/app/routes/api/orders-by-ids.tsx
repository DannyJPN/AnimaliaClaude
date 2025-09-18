import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const requestSchema = z.object({
  ids: z.array(z.number())
});

export async function action({ request }: ActionFunctionArgs) {

  const { ids } = requestSchema.parse(await request.json());

  if (ids.length === 0) {
    return Response.json([]);
  }

  const [err, data] = await fetchODataList<{ id: number, nameLat?: string, nameCz?: string }>(
    `TaxonomyOrders?$filter=${ids.map((id) => `id eq ${id}`).join(' or ')}`
  );

  return Response.json(data?.items || []);
}
