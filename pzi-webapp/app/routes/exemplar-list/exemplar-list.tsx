import { NoSsr } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, FileDownIcon, FilterIcon } from "lucide-react";
import { MRT_ShowHideColumnsButton, MRT_TableOptions, MRT_TopToolbarProps, MRT_VisibilityState, MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_CS } from 'material-react-table/locales/cs';
import { useEffect, useState } from "react";
import { RouterProvider } from "react-aria-components";
import { LoaderFunctionArgs, data, useHref, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { useTableSearchParams } from "tanstack-table-search-params";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, requireLoggedInUser } from "~/.server/user-session";
import { useTableColumnFilters } from "~/components/hooks/use-table-column-filters";
import { Button, buttonVariants } from "~/components/ui/button";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { fetchJson } from "~/lib/fetch";
import { decodeTableParametersFromRequest, getExportXlsUrl, tableParamsToApiParams } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler, handleTableSettingsChange } from "~/lib/table-settings";
import { SPECIMEN_LIST_TABLE_ID, columnDef, columnDefVisibility } from "~/routes/exemplar-list/controls";
import { PagedSpecimensResponse, Specimens } from "~/routes/exemplar-list/models";
import { exemplarListTableDefaults } from "~/routes/exemplar-list/table-defaults";
import { SelectItemType } from "~/shared/models";
import { ExemplarListFilters } from "./filters";
import { cn } from "~/lib/utils";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Tooltip } from "~/components/ui/tooltip";

