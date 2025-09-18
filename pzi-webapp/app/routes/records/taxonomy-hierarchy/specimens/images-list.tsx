import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { Card } from "~/components/ui/card";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { SpecimenChildRecordsGridHeader } from "./controls";
import { fetchSpecimenSubViewParents } from "./helpers";

export const TABLE_ID: string = 'specimens-images';

export const columnDef = [
  {
    accessorKey: 'id',
    header: 'Id',
    size: 70
  },
  {
    accessorKey: 'label',
    header: 'Název',
    size: 150
  },
  {
    accessorKey: 'description',
    header: 'Popis',
    size: 200
  },
  {
    accessorKey: 'modifiedAt',
    header: 'Kdo',
    size: 120
  },
  {
    accessorKey: 'modifiedBy',
    header: 'Kdy',
    size: 90
  },
];

export const defaultVisibility = {
  id: false,
  label: true,
  description: false,
  modifiedAt: true,
  modifiedBy: true
};

export interface SpecimenImageItem {
  id: number;
  specimenId: number;
  label?: string;
  description?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface SpecimenImageUpdateItem {
  id: number;
  specimenId: number;
  label?: string;
  description?: string;
  image?: string,
  contentType?: string
}

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  return false;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const [fetchError, listResult] = await fetchODataList<SpecimenImageItem>(
    `SpecimenImages?$count=true&$orderby=id desc&$filter=specimenId eq ${parentId}`
  );

  const [parentResult, parentPhylaResult, parentFamilyResult] = await fetchSpecimenSubViewParents(parentId);

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: defaultVisibility
  });

  return data({
    specimenId: parentId,
    specimenInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: parentPhylaResult?.items[0],
    items: listResult!.items,
    hasEditPermission,
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedChildKey = params.actionParam;

  const goToDetail = (id: number) => {
    navigate(`/records/specimens/${loaderData.specimenId}/images/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/specimens/${loaderData.specimenId}/images/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<SpecimenImageItem>({
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
        };
      },
    }
  });

  useDefaultTableRedirects<SpecimenImageItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => {
      openNewItemForm();
    },
    openDefaultItem: () => {
      if (loaderData.items && loaderData.items.length > 0) {
        goToDetail(loaderData.items[0].id);
      }
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  return (
    <div className={cn("flex-1 md:flex", '')}>
      <div className="w-full md:w-1/2">
        <Card className="rounded-none border bg-card text-card-foreground shadow-none">
          <NoSsr>
            <SpecimenChildRecordsGridHeader
              table={table}
              phylumInfo={loaderData.phylumInfo}
              familyInfo={loaderData.familyInfo}
              specimenInfo={loaderData.specimenInfo}
              currentPageName="Obrázky"
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              noNewItem={!loaderData.hasEditPermission}
              onNewItem={openNewItemForm}
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
