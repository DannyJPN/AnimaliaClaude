import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const requestSchema = z.object({
  ids: z.array(z.number())
});

type LocationItem = {
  id: number;
  name: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { ids } = requestSchema.parse(requestBody);

  if (ids.length === 0) {
    return Response.json([]);
  }

  const idConditions = ids.map(id => `id eq ${id}`).join(' or ');
  const filterParam = `(${idConditions})`;
  
  const [error, result] = await fetchODataList<LocationItem>(
    `Locations?$filter=${filterParam}&$orderby=name`
  );

  const items: LocationItem[] = result?.items || [];

  return Response.json(items);
}
