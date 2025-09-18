import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import {OrganizationLevelItem} from "~/routes/records/organization-hierarchy/models";
import {columnDef, defaultVisibility, DISTRICTS_TABLE_ID} from "~/routes/records/organization-hierarchy/districts/controls";


export async function loader({ request, params }: LoaderFunctionArgs) {
  const workplaceId = Number(params.parentId);

  const queryClauses = [
    "OrganizationLevels?$count=true",
    `$filter=level eq 'district' and parentId eq ${workplaceId}`,
    "$orderby=name"
  ];

  const [fetchError, listResult] = await fetchODataList<OrganizationLevelItem>(
    queryClauses.join("&")
  );
  
  return exportToXls(
    request,
    listResult!.items,
    columnDef,
    defaultVisibility,
    DISTRICTS_TABLE_ID,
    "export-useky"
  );
}