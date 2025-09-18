import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { movementsColumnDef, movementsColumnDefVisibility, SPECIMEN_MOVEMENTS_TABLE_ID } from "./grid-columns";
import { flattenODataMovementsResult } from "./helpers";
import { TaxonomySpecimenMovementItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenMovementItem>(
    `movements?$count=true&$orderby=date&$filter=specimenId eq ${parentId}&$expand=incrementReason,decrementReason`
  );

  const movementsWithRelatedData = (listResult?.items || []).map(flattenODataMovementsResult);

  return exportToXls(request, movementsWithRelatedData, movementsColumnDef, movementsColumnDefVisibility, SPECIMEN_MOVEMENTS_TABLE_ID, 'export-pohyby');
}
