import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { exportToXls } from "~/.server/export-xls";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";
import { decodeTableParametersFromRequest, tableParamsToApiParams } from "~/lib/table-params-encoder-decoder";
import { columnDef, columnVisibility, TABLE_ID } from "./grid-definition";
import { JournalEntry, PagedResult } from "./models";

export async function loader({ request }: LoaderFunctionArgs) {

  const userName = await getUserName(request);

  const tableParams = decodeTableParametersFromRequest(request);
  const apiParams = tableParamsToApiParams(tableParams);

  const callParams = {
    ...apiParams,
    paging: {
      pageIndex: 1,
      pageSize: 5000
    },
    userName
  };

  const response = await apiCall(
    'api/JournalEntries/EntriesForUser',
    'POST',
    JSON.stringify(callParams),
    pziConfig
  );

  const results = await processResponse<PagedResult<JournalEntry>>(response);
  const items = results.item?.items || [];

  return exportToXls(request, items, columnDef, columnVisibility, TABLE_ID, 'export-denik');
}
