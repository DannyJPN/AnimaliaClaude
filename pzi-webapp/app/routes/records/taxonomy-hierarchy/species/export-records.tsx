import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { flattenODataSpeciesRecordsResult, recordsColumnDef, recordsColumnDefVisibility, SPECIES_RECORDS_TABLE_ID } from "./grid-definitions";
import { TaxononomySpeciesRecordItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxononomySpeciesRecordItem>(
    `recordspecies?$count=true&$orderby=date&$filter=speciesId eq ${parentId}&$expand=actionType`
  );

  const itemsWithRelatedData: TaxononomySpeciesRecordItem[] = (listResult?.items || []).map(flattenODataSpeciesRecordsResult);

  return exportToXls(request, itemsWithRelatedData, recordsColumnDef, recordsColumnDefVisibility, SPECIES_RECORDS_TABLE_ID, 'export-zaznamy-druhu');
}
