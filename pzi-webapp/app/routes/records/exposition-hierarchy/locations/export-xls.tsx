import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { Location } from "~/routes/records/organization-hierarchy/locations/models";
import { exportToXls } from "~/.server/export-xls";
import { columnDef, columnDefVisibility, LOCATIONS_TABLE_ID } from "~/routes/records/organization-hierarchy/locations/controls";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const [fetchError, listResult] = await fetchODataList<Location>(
    `locations?$count=true&$filter=expositionSetId eq ${params.parentId}&$expand=OrganizationLevel($select=id,name),ExpositionSet($select=id,name)`
  );

  const items: Location[] = listResult?.items || [];

  return exportToXls(
    request,
    items,
    columnDef,
    columnDefVisibility,
    LOCATIONS_TABLE_ID,
    "export-lokace"
  );
}
