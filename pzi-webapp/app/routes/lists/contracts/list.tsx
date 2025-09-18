import { NoSsr } from "@mui/material";
import { FileDownIcon, FilterIcon, PlusIcon } from "lucide-react";
import { MaterialReactTable, MRT_ShowHideColumnsButton } from "material-react-table";
import { useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, URLSearchParamsInit, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { useTableColumnFilters } from "~/components/hooks/use-table-column-filters";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { enumerationsToSelects } from "~/lib/mappers";
import { decodeTableParametersFromRequest } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, LISTS_EDIT } from "~/shared/permissions";
import { columnDef, columnDefVisibility, CONTRACTS_TABLE_ID, flattenODataResult } from "./controls";
import { Filters } from "./filters";
import { Contract, ContractWithRelatedData } from "./models";
import { getFilterClause, getSortClause } from "./helpers";
import { Tooltip } from "~/components/ui/tooltip";
import { useFileDownload } from "~/components/hooks/use-file-download";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  // revalidate on POST actions
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  // do not revalidate if query did not change
  if (args.nextUrl.search === args.currentUrl.search) {
    return false;
  }

  return true;
}


export async function loader({ request }: LoaderFunctionArgs) {
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [LISTS_EDIT, DOCUMENTATION_DEPARTMENT]);
  const userName = await getUserName(request);

  const tableSettings = await fetchTableSettings(userName!, CONTRACTS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey!),
    columnVisibility: columnDefVisibility,
  });

  const tableParams = decodeTableParametersFromRequest(request, { defaultPageSize: tableSettings.pageSize || 25 });

  const skip = (tableParams.pagination.pageIndex - 1) * tableParams.pagination.pageSize;
  const top = tableParams.pagination.pageSize;

  const queryParts = [
    `contracts?$count=true&$skip=${skip}&$top=${top}&$expand=partner,movementReason,contractType`,
    getSortClause(tableParams.sorting)
  ];

  const filterClause = getFilterClause(tableParams.columnFilters);

  if (filterClause) {
    queryParts.push(filterClause);
  }

  const [listError, listResult] = await fetchODataList<Contract>(
    queryParts.join('&')
  );

  const itemsWithRelatedData = (listResult?.items || []).map(flattenODataResult);

  const [, movementReasonsResult] = await fetchODataList<EnumerationType>(
    'contractmovementreasons?$orderby=sort'
  );

  const [, contractTypesResult] = await fetchODataList<EnumerationType>(
    'contracttypes?$orderby=sort'
  );

  const pageSize = tableParams.pagination.pageSize || 25;

  return data({
    items: itemsWithRelatedData,
    totalCount: listResult?.totalCount || 0,
    pageSize,
    hasEditPermission,
    contractMovementReasons: enumerationsToSelects(movementReasonsResult?.items),
    contractTypes: enumerationsToSelects(contractTypesResult?.items),
    ...tableSettings,
  });
}

const postTableSettings = createPostTableSettingsHandler(CONTRACTS_TABLE_ID);

export default function ContractsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersDisplayed, setFiltersDisplayed] = useState(false);
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/lists/contracts/${id}${location.search}`, { replace: true });
  };

  const openNewItemForm = () => {
    navigate(`/lists/contracts/new${location.search}`, { replace: true });
  };

  const setSearchParamsWithPageSize = (newSearchParams: URLSearchParams) => {
    const pageSizeChanged = newSearchParams.get("pageSize")
      && newSearchParams.get("pageSize") !== loaderData.pageSize.toString();

    if (pageSizeChanged) {
      postTableSettings(table.getState().columnVisibility, table.getState().columnOrder, Number(newSearchParams.get("pageSize")));
    }

    setSearchParams(newSearchParams, { replace: true });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<ContractWithRelatedData>({
    searchParams,
    setSearchParams: setSearchParamsWithPageSize,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,

    tableOptions: {
      enableRowSelection: false,
      enablePagination: true,
      manualPagination: true,
      manualFiltering: true,
      manualSorting: true,
      enableFilterMatchHighlighting: false,
      enableColumnFilters: false,

      rowCount: loaderData.totalCount,

      muiTableBodyRowProps: ({ row }) => {
        const rowSelected = selectedChildKey === `${row.original.id}`;
        return {
          className: cn(
            'pzi-table-item-row cursor-pointer',
            rowSelected ? 'row-selected bg-accent' : ''
          ),
          sx: {
            backgroundColor: rowSelected ? 'hsl(var(--secondary))' : '',
          },
          onClick: () => {
            goToDetail(row.original.id);
          },
          onFocus: () => {
            goToDetail(row.original.id);
          },
        };
      },

      muiTableContainerProps: {
        sx: {
          height: 'calc(100vh - 220px)'
        }
      },

      renderBottomToolbar: undefined
    },

    stateAndOnChangesOptions: {
      defaultValues: {
        pagination: { pageIndex: 1, pageSize: loaderData.pageSize }
      }
    }
  });

  useDefaultTableRedirects<ContractWithRelatedData>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => {
      openNewItemForm();
    },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    },
  }, [selectedChildKey, loaderData.items, navigate]);

  const { activeTableColumnFilters } = useTableColumnFilters({
    columnFilters: table.getState().columnFilters,
    searchParams
  });

  const handleDownload = async () => {

    var fileUrl = `/lists/contracts/export-xls${location.search}`;

    await downloadFile(fileUrl);
  };

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <div className="@container">
              <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">
                <Select
                  aria-label="Navigation"
                  defaultSelectedKey="contracts"
                  onSelectionChange={(key) => {
                    switch (key) {
                      case 'contracts':
                        window.location.href = '/lists/contracts';
                        break;
                      case 'partners':
                        window.location.href = '/lists/partners';
                        break;
                      case 'birthmethods':
                        window.location.href = '/lists/birthmethods';
                        break;
                      case 'rearings':
                        window.location.href = '/lists/rearings';
                        break;
                      case 'zoos':
                        window.location.href = '/lists/zoos';
                        break;
                      case 'cadaver':
                        window.location.href = '/lists/cadaver';
                        break;
                      default:
                        break;
                    }
                  }}
                  className="w-44"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopover>
                    <SelectListBox>
                      <SelectItem key="contracts" id="contracts">
                        Smlouvy
                      </SelectItem>
                      <SelectItem key="partners" id="partners">
                        Partneři
                      </SelectItem>
                      <SelectItem key="cadaver" id="cadaver">
                        Adresář pro kadáver
                      </SelectItem>
                    </SelectListBox>
                  </SelectPopover>
                </Select>
              </div>
              <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
                <div className="grow">
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
                <div className="flex flex-row-reverse gap-1 content-center items-center">
                  <Tooltip content="Přidat nový">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={openNewItemForm}
                  >
                    <PlusIcon className="size-3" />
                  </Button>
                  </Tooltip>
                  
                  <MRT_ShowHideColumnsButton
                    className={cn("custom-showhide-icon")}
                    table={table}
                  ></MRT_ShowHideColumnsButton>

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
                </div>
              </div>
            </div>
            <MaterialReactTable table={table} />
          </NoSsr>
        </Card>
      </div>
      <div className="w-full md:w-1/2 mt-2 md:mt-0">
        <Outlet context={loaderData} />
      </div>

      {filtersDisplayed && (
        <Filters
          activeTableColumnFilters={activeTableColumnFilters}
          setFiltersDisplayed={setFiltersDisplayed}
          searchParams={searchParams}
          setSearchParams={setSearchParams}
        />
      )}
    </div>
  );
}
