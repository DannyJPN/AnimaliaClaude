import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useNavigate, useParams, useSearchParams } from "react-router";
import { OrganizationLevelItem } from "./models";
import { getUserName } from "~/.server/user-session";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { columnDef, defaultVisibility, DISTRICTS_TABLE_ID } from "./districts/controls";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { OrganizationHierarchyGridHeader, OrgHierarchyBreadcrumbsProps } from "~/components/records/organization-hierarchy/header-controls";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";

type DistrictSearchResultItem = OrganizationLevelItem & {
  parent: {
    id: number,
    name: string,
    parent: {
      id: number,
      name: string
    }
  }
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.currentUrl.searchParams.get('q') !== args.nextUrl.searchParams.get('q')) {
    return true;
  }

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
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") as string;

  const [fetchError, listResult] = await fetchODataList<DistrictSearchResultItem>(
    `OrganizationLevels?$filter=contains(name, '${query}') and level eq 'district'&$expand=parent($expand=parent)`
  );

  const tableSettings = await fetchTableSettings(userName!, DISTRICTS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey!),
    columnVisibility: defaultVisibility
  });

  return data({
    items: listResult?.items || [],
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(DISTRICTS_TABLE_ID);

export default function List() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedChildKey = params.actionParam;
  const selectedItem = loaderData.items.find((i) => i.id.toString() === selectedChildKey);

  const breadcrumbProps: OrgHierarchyBreadcrumbsProps = {
    levels: {

      district: undefined,
      species: undefined,
      currentPage: { nameMain: 'Rajony', nameSub: "Vyhledávání" }
    }
  }

  if (selectedItem) {
    breadcrumbProps.levels.department = {
      id: selectedItem.parent.parent.id,
      name: selectedItem.parent.parent.name
    };

    breadcrumbProps.levels.workplace = {
      id: selectedItem.parent.id,
      name: selectedItem.parent.name
    };
  }

  const goToDetail = (id: number) => {
    navigate(`/records/org-hierarchy/districts-search/${id}${location.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    navigate(`/records/org-hierarchy/districts/${id}/locations`, { replace: false });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<OrganizationLevelItem>({
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

          onDoubleClick: () => {
            goToChildren(row.original.id);
          },

          onKeyDown: (evt: React.KeyboardEvent) => {
            if (evt.key === 'Enter') {
              evt.stopPropagation();
              evt.preventDefault();
              goToChildren(row.original.id);
            }
          }
        };
      },
    }
  });

  useDefaultTableRedirects<OrganizationLevelItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => { },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <OrganizationHierarchyGridHeader
              table={table}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              breadcrumbProps={breadcrumbProps}
              noNewItem
              additionalButtons={<></>}
            />
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
