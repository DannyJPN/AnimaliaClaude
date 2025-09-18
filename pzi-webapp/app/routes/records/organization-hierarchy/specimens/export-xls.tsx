import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";

import { SPECIMENS_TABLE_ID, columnDef, columnDefVisibility, } from "~/routes/records/taxonomy-hierarchy/specimens/grid-columns";
import { TaxonomySpecimenItemWithFlatRelatedData } from "~/routes/records/taxonomy-hierarchy/specimens/models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const locationId = Number(params.locationId);
  const speciesId  = Number(params.speciesId);

  const queryClauses = [
    "specimens?$count=true",
    `$filter=placementLocationId eq ${locationId} and speciesId eq ${speciesId}`,
    "$orderby=accessionNumber"
  ];

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenItemWithFlatRelatedData>(
    queryClauses.join("&")
  );
  
  const items = listResult?.items ?? [];

  return exportToXls(
    request,
    items,
    columnDef,
    columnDefVisibility,
    SPECIMENS_TABLE_ID,
    "export-exemplare"
  );
}
