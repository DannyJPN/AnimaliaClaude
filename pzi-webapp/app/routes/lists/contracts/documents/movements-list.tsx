import { NoSsr } from "@mui/material";
import { MaterialReactTable, MRT_ShowHideColumnsButton } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { useTableColumnFilters } from "~/components/hooks/use-table-column-filters";
import { Card } from "~/components/ui/card";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { hasOneOfPermissions, LISTS_EDIT, DOCUMENTATION_DEPARTMENT } from "~/shared/permissions";
import { DocumentMovement } from "../models";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { DOCUMENT_MOVEMENTS_TABLE_ID, documentMovementColumnDef, documentMovementColumnDefVisibility } from "../controls";
import { apiCall } from "~/.server/api-actions";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "~/components/ui/menu";
import { Button, buttonVariants } from "~/components/ui/button";
import { ExternalLinkIcon, FileDownIcon } from "lucide-react";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Tooltip } from "~/components/ui/tooltip";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  if (args.nextUrl.search === args.currentUrl.search) {
    return false;
  }

  return true;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [LISTS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const userName = await getUserName(request);
  const contractId = params.contractId;

  const response = await apiCall(
    `api/Contracts/${contractId}/movements`,
    'POST',
    JSON.stringify({})
  );

  const movementsResult = await response.json();
  const typedResult = movementsResult as { items: DocumentMovement[] };

  const tableSettings = await fetchTableSettings(userName!, DOCUMENT_MOVEMENTS_TABLE_ID, {
    columnOrder: documentMovementColumnDef.map((c: any) => c.accessorKey!),
    columnVisibility: documentMovementColumnDefVisibility,
  });

  return data({
    items: typedResult?.items || [],
    contractId: contractId,
    hasEditPermission,
    ...tableSettings,
  });
}

const postTableSettings = createPostTableSettingsHandler(DOCUMENT_MOVEMENTS_TABLE_ID);

export default function DocumentMovementsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.movementId;
  const contractId = params.contractId;

  const goToDetail = (id: number) => {
    navigate(`/lists/contracts/${contractId}/movements/${id}${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<DocumentMovement>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: documentMovementColumnDef,
    data: loaderData.items,

    tableOptions: {
      enableRowActions: true,
      enableRowSelection: false,
      enablePagination: false,
      manualPagination: false,
      manualFiltering: false,
      manualSorting: false,
      enableFilterMatchHighlighting: false,
      enableColumnFilters: false,

      renderRowActions: ({ row }) => {
        const specimenDetailLink = `/records/specimens/${row.original.specimenId}/movements/${row.original.id}`;

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
                  <ExternalLinkIcon className="size-4" /> Dokument exempláře
                </MenuItem>
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        );
      },

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
  });

  useDefaultTableRedirects<DocumentMovement>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => { },
    openDefaultItem: () => {
      if (loaderData.items && loaderData.items.length > 0) {
        goToDetail(loaderData.items[0].id);
      }
    },
  }, [selectedChildKey, loaderData.items, navigate]);

  const { activeTableColumnFilters } = useTableColumnFilters({
    columnFilters: table.getState().columnFilters,
    searchParams
  });

  const handleDownload = async () => {
    const url = getExportXlsUrl(
      `/lists/contracts/${params.contractId}/movements-export-xls`,
      searchParams
    );

    await downloadFile(url);
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
                      case 'cadaver':
                        window.location.href = '/lists/cadaver';
                        break;
                      default:
                        break;
                    }
                  }}
                  className="w-44">
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
                        Cadaver
                      </SelectItem>
                    </SelectListBox>
                  </SelectPopover>
                </Select>
              </div>

              <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
                <div className="grow"></div>
                <div className="flex flex-row-reverse gap-1 content-center items-center">
                  <MRT_ShowHideColumnsButton
                    className={cn("custom-showhide-icon")}
                    table={table}
                  />

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
    </div>
  );
}
