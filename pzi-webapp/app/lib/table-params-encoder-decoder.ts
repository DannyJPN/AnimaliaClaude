export function decodeTableParametersFromRequest(request: Request, init?: {
  defaultPageSize?: number
}) {
  const defaultPageSize = init?.defaultPageSize || 10;

  const searchParams = new URL(request.url).searchParams;

  const pageIndex = parseInt(searchParams.get('pageIndex') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || defaultPageSize.toString());

  const sortingParam = searchParams.get('sorting');
  const columnFilterParam = searchParams.get("columnFilters");

  const sorting = !sortingParam
    ? []
    : sortingParam.split(",").map((sort) => {
      const [id, order] = sort.split(".");
      if (!id) throw new Error("Invalid sorting");
      if (order !== "asc" && order !== "desc") {
        throw new Error("Invalid sorting");
      }
      return { id, desc: order === "desc" };
    });

  const columnFilters = !columnFilterParam
    ? []
    : columnFilterParam.split(",").map((item) => {
      const [id, stringValue] = item.split(".");
      if (!id) throw new Error("Invalid columnFilters");
      if (stringValue === undefined) throw new Error("Invalid columnFilters");

      const parsedValue: string | string[] | undefined = stringValue === "undefined"
        ? undefined
        : JSON.parse(decodeURIComponent(stringValue));

      const filterValue = parsedValue === undefined
        ? undefined
        : Array.isArray(parsedValue)
          ? parsedValue
          : [parsedValue];

      return {
        id,
        value: filterValue
      };
    })
      .filter((x) => x !== null);

  return {
    pagination: { pageIndex, pageSize },
    sorting: sorting,
    columnFilters
  };
};

export function decodeColumnFiltersFromSearchParams(searchParams: URLSearchParams) {
  const columnFilterParam = searchParams.get("columnFilters");

  const columnFilters = !columnFilterParam
    ? []
    : columnFilterParam.split(",").map((item) => {
      const [id, stringValue] = item.split(".");
      if (!id) throw new Error("Invalid columnFilters");
      if (stringValue === undefined) throw new Error("Invalid columnFilters");

      const parsedValue: string | string[] | undefined = stringValue === "undefined"
        ? undefined
        : JSON.parse(decodeURIComponent(stringValue));

      const filterValue = parsedValue === undefined
        ? undefined
        : Array.isArray(parsedValue)
          ? parsedValue
          : [parsedValue];

      return {
        id,
        value: filterValue
      };
    })
      .filter((x) => x !== null);

  return columnFilters;
}

export function encodeColumnFilters(value: { id: string, value: string[] }[]) {
  return value
    .map(
      (v) =>
        `${v.id}.${encodeURIComponent(JSON.stringify(v.value)).replaceAll(".", "%2E")}`,
    )
    .join(",");
}

export function getExportXlsUrl(exportBaseUrl: string, searchParams: URLSearchParams) {
  const tableFilters = searchParams.get("columnFilters");
  const tableSorting = searchParams.get("sorting");

  const paramsToApply: string[] = [];

  if (tableFilters) {
    paramsToApply.push(`columnFilters=${tableFilters}`);
  }

  if (tableSorting) {
    paramsToApply.push(`sorting=${tableSorting}`);
  }

  return `${exportBaseUrl}?${paramsToApply.join('&')}`;
}

export function tableParamsToApiParams(tableParams: ReturnType<typeof decodeTableParametersFromRequest>) {
  const paging = {
    pageIndex: tableParams.pagination.pageIndex,
    pageSize: tableParams.pagination.pageSize,
  };

  const sorting = tableParams.sorting.map((s) => {
    return {
      sortId: s.id,
      dir: s.desc ? 'D' : 'A'
    };
  });

  const filtering = tableParams.columnFilters.map((f) => {
    return {
      filterId: f.id,
      values: f.value
    };
  });

  return {
    paging,
    sorting,
    filtering
  };
}
