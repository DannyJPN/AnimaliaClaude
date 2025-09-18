import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { columnDef, columnDefVisibility, CONTRACTS_TABLE_ID, flattenODataResult } from "./controls";
import { Contract } from "./models";
import { decodeTableParametersFromRequest } from "~/lib/table-params-encoder-decoder";
import { getFilterClause, getSortClause } from "./helpers";

export async function loader({ request }: LoaderFunctionArgs) {
  const tableParams = decodeTableParametersFromRequest(request);

  const queryParts = [
    `contracts?$count=true&$expand=partner,movementReason,contractType`,
    getSortClause(tableParams.sorting)
  ];

  const filterClause = getFilterClause(tableParams.columnFilters);

  if (filterClause) {
    queryParts.push(filterClause);
  }

  const [fetchError, listResult] = await fetchODataList<Contract>(
    queryParts.join('&')
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenODataResult);

  return exportToXls(request, itemsWithRelatedData, columnDef, columnDefVisibility, CONTRACTS_TABLE_ID, `export-dokumenty`);
}
