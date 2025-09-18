import { useEffect, useState } from "react";
import { encodeColumnFilters } from "~/lib/table-params-encoder-decoder";

export type UseTableColumnFiltersManagementProps = {
  activeTableColumnFilters: Record<string, string[]>
};

export function useTableColumnFiltersManagement(props: UseTableColumnFiltersManagementProps) {
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, string[]>>({ ...props.activeTableColumnFilters });

  useEffect(() => {
    setTableColumnFilters(props.activeTableColumnFilters);
  }, [props.activeTableColumnFilters]);

  const updateTableColumnFilters = (key: string, valueToSet: string[] | undefined) => {
    let newValue = {
      ...tableColumnFilters
    };

    delete newValue[key];

    if (valueToSet) {
      newValue[key] = valueToSet;
    }

    setTableColumnFilters(newValue);
  };

  const setFilterParamsToQuery = (searchParams: URLSearchParams, setParams: (newParams: URLSearchParams) => void) => {
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

    setParams(newSearchParams);
  }

  const clearFilterParamsInQuery = (searchParams: URLSearchParams, setParams: (newParams: URLSearchParams) => void) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('columnFilters');
    newSearchParams.set("pageIndex", "1");

    setParams(newSearchParams);
  }

  return {
    tableColumnFilters,
    setTableColumnFilters,
    updateTableColumnFilters,
    setFilterParamsToQuery,
    clearFilterParamsInQuery
  };
}
