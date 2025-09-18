import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, defaultVisibility, TABLE_ID } from "./controls";
import { TaxonomyOrderItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const classId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomyOrderItem>(
    `TaxonomyOrders?$count=true&$orderby=code&$filter=taxonomyClassId eq ${classId}`
  );

  return exportToXls(request, listResult!.items, columnDef, defaultVisibility, TABLE_ID, 'export-rady');
}