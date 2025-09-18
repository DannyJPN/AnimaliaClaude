import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";

const requestSchema = z.object({
  query: z.string().default('')
});

export type LocationItem = {
  id: number;
  name: string;
  expositionSetId: number;
};

export async function action({ request }: ActionFunctionArgs) {
  const requestBody = await request.json();
  const { query } = requestSchema.parse(requestBody);

  if (query.length < 1) {
    return Response.json([]);
  }

  const sanitizedQuery = query.replace(/'/g, "''");
  const filter = `contains(name,'${sanitizedQuery}')`;

  const odataQuery = [
    `Locations?$filter=${filter}`,
    `$orderby=name`,
    `$top=15`,
    `$select=id,name,expositionSetId`
  ].join('&');

  const [error, result] = await fetchODataList<LocationItem>(odataQuery);

  if (error) {
    console.error("Locations search error:", error);
    return new Response(JSON.stringify([]), { status: 500 });
  }

  const items: LocationItem[] = (result?.items || []).map(loc => ({
    id: loc.id,
    name: loc.name,
    expositionSetId: loc.expositionSetId
  }));

  return Response.json(items);
}
