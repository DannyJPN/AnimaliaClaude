import { MRT_VisibilityState } from "material-react-table";
import { encodeColumnFilters } from "./table-params-encoder-decoder";

export function createPostTableSettingsHandler(tableId: string) {
  return (visibility: Record<string, boolean>, order: string[], pageSize?: number) => {
    fetch("/api/set-table-settings", {
      method: "POST",
      body: JSON.stringify({
        tableId: tableId,
        settings: {
          columnOrder: order,
          columnVisibility: visibility,
          pageSize
        }
      })
    });
  };
};

export type PostTableSettingsHandler = ReturnType<typeof createPostTableSettingsHandler>;

function checkEqual(obj: any, other: any) {
  if (!obj && !other) {
    return true;
  }

  if (!obj && other) {
    return false;
  }

  if (obj && !other) {
    return false;
  }

  const objKeys = Object.keys(obj);
  const otherKeys = Object.keys(other);

  if (objKeys.length !== otherKeys.length) {
    return false;
  }

  return !objKeys.some((k) => obj[k] !== other[k]);
}

export function handleTableSettingsChange(
  currentVisibility: MRT_VisibilityState, newVisibility: MRT_VisibilityState,
  currentColumnOrder: string[], newColumnOrder: string[],
  onChanged: (newVisibility: MRT_VisibilityState, newColumnOrder: string[]) => void) {
  const visibilityChanged = !checkEqual(currentVisibility, newVisibility);
  const orderChanged = !checkEqual(currentColumnOrder, newColumnOrder);

  if (visibilityChanged || orderChanged) {
    onChanged(newVisibility, newColumnOrder);
  }
}

export function applyTableFilters(
  tableColumnFilters: Record<string, string[]>,
  searchParams: URLSearchParams,
  applyNewParams: (newParams: URLSearchParams) => void) {

  const filtersToApply = Object
    .keys(tableColumnFilters)
    .filter((id) => {
      return tableColumnFilters[id] && tableColumnFilters[id].length > 0;
    })
    .map((id) => {
      return {
        id,
        value: tableColumnFilters[id]
      };
    });

  const filterParam = encodeColumnFilters(filtersToApply);

  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.set('columnFilters', filterParam);
  newSearchParams.set("pageIndex", "1");

  applyNewParams(newSearchParams);
}
