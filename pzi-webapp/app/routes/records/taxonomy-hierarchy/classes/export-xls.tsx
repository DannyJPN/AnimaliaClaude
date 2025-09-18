import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { TaxonomyClassItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const phylumId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomyClassItem>(
    `taxonomyclasses?$count=true&$orderby=code&$filter=taxonomyPhylumId eq ${phylumId}`
  );

  return exportToXls(request, listResult!.items, columnDef, defaultVisibility, TABLE_ID, 'export-tridy');
}
