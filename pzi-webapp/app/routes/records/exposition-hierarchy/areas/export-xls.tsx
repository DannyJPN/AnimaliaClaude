import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { ExpositionArea } from "../models";
import { AREAS_TABLE_ID, columnDef, defaultVisibility } from "./grid-definition";

export async function loader({ request }: LoaderFunctionArgs) {
  const queryClauses = [
    'ExpositionAreas?$count=true',
    '$orderby=name'
  ];

  const [fetchError, listResult] = await fetchODataList<ExpositionArea>(
    queryClauses.join('&')
  );

  return exportToXls(
    request,
    listResult!.items,
    columnDef,
    defaultVisibility,
    AREAS_TABLE_ID,
    "export-oddeleni"
  );
}
