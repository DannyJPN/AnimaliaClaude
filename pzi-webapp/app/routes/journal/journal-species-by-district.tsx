import { ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { fetchODataList } from "~/.server/odata-api";
import { SpeciesItem } from "./models";

const ActionSchema = z.object({
  districtId: z.number()
});

export async function action({ request }: ActionFunctionArgs) {
  const requestData = await ActionSchema.parseAsync(await request.json());

  const [_, results] = await fetchODataList<SpeciesItem>([
    'Species?$count=true',
    `$filter=specimens/any(s:s/organizationLevelId eq ${requestData.districtId} and s/quantityInZoo gt 0)`,

  ].join('&'));

  return Response.json(results?.items || []);
};


