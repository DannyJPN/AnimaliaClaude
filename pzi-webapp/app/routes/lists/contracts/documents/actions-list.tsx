import { NoSsr } from "@mui/material";
import { FileDownIcon, PlusIcon } from "lucide-react";
import { MaterialReactTable, MRT_ShowHideColumnsButton } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { enumerationsToSelects } from "~/lib/mappers";
import { decodeTableParametersFromRequest, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, LISTS_EDIT } from "~/shared/permissions";
import { ContractAction } from "./../models";
import { CONTRACT_ACTIONS_TABLE_ID, contractActionsColumnDef, contractActionsColumnDefVisibility } from "../controls";
import { Tooltip } from "~/components/ui/tooltip";
import { useFileDownload } from "~/components/hooks/use-file-download";

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

  const tableSettings = await fetchTableSettings(userName!, CONTRACT_ACTIONS_TABLE_ID, {
    columnOrder: contractActionsColumnDef.map((c) => c.accessorKey!),
    columnVisibility: contractActionsColumnDefVisibility,
  });

  const tableParams = decodeTableParametersFromRequest(request, { defaultPageSize: tableSettings.pageSize || 25 });

  const queryParts = [
    `contractactions?$count=true&$filter=contractId eq ${contractId}&$expand=contract,actionType,actionInitiator`
  ];

  const [listError, listResult] = await fetchODataList<ContractAction>(
    queryParts.join('&')
  );

  const [, actionTypesResult] = await fetchODataList<EnumerationType>(
    'contractactiontypes?$orderby=sort'
  );

  const [, actionInitiatorsResult] = await fetchODataList<EnumerationType>(
    'contractactioninitiators?$orderby=sort'
  );


  return data({
    contractId: contractId,
    items: listResult?.items || [],
    hasEditPermission,
    actionTypes: enumerationsToSelects(actionTypesResult?.items),
    actionInitiators: enumerationsToSelects(actionInitiatorsResult?.items),
    ...tableSettings,
  });
}

const postTableSettings = createPostTableSettingsHandler(CONTRACT_ACTIONS_TABLE_ID);

export default function ContractsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/lists/contracts/${loaderData.contractId}/actions/${id}${location.search}`, { replace: true });
  };

  const openNewItemForm = () => {
    navigate(`/lists/contracts/${loaderData.contractId}/actions/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<ContractAction>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: contractActionsColumnDef,
    data: loaderData.items || [],

    tableOptions: {
      enableRowSelection: false,
      enablePagination: false,

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
    }
  });

  useDefaultTableRedirects<ContractAction>({
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

  const handleDownload = async () => {
    const url = getExportXlsUrl(
      `/lists/contracts/${params.contractId}/actions-export-xls`,
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
                <div className="grow"></div>
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
    </div>
  );
}
