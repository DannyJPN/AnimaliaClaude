import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const requestSchema = z.object({
  ids: z.array(z.number())
});

type ExpositionSetItem = {
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
  
  const [error, result] = await fetchODataList<ExpositionSetItem>(
    `ExpositionSets?$filter=${filterParam}&$orderby=name`
  );

  const items: ExpositionSetItem[] = result?.items || [];

  return Response.json(items);
}
