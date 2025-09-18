import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, columnDefVisibility, TABLE_ID } from "./grid-definitions";
import { TaxonomySpeciesItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpeciesItem>(
    `species?$count=true&$orderby=code&$filter=taxonomyGenusId eq ${parentId}`
  );

  const itemsWithRelatedData: TaxonomySpeciesItem[] = (listResult?.items || []).map(x => x);

  return exportToXls(request, itemsWithRelatedData, columnDef, columnDefVisibility, TABLE_ID, 'export-druhy');
}
