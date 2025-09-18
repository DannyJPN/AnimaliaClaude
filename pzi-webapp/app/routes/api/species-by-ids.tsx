import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const ActionSchema = z.object({
  ids: z.number().array()
});

export async function action({ request }: ActionFunctionArgs) {
  const { ids } = await ActionSchema.parseAsync(await request.json());

  const [err, data] = await fetchODataList<{ id: number, nameLat?: string, nameCz?: string }>(`Species?$filter=${ids.map((id) => `id eq ${id}`).join(' or ')}`);

  return Response.json(data?.items || []);
}
