import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import {OrganizationLevelItem} from "~/routes/records/organization-hierarchy/models";
import {columnDef, defaultVisibility, WORKPLACES_TABLE_ID} from "~/routes/records/organization-hierarchy/workplaces/controls";


export async function loader({ request, params }: LoaderFunctionArgs) {
  const departmentId = Number(params.parentId);

  const queryClauses = [
    "OrganizationLevels?$count=true",
    `$filter=level eq 'workplace' and parentId eq ${departmentId}`,
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
    WORKPLACES_TABLE_ID,
    "export-pracoviste"
  );
}