import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { ExpositionSet } from "../models";
import { SETS_TABLE_ID, columnDef, defaultVisibility } from "./grid-definition";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const queryClauses = [
    `ExpositionSets?$count=true&$expand=expositionArea`,
    `$filter=expositionAreaId eq ${params.parentId}`,
    '$orderby=name'
  ];

  const [fetchError, listResult] = await fetchODataList<ExpositionSet>(
    queryClauses.join('&')
  );

  return exportToXls(
    request,
    listResult!.items,
    columnDef,
    defaultVisibility,
    SETS_TABLE_ID,
    "export-soubory"
  );
}
