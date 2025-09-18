import { NoSsr } from "@mui/material";
import { useQuery } from '@tanstack/react-query';
import { ExternalLinkIcon, FileDownIcon, FilterIcon, PlusIcon, SquareStackIcon } from "lucide-react";
import { MaterialReactTable, MRT_ShowHideColumnsButton } from "material-react-table";
import { MRT_Localization_CS } from 'material-react-table/locales/cs';
import React, { useState } from "react";
import { RouterProvider } from "react-aria-components";
import { data, Link, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useHref, useLoaderData, useLocation, useNavigate, useSearchParams } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable } from "~/components/hooks/table-hooks";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { useTableColumnFilters } from "~/components/hooks/use-table-column-filters";
import { journalTableDefaults } from "~/components/table-defaults";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { fetchJson } from "~/lib/fetch";
import { decodeTableParametersFromRequest, getExportXlsUrl, tableParamsToApiParams } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { hasOneOfPermissions, JOURNAL_CONTRIBUTE } from "~/shared/permissions";
import { columnDef, columnVisibility, TABLE_ID } from "./grid-definition";
import { JournalFilters } from "./journal-filters";
import { JournalBaseDataResult, JournalEntry, PagedResult } from "./models";
import { URLSearchParams } from "url";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  // revalidate on POST actions
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  // do not revalidate on same url
  if (args.currentUrl.href === args.nextUrl.href) {
    return false;
  }

  // do not revalidate when on child paths
  if (args.nextUrl.pathname !== '/journal/journal-entries') {
    return false;
  }

  // do not revalidate if there was no search change 
  if (args.nextUrl.pathname === '/journal/journal-entries'
    && args.currentUrl.pathname === '/journal/journal-entries'
    && args.nextUrl.search === args.currentUrl.search) {
    return false;
  }

  return true;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: ['mrt-row-actions', ...columnDef.map(c => c.accessorKey!)],
    columnVisibility: columnVisibility
  });

  const tableParams = decodeTableParametersFromRequest(request, { defaultPageSize: tableSettings.pageSize || 25 });
  const apiParams = tableParamsToApiParams(tableParams);

  const response = await apiCall(
    'api/JournalEntries/EntriesForUser',
    'POST',
    JSON.stringify({
      userName,
      ...apiParams
    }),
    pziConfig
  );

  const result = await processResponse<PagedResult<JournalEntry>>(response);

  return data({
    items: result.item?.items || [],
    totalCount: result.item?.totalCount || 0,
    pageSize: tableParams.pagination.pageSize || 25,
    hasContributePermission: hasOneOfPermissions(permissions, [JOURNAL_CONTRIBUTE]),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function JournalEntriesList() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();
  const [filtersDisplayed, setFiltersDisplayed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const baseDataQuery = useQuery({
    queryKey: ['journal-base-data'],
    queryFn: async () => {
      const result = await fetchJson<JournalBaseDataResult>(
        '/journal/journal-base-data',
        {
          method: 'POST'
        }
      );

      return result;
    }
  });

  const setSearchParamsWithPageSize = (newSearchParams: URLSearchParams) => {
    const pageSizeChanged = newSearchParams.get("pageSize")
      && newSearchParams.get("pageSize") !== loaderData.pageSize.toString();

    if (pageSizeChanged) {
      postTableSettings(table.getState().columnVisibility, table.getState().columnOrder, Number(newSearchParams.get("pageSize")));
    }

    setSearchParams(newSearchParams, { replace: true });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<JournalEntry>({
    searchParams,
    setSearchParams: setSearchParamsWithPageSize,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,

    tableOptions: {
      ...journalTableDefaults,

      rowCount: loaderData.totalCount,

      localization: MRT_Localization_CS,

      enableRowActions: true,
      positionToolbarAlertBanner: 'none',
      enablePagination: true,
      manualPagination: true,
      manualFiltering: true,
      manualSorting: true,
      enableFilterMatchHighlighting: false,

      muiTableContainerProps: {
        sx: {
          height: 'calc(100vh - 220px)'
        }
      },

      enableRowSelection: (row) => {
        return (row.original.allowedActions || []).length > 0;
      },

      renderRowActions: ({ row }) => {
        return (
          <>
            <Link to={`/journal/journal-entries/detail/${row.original.id}${location.search}`}>
              <ExternalLinkIcon className="size-4" />
            </Link>
          </>
        );
      },

      renderTopToolbar: (props) => {
        const handleExport = async () => {
          const url = getExportXlsUrl(
            '/journal/journal-export-xls', searchParams
          );

          await downloadFile(url);
        };

        return (
          <div className="@container">

            <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold">Záznamy deníku</h2>
              </div>
            </div>

            <div className="w-full flex flex-row p-2 gap-4">
              <div className="grow">
                <Button
                  variant='outline'
                  size='sm'
                  onPress={() => {
                    setFiltersDisplayed(true);
                  }}>
                  <FilterIcon className="size-3" />
                </Button>
              </div>

              <div className="flex flex-row-reverse gap-1 content-center items-center">
                {loaderData.hasContributePermission && (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      navigate(`/journal/journal-entries/new${location.search}`);
                    }}>
                    <PlusIcon className="size-3" />
                  </Button>
                )}

                <MRT_ShowHideColumnsButton
                  className={cn("custom-showhide-icon")}
                  table={table}>
                </MRT_ShowHideColumnsButton>

                <Tooltip content="Exportovat záznamy">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={handleExport}
                    isDisabled={isDownloading}
                    aria-label="Exportovat do XLS">
                    <FileDownIcon className="size-3" />
                  </Button>
                </Tooltip>

                {loaderData.hasContributePermission && (
                  <Tooltip content="Hromadné zpracování">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        const idParams = selectedIds.map((sid) => `ids=${sid}`).join('&');

                        navigate(`/journal/journal-entries-process-multiple?${idParams}`);
                      }}
                      isDisabled={selectedIds.length == 0}
                      aria-label="Hromadné zpracování">
                      <SquareStackIcon className="size-3" />
                    </Button>
                  </Tooltip>
                )}

              </div>
            </div>
          </div>
        );
      },

      renderBottomToolbar: undefined
    },

    stateAndOnChangesOptions: {
      defaultValues: {
        pagination: { pageIndex: 0, pageSize: loaderData.pageSize }
      }
    }
  });

  const { activeTableColumnFilters } = useTableColumnFilters({
    columnFilters: table.getState().columnFilters,
    searchParams
  });

  const speciesFiltersData = useQuery({
    queryKey: [
      'journal-list-speciesfilter-selected',
      activeTableColumnFilters['speciesId']
    ],
    retry: false,
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      const selectedSpeciesIds = activeTableColumnFilters['speciesId'] || [];

      if (selectedSpeciesIds.length === 0) {
        return [];
      }

      const selectedSpeciesInfo = await fetchJson<{ id: number, nameLat?: string, nameCz?: string }[]>(
        '/api/species-by-ids',
        {
          method: 'POST',
          body: JSON.stringify({
            ids: selectedSpeciesIds.map((i) => parseInt(i))
          })
        }
      );

      return selectedSpeciesInfo.map((item) => {
        return {
          key: item.id,
          text: `${item.nameLat} (${item.nameCz || ''})`
        };
      });
    }
  });

  const districtsFiltersData = useQuery({
    queryKey: [
      'journal-list-districtsfilter-selected',
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

  React.useEffect(() => {
    const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
    setSelectedIds(selectedIds);
  }, [table.getState().rowSelection]);

  return (
    <>
      {filtersDisplayed && (
        <JournalFilters
          activeTableColumnFilters={activeTableColumnFilters}
          setFiltersDisplayed={setFiltersDisplayed}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
          activeSpeciesFilters={speciesFiltersData.data || []}
          activeDistrictsFilters={districtsFiltersData.data || []}
        />
      )}

      <RouterProvider navigate={navigate} useHref={useHref}>
        <div className="flex flex-col h-full">
          <NoSsr>
            <MaterialReactTable table={table} />
          </NoSsr>
        </div>
      </RouterProvider>

      <Outlet context={{
        baseData: baseDataQuery.data
      }}></Outlet>
    </>
  );
}
