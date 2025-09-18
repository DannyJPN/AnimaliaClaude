import { LoaderFunctionArgs } from "react-router";
import { Specimens } from "~/routes/exemplar-list/models";
import { exportToXls } from "~/.server/export-xls";
import { columnDef, columnDefVisibility, SPECIMEN_LIST_TABLE_ID } from "~/routes/exemplar-list/controls";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { PagedSpecimensResponse } from "~/routes/exemplar-list/models";
import { tableParamsToApiParams, decodeTableParametersFromRequest } from "~/lib/table-params-encoder-decoder";

export async function loader({ request }: LoaderFunctionArgs) {
  const tableParams = decodeTableParametersFromRequest(request);

  const apiParams = tableParamsToApiParams({
    ...tableParams,
    pagination: {
      pageIndex: 1,
      pageSize: 5000
    }
  });

  const response = await apiCall(
    "api/Specimens/SpecimensView",
    "POST",
    JSON.stringify(apiParams),
    pziConfig
  );

  const results = await processResponse<PagedSpecimensResponse>(response);
  if (!results.success) {
    throw new Error("Failed to fetch specimens");
  }

  const items: Specimens[] = results.item?.items || [];

  return exportToXls(
    request,
    items,
    columnDef,
    columnDefVisibility,
    SPECIMEN_LIST_TABLE_ID,
    "export-specimens",
    true
  );
}
