import exceljs from "exceljs";
import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, columnDefVisibility, SPECIMENS_TABLE_ID } from "./grid-columns";
import { flattenODataResult } from "./helpers";
import { TaxonomySpecimenItem, TaxonomySpecimenItemWithFlatRelatedData } from "./models";
import { exportToXls } from "~/.server/export-xls";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenItem>(
    `specimens?$count=true&$orderby=accessionNumber desc&$filter=speciesId eq ${parentId}&$expand=father($expand=species($select=id,code,nameLat);$select=id,species,accessionNumber,zims),mother($expand=species($select=id,code,nameLat);$select=id,species,accessionNumber,zims),inLocation($select=keyword),outLocation($select=keyword),inReason($select=displayName),outReason($select=displayName)`
  );

  const specimensWithRelatedData: TaxonomySpecimenItemWithFlatRelatedData[] = (listResult?.items || []).map(flattenODataResult);

  return exportToXls(request, specimensWithRelatedData, columnDef, columnDefVisibility, SPECIMENS_TABLE_ID, 'export-exemplare');
}
