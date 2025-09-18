import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { enumerationsToSelects } from "~/lib/mappers";
import { EnumerationType } from "~/shared/models";

export async function loader({ }: LoaderFunctionArgs) {
  const [actionTypesError, actionTypesResult] = await fetchODataList<EnumerationType>(
    'recordactiontypes?$orderby=sort'
  );

  const actionTypes = enumerationsToSelects(actionTypesResult?.items);

  return Response.json(actionTypes);
}
