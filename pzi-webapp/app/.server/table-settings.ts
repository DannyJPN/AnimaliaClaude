import { TableSettings } from "~/shared/models";
import { fetchODataList } from "./odata-api";

export async function fetchTableSettings(userName: string, tableId: string, defaultValue: TableSettings = {}): Promise<TableSettings> {
  const [fetchError, listResult] = await fetchODataList<{ settings: string }>(
    `UserTableSettings?$filter=tableId eq '${tableId}' and user/userName eq '${userName}'`
  );

  if (listResult?.items && listResult.items.length > 0) {
    return JSON.parse(listResult.items[0].settings);
  }

  return defaultValue;
}
