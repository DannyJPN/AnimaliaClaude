import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { TaxonomyPhylumItem } from "./models";

export async function loader({ request }: LoaderFunctionArgs) {
  const [fetchError, listResult] = await fetchODataList<TaxonomyPhylumItem>(
    "TaxonomyPhyla?$count=true&$orderby=code"
  );

  return exportToXls(request, listResult!.items, columnDef, defaultVisibility, TABLE_ID, 'export-kmeny');
}
