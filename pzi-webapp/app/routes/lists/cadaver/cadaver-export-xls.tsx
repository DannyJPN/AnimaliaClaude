import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { exportToXls } from "~/.server/export-xls";
import { CadaverPartner } from "./models";
import { CADAVER_PARTNERS_TABLE_ID, columnDef, columnDefVisibility } from "./controls";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [fetchError, listResult] = await fetchODataList<CadaverPartner>(
    'cadaverpartners?$count=true&$orderby=name'
  );

  return exportToXls(
    request,
    listResult!.items,
    columnDef,
    columnDefVisibility,
    CADAVER_PARTNERS_TABLE_ID,
    "export-cadaver-partners"
  );
}