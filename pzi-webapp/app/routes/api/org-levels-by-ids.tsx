import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const ActionSchema = z.object({
  ids: z.number().array()
});

type OrganizationLevelItem = {
  id: number;
  name: string;
  level: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const { ids } = await ActionSchema.parseAsync(await request.json());

  if (ids.length === 0) {
    return Response.json([]);
  }

  const [err, data] = await fetchODataList<OrganizationLevelItem>(
    `OrganizationLevels?$filter=${ids.map((id) => `id eq ${id}`).join(' or ')}`
  );

  return Response.json(data?.items || []);
}
