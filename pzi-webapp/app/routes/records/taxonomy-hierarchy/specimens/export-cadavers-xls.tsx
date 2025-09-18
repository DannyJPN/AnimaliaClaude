import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { cadaversColumnDef, cadaversColumnDefVisibility, flattenCadaver, SPECIMEN_CADAVERS_TABLE_ID } from "./grid-columns";
import { TaxonomySpecimenCadaverItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenCadaverItem>(
    `cadavers?$count=true&$orderby=date&$filter=specimenId eq ${parentId}`
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenCadaver);

  return exportToXls(request, itemsWithRelatedData, cadaversColumnDef, cadaversColumnDefVisibility, SPECIMEN_CADAVERS_TABLE_ID, 'export-kadaver');
}
