import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import {OrganizationLevelItem} from "~/routes/records/organization-hierarchy/models";
import {columnDef, defaultVisibility, DEPARTMENTS_TABLE_ID} from "~/routes/records/organization-hierarchy/departments/controls";


export async function loader({ request }: LoaderFunctionArgs) {
  const queryClauses = [
    "OrganizationLevels?$count=true",
    "$filter=level eq 'department'",
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
    DEPARTMENTS_TABLE_ID,
    "export-oddeleni"
  );
}