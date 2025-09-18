import { NoSsr } from "@mui/material";
import { LoaderFunctionArgs, Outlet, data, useLoaderData, useLocation, useNavigate, useParams, useSearchParams, ShouldRevalidateFunctionArgs } from "react-router";
import { Card } from "~/components/ui/card";
import { fetchODataList } from "~/.server/odata-api";
import { cn } from "~/lib/utils";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { hasOneOfPermissions, LISTS_EDIT, DOCUMENTATION_DEPARTMENT } from "~/shared/permissions";
import { fetchTableSettings } from "~/.server/table-settings";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { MaterialReactTable, MRT_ShowHideColumnsButton } from "material-react-table";
import { columnDef, columnDefVisibility, REARINGS_TABLE_ID } from "./controls";
import { useConfiguredTable } from "~/components/hooks/table-hooks";
import { useDefaultTableRedirectsByRowId } from "~/components/hooks/table-hooks-rowid";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { PlusIcon } from "lucide-react";
import { Tooltip } from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";

type EnumItem = {
  code: string;
  displayName: string;
  sort: number;
  note?: string | null;
};

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (
    args.actionStatus &&
    args.actionStatus === 200 &&
    args.actionResult &&
    args.actionResult.success
  ) {
    return true;
  }
  return false;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userName = await getUserName(request);

  const [listError, listResult] = await fetchODataList<EnumItem>(
    `rearings?$count=true&$orderby=code`
  );

  const items = listResult?.items || [];
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [LISTS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const tableSettings = await fetchTableSettings(userName!, REARINGS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey as string),
    columnVisibility: columnDefVisibility,
  });

  return data({
    items,
    hasEditPermission,
    ...tableSettings,
  });
}

const postTableSettings = createPostTableSettingsHandler(REARINGS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChildKey = params.actionParam;

  const goToDetail = (code: string) => {
    navigate(`/lists/rearings/${code}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/lists/rearings/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<EnumItem>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: columnDef,
    data: loaderData.items,
    tableOptions: {
      enableRowSelection: false,
      enablePagination: false,
      getRowId: (row) => row.code,
      muiTableBodyRowProps: ({ row }) => {
        const rowSelected = selectedChildKey === `${row.original.code}`;
        return {
          className: cn(
            'pzi-table-item-row cursor-pointer',
            rowSelected ? 'row-selected bg-accent' : ''
          ),
          sx: {
            backgroundColor: rowSelected ? 'hsl(var(--secondary))' : '',
          },
          onClick: () => goToDetail(row.original.code),
          onFocus: () => goToDetail(row.original.code),
        };
      },
    },
  });

  useDefaultTableRedirectsByRowId<EnumItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: openNewItemForm,
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].code);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <div className="@container">
              <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">
                <Select
                  aria-label="Navigation"
                  defaultSelectedKey="rearings"
                  onSelectionChange={(key) => {
                    switch (key) {
                      case 'contracts':
                        window.location.href = '/lists/contracts/2025';
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
                <div className="grow"></div>

                <div className="flex flex-row-reverse gap-1 content-center items-center">
                  {loaderData.hasEditPermission && (
                    <Tooltip content="Přidat nový">
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={openNewItemForm}>
                        <PlusIcon className="size-3" />
                      </Button>
                    </Tooltip>
                  )}
                  <MRT_ShowHideColumnsButton className={cn("custom-showhide-icon")} table={table} />
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