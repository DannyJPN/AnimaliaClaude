import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { fetchODataList } from "~/.server/odata-api";
import { pziConfig } from "~/.server/pzi-config";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getVisibleTaxonomyStatusesList } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { RecordsBreadcrumbsProps, RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Card } from "~/components/ui/card";
import { enumerationsToSelects } from "~/lib/mappers";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType } from "~/shared/models";
import { columnDef, columnDefVisibility, TABLE_ID } from "./species/grid-definitions";
import { TaxonomySpeciesItem } from "./species/models";

type TaxonomyItem = {
  id: number;
  nameLat?: string;
  nameCz?: string;
};

export type SpeciesSearchResultItem = TaxonomySpeciesItem & {
  taxonomyGenus: TaxonomyItem & {
    taxonomyFamily: TaxonomyItem & {
      taxonomyOrder: TaxonomyItem & {
        taxonomyClass: TaxonomyItem;
      };
    };
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
  const statuses = await getVisibleTaxonomyStatusesList(request);
  const searchParams = new URL(request.url).searchParams;

  const query = searchParams.get("q") as string;
  const searchNameLat = searchParams.get("lat") === "true";
  const searchNameCz = searchParams.get("cz") === "true";

  const response = await apiCall(
    'api/Search/SpeciesSearch',
    "POST",
    JSON.stringify({
      searchText: query,
      searchNameLat,
      searchNameCz,
      zooStatusCodes: statuses.length !== 4 ? statuses : []
    }),
    pziConfig
  );

  const results = await processResponse<SpeciesSearchResultItem[]>(response);
  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map((c) => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  const [rdbCodesError, rdbCodesResult] = await fetchODataList<EnumerationType>(
    'rdbcodes?$orderby=sort'
  );

  const [citeCodesError, citeCodesResult] = await fetchODataList<EnumerationType>(
    'speciescitetypes?$orderby=sort'
  );

  const [euCodesError, euCodesResult] = await fetchODataList<EnumerationType>(
    'eucodes?$orderby=sort'
  );

  const [protectionTypesError, protectionTypesResult] = await fetchODataList<EnumerationType>(
    'speciesprotectiontypes?$orderby=sort'
  );

  return data({
    items: results.item || [],
    rdbCodes: enumerationsToSelects(rdbCodesResult?.items),
    citeCodes: enumerationsToSelects(citeCodesResult?.items),
    euCodes: enumerationsToSelects(euCodesResult?.items),
    protectionTypes: enumerationsToSelects(protectionTypesResult?.items),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function SpeciesSearchList() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChildKey = params.actionParam;

  const selectedItem = loaderData.items.find((i) => i.id.toString() === selectedChildKey);

  const breadcrumbProps: RecordsBreadcrumbsProps = {
    hierarchyType: 'Z',
    levels: {
      type: 'Z',
      currentPage: {
        nameLat: 'Species Search',
        nameCz: 'Vyhledávání druhů'
      }
    }
  };

  if (selectedItem) {
    breadcrumbProps.levels.class = {
      id: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.taxonomyClass.id,
      nameCz: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.taxonomyClass.nameCz,
      nameLat: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.taxonomyClass.nameLat
    };

    breadcrumbProps.levels.order = {
      id: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.id,
      nameCz: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.nameCz,
      nameLat: selectedItem.taxonomyGenus.taxonomyFamily.taxonomyOrder.nameLat
    };

    breadcrumbProps.levels.family = {
      id: selectedItem.taxonomyGenus.taxonomyFamily.id,
      nameCz: selectedItem.taxonomyGenus.taxonomyFamily.nameCz,
      nameLat: selectedItem.taxonomyGenus.taxonomyFamily.nameLat
    };

    breadcrumbProps.levels.genus = {
      id: selectedItem.taxonomyGenus.id,
      nameCz: selectedItem.taxonomyGenus.nameCz,
      nameLat: selectedItem.taxonomyGenus.nameLat
    };
  }

  const goToDetail = (id: number) => {
    navigate(`/records/species-search/${id}${location.search}`, { replace: true });
  }

  const goToChildren = (id: number) => {
    navigate(`/records/species/${id}/specimens`, { replace: false });
  }

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpeciesItem>({
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

  useDefaultTableRedirects<TaxonomySpeciesItem>({
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
            <RecordsPageGridHeader
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