type TaxonomyItem = { id: number, nameLat?: string, nameCz?: string };

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  const userName = await getUserName(request);

  const tableSettings = await fetchTableSettings(userName!, SPECIMEN_LIST_TABLE_ID, {
    columnOrder: ['mrt-row-actions', ...columnDef.map((c) => c.accessorKey as string)],
    columnVisibility: columnDefVisibility,
  });

  const tableParams = decodeTableParametersFromRequest(request, { defaultPageSize: tableSettings.pageSize || 100 });
  const apiParams = tableParamsToApiParams(tableParams);

  const response = await apiCall(
    "api/Specimens/SpecimensView",
    "POST",
    JSON.stringify(apiParams),
    pziConfig
  );

  const results = await processResponse<PagedSpecimensResponse>(response);

  const items = results.item?.items ?? [];
  const totalCount = results.item?.totalCount ?? 0;
  const pageIndex = tableParams.pagination.pageIndex || 1;
  const pageSize = tableParams.pagination.pageSize || tableSettings.pageSize || 100;

  return data({
    items,
    totalCount,
    pageIndex,
    pageSize,
    columnOrder: tableSettings.columnOrder,
    columnVisibility: tableSettings.columnVisibility,
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMEN_LIST_TABLE_ID);

export default function ExemplarList() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const [filtersDisplayed, setFiltersDisplayed] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(loaderData.columnVisibility || {});
  const [columnOrder, setColumnOrder] = useState<string[]>(loaderData.columnOrder || []);

  const stateAndOnChanges = useTableSearchParams(
    {
      replace: (url) => {
        const newSearchParams = new URLSearchParams(url);

        const pageSizeChanged = newSearchParams.get("pageSize")
          && newSearchParams.get("pageSize") !== loaderData.pageSize.toString();

        if (pageSizeChanged) {
          postTableSettings(table.getState().columnVisibility, table.getState().columnOrder, Number(newSearchParams.get("pageSize")));
        }

        setSearchParams(newSearchParams, { replace: true });
      },
      query: searchParams,
      pathname: '',
    },
    {
      defaultValues: { pagination: { pageIndex: 1, pageSize: loaderData.pageSize } }
    }
  );

  const handleDownload = async () => {
    const url = getExportXlsUrl(
      `/exemplar-list/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  const tableOptions: MRT_TableOptions<Specimens> = {
    ...exemplarListTableDefaults,

    enableRowActions: true,
    enableRowSelection: false,
    positionToolbarAlertBanner: 'none',
    manualPagination: true,
    manualFiltering: true,
    localization: MRT_Localization_CS,
    manualSorting: true,
    enableFilterMatchHighlighting: false,
    enableColumnFilters: false,

    data: loaderData.items,
    rowCount: loaderData.totalCount,
    columns: columnDef,

    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: "",
        size: 30,
        muiTableHeadCellProps: {
          sx: {
            padding: '0px'
          }
        },
        muiTableBodyCellProps: {
          sx: {
            padding: '0px'
          }
        }
      }
    },

    initialState: {
      density: "compact",
      columnPinning: { left: ['mrt-row-select', 'mrt-row-actions'] },
      columnVisibility: columnVisibility,
      columnOrder: columnOrder
    },

    renderRowActions: ({ row }) => {
      const specimenDetailLink = `/records/species/${row.original.speciesId}/specimens/${row.original.id}`;

      return (
        <MenuTrigger>
          <Button
            size="sm"
            variant="ghost">
            ...
          </Button>
          <MenuPopover>
            <Menu>
              <MenuItem href={specimenDetailLink}>
                <ExternalLinkIcon className="size-4" /> Karta exempláře
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      );
    },

    renderTopToolbar: (props: MRT_TopToolbarProps<Specimens>) => {
      const { table } = props;
      return (
        <div className="w-full flex p-2 justify-between">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onPressChange={() => {
                setFiltersDisplayed(true);
              }}
            >
              <FilterIcon className="size-3 mr-1" />
              Filtry
            </Button>
          </div>
          
          <div className="flex gap-2 items-center">
            <Tooltip content="Exportovat záznamy">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                isDisabled={isDownloading}
                aria-label="Exportovat do XLS">
                <FileDownIcon className="size-3" />
              </Button>
            </Tooltip>

            <MRT_ShowHideColumnsButton
              className={cn("custom-showhide-icon")}
              table={table}
            />
          </div>
        </div>
      );
    },

    ...stateAndOnChanges
  };

  const table = useMaterialReactTable(tableOptions);

  useEffect(() => {
    handleTableSettingsChange(
      columnVisibility, table.getState().columnVisibility,
      columnOrder, table.getState().columnOrder,
      (newVisibility, newOrder) => {
        setColumnVisibility(newVisibility);
        setColumnOrder(newOrder);
        postTableSettings(newVisibility, newOrder, loaderData.pageSize);
      }
    );
  }, [table.getState().columnVisibility, table.getState().columnOrder]);

  const { activeTableColumnFilters } = useTableColumnFilters({
    columnFilters: table.getState().columnFilters,
    searchParams
  });

  const speciesFiltersData = useQuery({
    queryKey: [
      'exemplar-list-speciesfilter-selected',
      activeTableColumnFilters['speciesId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['speciesId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/species-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const districtsFiltersData = useQuery({
    queryKey: [
      'exemplar-list-districtsfilter-selected',
      activeTableColumnFilters['districtId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['districtId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/org-levels-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const workplacesFiltersData = useQuery({
    queryKey: [
      'exemplar-list-workplacesfilter-selected',
      activeTableColumnFilters['workplaceId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['workplaceId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/org-levels-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const departmentsFiltersData = useQuery({
    queryKey: [
      'exemplar-list-departmentsfilter-selected',
      activeTableColumnFilters['departmentId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['departmentId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/org-levels-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const locationsFiltersData = useQuery({
    queryKey: [
      'exemplar-list-locationsfilter-selected',
      activeTableColumnFilters['locationId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['locationId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/locations-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const expositionSetsFiltersData = useQuery({
    queryKey: [
      'exemplar-list-expositionsetsfilter-selected',
      activeTableColumnFilters['expositionSetId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['expositionSetId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/exposition-sets-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const expositionAreasFiltersData = useQuery({
    queryKey: [
      'exemplar-list-expositionareasfilter-selected',
      activeTableColumnFilters['expositionAreaId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['expositionAreaId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<{ id: number, name: string }[]>(
        '/api/exposition-areas-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: item.name
        };
      });
    }
  });

  const phylumFiltersData = useQuery({
    queryKey: [
      'exemplar-list-phylumfilter-selected',
      activeTableColumnFilters['phylumId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['phylumId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/phyla-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const classFiltersData = useQuery({
    queryKey: [
      'exemplar-list-classfilter-selected',
      activeTableColumnFilters['classId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['classId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/classes-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const orderFiltersData = useQuery({
    queryKey: [
      'exemplar-list-orderfilter-selected',
      activeTableColumnFilters['orderId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['orderId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/orders-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const familyFiltersData = useQuery({
    queryKey: [
      'exemplar-list-familyfilter-selected',
      activeTableColumnFilters['familyId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['familyId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/families-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const genusFiltersData = useQuery({
    queryKey: [
      'exemplar-list-genusfilter-selected',
      activeTableColumnFilters['genusId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedIds = activeTableColumnFilters['genusId'] || [];

      if (selectedIds.length === 0) {
        return [];
      }

      const selectedInfo = await fetchJson<TaxonomyItem[]>(
        '/api/genera-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  return (
    <>
      {filtersDisplayed && (
        <ExemplarListFilters
          activeTableColumnFilters={activeTableColumnFilters}
          setFiltersDisplayed={setFiltersDisplayed}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          activeSpeciesFilters={speciesFiltersData.data || []}
          activeDistrictsFilters={districtsFiltersData.data || []}
          activeWorkplaceFilters={workplacesFiltersData.data || []}
          activeDepartmentFilters={departmentsFiltersData.data || []}
          activeLocationFilters={locationsFiltersData.data || []}
          activeExpositionSetFilters={expositionSetsFiltersData.data || []}
          activeExpositionAreaFilters={expositionAreasFiltersData.data || []}
          activePhylumFilters={phylumFiltersData.data || []}
          activeClassFilters={classFiltersData.data || []}
          activeOrderFilters={orderFiltersData.data || []}
          activeFamilyFilters={familyFiltersData.data || []}
          activeGenusFilters={genusFiltersData.data || []}
        />
      )}

      <RouterProvider navigate={navigate} useHref={useHref}>
        <div className="w-full p-2">
          <NoSsr>
            <MaterialReactTable table={table} />
          </NoSsr>
        </div>
      </RouterProvider>
    </>
  );
}
