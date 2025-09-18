import { useEffect, useState } from "react";
import { decodeColumnFiltersFromSearchParams } from "~/lib/table-params-encoder-decoder";

export type UseTableColumnFilters = {
  searchParams: URLSearchParams,
  columnFilters: unknown,
};

export function useTableColumnFilters(props: UseTableColumnFilters) {
  const [activeTableColumnFilters, setActiveTableColumnFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const filterParams = decodeColumnFiltersFromSearchParams(props.searchParams);
    const filterDict = filterParams.reduce((acc, fp) => {
      acc[fp.id] = fp.value || [];
      return acc;
    }, {} as Record<string, string[]>);

    setActiveTableColumnFilters(filterDict);
  }, [props.columnFilters]);

  return {
    activeTableColumnFilters,
  };
}

