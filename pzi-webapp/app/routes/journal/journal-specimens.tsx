import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { SpecimenOption } from "./models";
import { z } from "zod";

const ActionSchema = z.object({
  speciesId: z.number(),
  districtId: z.number()
});

export async function action({ request }: ActionFunctionArgs) {
  const { speciesId, districtId } = await ActionSchema.parseAsync(await request.json());

  const filterClause = `speciesId eq ${speciesId} and quantityInZoo gt 0 and organizationLevelId eq ${districtId}`;

  const queryClauses = [
    'Specimens?$count=true',
    `$filter=${filterClause}`,
    '$orderby=accessionNumber'
  ];

  const [fetchError, listResult] = await fetchODataList<{
    id: number,
    accessionNumber: number,
    name?: string,
    birthDate?: string,
    zims?: string,
    genderTypeCode?: string
  }>(
    queryClauses.join('&')
  );

  const specimensResults: SpecimenOption[] = listResult?.items || [];

  return Response.json(specimensResults);
}
