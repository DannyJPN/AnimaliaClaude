import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { flattenRecord, recordsColumnDef, recordsColumnDefVisibility, SPECIMEN_RECORDS_TABLE_ID } from "./grid-columns";
import { TaxonomySpecimenRecordItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenRecordItem>(
    `recordspecimens?$count=true&$orderby=date&$filter=specimenId eq ${parentId}&$expand=actionType($select=code,displayName)`
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenRecord);

  return exportToXls(request, itemsWithRelatedData, recordsColumnDef, recordsColumnDefVisibility, SPECIMEN_RECORDS_TABLE_ID, 'export-zaznamy');
}
