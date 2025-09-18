import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import {
  specimenPlacementsColumnDef,
  specimenPlacementsColumnDefVisibility,
  SPECIMEN_PLACEMENTS_TABLE_ID,
  flattenSpecimenPlacement,
} from "./grid-columns";
import { SpecimenPlacementFlattened, SpecimenPlacementItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<SpecimenPlacementItem>(
    `SpecimenPlacements?$count=true&$orderby=validSince&$filter=specimenId eq ${parentId}` +
    `&$expand=location($select=id,name),organizationLevel($select=id,name)`
  );

  const items: SpecimenPlacementFlattened[] = (listResult?.items || []).map(flattenSpecimenPlacement);

  return exportToXls(
    request,
    items,
    specimenPlacementsColumnDef,
    specimenPlacementsColumnDefVisibility,
    SPECIMEN_PLACEMENTS_TABLE_ID,
    'export-umistneni-exemplare'
  );
}