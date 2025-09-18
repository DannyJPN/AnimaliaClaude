import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, columnDefVisibility, TABLE_ID } from "../../taxonomy-hierarchy/species/grid-definitions";
import { OrgSpeciesResultItem } from "./list";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const locationId = Number(params.parentId);

  const queryClauses = [
    "Species?$count=true",
    `$filter=specimens/any(s:s/placementLocationId eq ${locationId})`,
    "$orderby=code",
  ];

  const [fetchError, listResult] = await fetchODataList<OrgSpeciesResultItem>(
    queryClauses.join("&")
  );
  
  const items = listResult?.items ?? [];

  return exportToXls(
    request,
    items,
    columnDef,
    columnDefVisibility,
    TABLE_ID,
    "export-druhy"
  );
}