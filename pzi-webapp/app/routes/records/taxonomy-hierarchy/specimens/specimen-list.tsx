import { NoSsr } from "@mui/material";
import { ArrowLeftRightIcon } from "lucide-react";
import { MaterialReactTable, MRT_RowVirtualizer, MRT_TableOptions, MRT_VisibilityState, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_CS } from "material-react-table/locales/cs";
import { useEffect, useRef, useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useTableSearchParams } from "tanstack-table-search-params";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler, handleTableSettingsChange } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType, SelectItemType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { TaxonomyPhylumInfoItem } from "../models";
import { MoveSpecimens } from "./controls/move-specimens";
import { columnDef, columnDefVisibility, SPECIMENS_TABLE_ID } from "./grid-columns";
import { flattenODataResult } from "./helpers";
import { TaxonomyFamilyInfoItem, TaxonomySpeciesInfoItem, TaxonomySpecimenItem, TaxonomySpecimenItemWithFlatRelatedData } from "./models";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Tooltip } from "~/components/ui/tooltip";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  return false;
}

const classificationTypeOptions: SelectItemType<string, string>[] = [
  { key: 'E', text: 'E' },
  { key: 'S', text: 'S' }
];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const parentId = Number(params.parentId);
  const userName = await getUserName(request);
  const permissions = await getUserPermissions(request);
  const hasEditPermission = hasOneOfPermissions(permissions, [RECORDS_EDIT, DOCUMENTATION_DEPARTMENT]);

  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenItem>(
    [
      `specimens?$count=true&$orderby=accessionNumber desc&$filter=speciesId eq ${parentId}`,
      [
        '$expand=father($expand=species($select=id,code,nameLat,nameCz);$select=id,species,accessionNumber,zims,speciesId)',
        'mother($expand=species($select=id,code,nameLat,nameCz);$select=id,species,accessionNumber,zims,speciesId)',
        'inLocation($select=keyword),outLocation($select=keyword),inReason($select=displayName),outReason($select=displayName)',
        'images($select=id)'
      ].join(',')
    ].join('&')
  );

  const [parentFetchError, parentResult] = await fetchODataList<TaxonomySpeciesInfoItem & { classificationTypeCode?: string }>(
    `species?$filter=id eq ${parentId}&$expand=taxonomyGenus($select=id,nameLat,nameCz,taxonomyFamilyId)`
  );

  const [parentFamilyFetchError, parentFamilyResult] = await fetchODataList<TaxonomyFamilyInfoItem>(
    `taxonomyfamilies?$filter=id eq ${parentResult?.items[0].taxonomyGenus?.taxonomyFamilyId}&$expand=taxonomyOrder($select=id,nameLat,nameCz;$expand=taxonomyClass($select=id,taxonomyPhylumId,nameLat,nameCz))`
  );

  const [phylaFetchError, phylaResult] = await fetchODataList<TaxonomyPhylumInfoItem>(
    `taxonomyphyla?$filter=id eq ${parentFamilyResult?.items[0].taxonomyOrder?.taxonomyClass?.taxonomyPhylumId}`
  );

  const [genderTypesError, genderTypesResult] = await fetchODataList<EnumerationType>(
    'gendertypes?$orderby=sort'
  );

  const [rearingTypesError, rearingTypesResult] = await fetchODataList<EnumerationType>(
    'rearings?$orderby=sort'
  );

  const [birthMethodsError, birthMethodsResult] = await fetchODataList<EnumerationType>(
    'birthmethods?$orderby=sort'
  );

  const specimensWithRelatedData: TaxonomySpecimenItemWithFlatRelatedData[] = (listResult?.items || []).map(flattenODataResult);

  const tableSettings = await fetchTableSettings(userName!, SPECIMENS_TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  return data({
    hasEditPermission,
    speciesId: parentId,
    speciesInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: phylaResult?.items[0],
    items: specimensWithRelatedData,
    genderTypes: (genderTypesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    rearingTypes: (rearingTypesResult?.items || []).map((i) => {
      return { key: i.displayName, text: i.displayName } as SelectItemType<string, string>;
    }),
    birthMethodTypes: (birthMethodsResult?.items || []).map((i) => {
      return { key: i.displayName, text: i.displayName } as SelectItemType<string, string>;
    }),
    classificationTypeOptions,
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIMENS_TABLE_ID);

export default function SpecimenList() {
  const loaderData = useLoaderData<typeof loader>();
  const params = useParams();
  const { isDownloading, downloadFile } = useFileDownload();

  const selectedChildKey: string | undefined = params.actionParam;

  const breadcrumbProps = {
    hierarchyType: 'Z' as const,

    levels: {
      type: 'Z' as const,
      phylum: {
        id: loaderData.phylumInfo!.id,
        nameLat: loaderData.phylumInfo!.nameLat,
        nameCz: loaderData.phylumInfo!.nameCz
      },
      class: {
        id: loaderData.familyInfo!.taxonomyOrder!.taxonomyClass!.id,
        nameLat: loaderData.familyInfo!.taxonomyOrder!.taxonomyClass!.nameLat,
        nameCz: loaderData.familyInfo!.taxonomyOrder!.taxonomyClass!.nameCz
      },
      order: {
        id: loaderData.familyInfo!.taxonomyOrder!.id,
        nameLat: loaderData.familyInfo!.taxonomyOrder!.nameLat,
        nameCz: loaderData.familyInfo!.taxonomyOrder!.nameCz
      },
      family: {
        id: loaderData.familyInfo!!.id,
        nameLat: loaderData.familyInfo!!.nameLat,
        nameCz: loaderData.familyInfo!!.nameCz
      },
      genus: {
        id: loaderData.speciesInfo!.taxonomyGenus!.id,
        nameLat: loaderData.speciesInfo!.taxonomyGenus!.nameLat,
        nameCz: loaderData.speciesInfo!.taxonomyGenus!.nameCz,
      },
      species: {
        id: loaderData.speciesInfo!!.id,
        nameLat: loaderData.speciesInfo!.nameLat,
        nameCz: loaderData.speciesInfo!.nameCz,
      },
      currentPage: {
        nameLat: undefined,
        nameCz: 'Exempláře'
      }
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(loaderData.columnVisibility || {});
  const [columnOrder, setColumnOrder] = useState<string[]>(loaderData.columnOrder || []);

  const stateAndOnChanges = useTableSearchParams(
    {
      replace: (url) => {
        const newSearchParams = new URLSearchParams(url);
        setSearchParams(newSearchParams);
      },
      query: searchParams,
      pathname: '',
    }
  );

  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

  const gridOptions: MRT_TableOptions<TaxonomySpecimenItemWithFlatRelatedData> = {
    columns: columnDef,
    data: loaderData.items,

    enableRowSelection: true,
    enablePagination: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableStickyHeader: true,
    enableTableFooter: false,
    enableRowVirtualization: true,
    enableDensityToggle: false,
    enableColumnOrdering: true,
    localization: MRT_Localization_CS,

    muiTablePaperProps: {
      sx: {
        border: 0,
        borderRadius: 0,
        boxShadow: 0
      }
    },

    muiTableHeadRowProps: {
      sx: {
        backgroundColor: 'hsl(var(--secondary))'
      }
    },

    muiTableHeadCellProps: {
      className: 'min-h-[48px]',
      sx: {
        paddingTop: '0.7rem',
        "&:focus-visible": {
          outline: '2px solid gray',
          outlineOffset: '-2px',
        }
      }
    },

    muiTableBodyCellProps: {
      sx: {
        "&:focus-visible": {
          outline: '2px solid gray',
          outlineOffset: '-2px',
        }
      }
    },

    muiTableContainerProps: {
      sx: {
        height: 'calc(100vh - 160px)'
      }
    },

    initialState: {
      density: 'compact',
      columnVisibility: loaderData.columnVisibility,
      columnOrder: loaderData.columnOrder
    },

    rowVirtualizerInstanceRef,

    renderTopToolbar: () => (<></>),
    renderBottomToolbar: () => (<></>),

    muiTableBodyRowProps: ({ row }) => {
      const rowSelected = row.original.id.toString() === selectedChildKey;

      return {
        className: rowSelected ? 'row-selected' : '',
        sx: {
          backgroundColor: rowSelected ? 'hsl(var(--secondary))' : '',
        },

        onClick: () => {
          navigate(`/records/species/${loaderData.speciesId}/specimens/${row.original.id}${location.search}`, { replace: true });
        },

        onFocus: () => {
          navigate(`/records/species/${loaderData.speciesId}/specimens/${row.original.id}${location.search}`, { replace: true });
        }
      };
    },

    getRowId: (row) => row.id.toString(),

    ...stateAndOnChanges
  };

  const table = useMaterialReactTable(gridOptions);

  useEffect(() => {
    handleTableSettingsChange(
      columnVisibility, table.getState().columnVisibility,
      columnOrder, table.getState().columnOrder,
      (newVisibility, newOrder) => {
        setColumnVisibility(newVisibility);
        setColumnOrder(newOrder);
        postTableSettings(newVisibility, newOrder);
      }
    );
  }, [table.getState().columnVisibility, table.getState().columnOrder]);

  const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));

  const openNewItemForm = () => {
    navigate(`/records/species/${loaderData.speciesId}/specimens/new${location.search}`, { replace: true });
  };

  useEffect(() => {
    if (selectedChildKey === 'new') {
      return;
    }

    const properKeySelected = selectedChildKey
      && loaderData.items.some((ck) => ck.id.toString() === selectedChildKey);

    if (properKeySelected) {
      return;
    }

    let timeout = setTimeout(() => {
      if (loaderData.items.length === 0) {
        openNewItemForm();
      } else {
        navigate(`/records/species/${loaderData.speciesId}/specimens/${loaderData.items[0].id}${location.search}`, { replace: true });
      }
    }, 10);

    return () => {
      clearTimeout(timeout);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  useEffect(() => {
    if (!selectedChildKey || selectedChildKey === 'new') {
      return;
    }

    setTimeout(() => {
      const selectedRowIndex = table.getRowModel().rows.findIndex((row) => selectedChildKey === `${row.original.id}`);
      rowVirtualizerInstanceRef.current?.scrollToIndex(selectedRowIndex);

      setTimeout(() => {
        document.querySelector('.row-selected')?.querySelector('td')?.focus();
      }, 25);
    }, 25);
  }, []);

  const [moveItemsVisible, setMoveItemsVisible] = useState(false);

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/species/${loaderData.speciesId}/specimens/export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

  return (
    <>
      <div
        className={cn(
          "flex-1 md:flex",
          '')
        }>

        <div className="w-full md:w-1/2">
          <Card
            className="rounded-none border bg-card text-card-foreground shadow-none">

            <NoSsr>
              <RecordsPageGridHeader
                table={table}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                breadcrumbProps={breadcrumbProps}
                noNewItem={!loaderData.hasEditPermission}
                onNewItem={openNewItemForm}
                onExport={handleExport}
                isExporting={isDownloading}
                additionalButtons={
                  <>
                    <Tooltip content="Přesunou vybrané záznamy">
                      <Button
                        variant="outline"
                        size="sm"
                        isDisabled={!loaderData.hasEditPermission || selectedIds.length === 0}
                        onPress={() => {
                          setMoveItemsVisible(true);
                        }}>
                        <ArrowLeftRightIcon className="size-3" />
                      </Button>
                    </Tooltip>
                  </>
                }
              />

              <MaterialReactTable table={table} />
            </NoSsr>
          </Card>
        </div>

        <div className="w-full md:w-1/2 mt-2 md:mt-0">
          <Outlet
            context={loaderData} />
        </div>

        {moveItemsVisible && (
          <MoveSpecimens
            selectedIds={selectedIds}
            currentSpeciesId={loaderData.speciesId}
            onClose={() => {
              setMoveItemsVisible(false);
            }} />
        )}
      </div>
    </>
  );
}
