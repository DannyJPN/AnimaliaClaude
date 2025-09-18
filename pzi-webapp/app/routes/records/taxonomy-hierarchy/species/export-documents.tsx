import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { documentsColumnDef, documentsColumnDefisibility, flattenODataSpeciesDocumentResult, SPECIES_DOCUMENS_TABLE_ID } from "./grid-definitions";
import { TaxonomySpeciesDocumentItem, TaxonomySpeciesDocumentItemWithFlatRelatedData } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpeciesDocumentItem>(
    `documentspecies?$count=true&$orderby=date&$filter=speciesId eq ${parentId}&$expand=documentType`
  );

  const itemsWithRelatedData: TaxonomySpeciesDocumentItemWithFlatRelatedData[] = (listResult?.items || []).map(flattenODataSpeciesDocumentResult);

  return exportToXls(request, itemsWithRelatedData, documentsColumnDef, documentsColumnDefisibility, SPECIES_DOCUMENS_TABLE_ID, 'export-dokumenty-druhu');
}
