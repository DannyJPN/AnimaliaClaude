import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useNavigate, useParams, useSearchParams } from "react-router";
import { getUserName } from "~/.server/user-session";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { cn } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { ExpHierarchyBreadcrumbsProps, ExpositionHierarchyGridHeader } from "./controls";
import { Location } from "../organization-hierarchy/locations/models";
import { columnDef, columnDefVisibility, LOCATIONS_TABLE_ID } from "../organization-hierarchy/locations/controls";

export type ExpositionLocationSearchResultItem = Location & {
  id: number;
  name: string;
  expositionSet: {
    id: number;
    name: string;
    expositionArea: {
      id: number;
      name: string;
    };
  };
  organizationLevel?: {
    id: number;
    name: string;
  };
};


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

  const [fetchError, listResult] = await fetchODataList<ExpositionLocationSearchResultItem>(
    `Locations?$filter=contains(name, '${query}')&$expand=expositionSet($expand=expositionArea),organizationLevel($select=id,name)&$orderby=name`
  );

  const tableSettings = await fetchTableSettings(userName!, LOCATIONS_TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  return data({
    items: listResult?.items || [],
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(LOCATIONS_TABLE_ID);

export default function List() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedChildKey = params.actionParam;
  const selectedItem = loaderData.items.find((i) => i.id.toString() === selectedChildKey);

  const breadcrumbProps: ExpHierarchyBreadcrumbsProps = {
    levels: {
      area: undefined,
      set: undefined,
      location: undefined,

      currentPage: { nameMain: 'Lokace', nameSub: "Vyhledávání" }
    }
  };

  if (selectedItem) {
    breadcrumbProps.levels.area = {
      id: selectedItem.expositionSet.expositionArea.id,
      name: selectedItem.expositionSet.expositionArea.name
    };

    breadcrumbProps.levels.set = {
      id: selectedItem.expositionSet.id,
      name: selectedItem.expositionSet.name
    };
  }

  const goToDetail = (id: number) => {
    navigate(`/records/exposition-hierarchy/locations-search/${id}${location.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    const selectedItem = loaderData.items.find(item => item.id === id);
    if (selectedItem?.expositionSet?.id) {
      navigate(`/records/exposition-hierarchy/sets/${selectedItem.expositionSet.id}/locations`, { replace: false });
    }
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<Location>({
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

  useDefaultTableRedirects<Location>({
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
            <ExpositionHierarchyGridHeader
              table={table}
              onExport={undefined}
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
