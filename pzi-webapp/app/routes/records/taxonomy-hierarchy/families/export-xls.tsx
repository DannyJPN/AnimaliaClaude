import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { TaxonomyFamilyItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomyFamilyItem>(
    `taxonomyfamilies?$count=true&$orderby=code&$filter=taxonomyOrderId eq ${parentId}`
  );

  return exportToXls(request, listResult!.items, columnDef, defaultVisibility, TABLE_ID, 'export-celede');
}