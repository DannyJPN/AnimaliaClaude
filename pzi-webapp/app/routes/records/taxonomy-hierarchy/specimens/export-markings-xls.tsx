import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { flattenMarking, markingsColumnDef, markingsColumnDefVisibility, SPECIMEN_MARKINGS_TABLE_ID } from "./grid-columns";
import { TaxonomySpecimenMarkingItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenMarkingItem>(
    `markings?$count=true&$orderby=markingDate&$filter=specimenId eq ${parentId}&$expand=markingType($select=code,displayName)`
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenMarking);

  return exportToXls(request, itemsWithRelatedData, markingsColumnDef, markingsColumnDefVisibility, SPECIMEN_MARKINGS_TABLE_ID, 'export-znaceni');
}
