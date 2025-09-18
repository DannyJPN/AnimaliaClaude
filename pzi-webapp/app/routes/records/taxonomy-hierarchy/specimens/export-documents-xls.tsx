import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { documentsColumnDef, documentsColumnDefVisibility, flattenDocument, SPECIMEN_DOCUMENTS_TABLE_ID } from "./grid-columns";
import { TaxonomySpecimenDocumentItem } from "./models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenDocumentItem>(
    `documentspecimens?$count=true&$orderby=date&$filter=specimenId eq ${parentId}`
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenDocument);

  return exportToXls(request, itemsWithRelatedData, documentsColumnDef, documentsColumnDefVisibility, SPECIMEN_DOCUMENTS_TABLE_ID, 'export-dokumenty');
}
