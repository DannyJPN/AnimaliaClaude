import { NoSsr } from "@mui/material";
import { ArrowLeftRightIcon } from "lucide-react";
import { MaterialReactTable, MRT_RowVirtualizer, MRT_TableOptions, MRT_VisibilityState, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_CS } from "material-react-table/locales/cs";
import { useEffect, useRef, useState } from "react";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { useTableSearchParams } from "tanstack-table-search-params";
import { fetchODataList, filterByStatusesClause } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions, getVisibleTaxonomyStatusesList } from "~/.server/user-session";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { encodeColumnFilters, getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler, handleTableSettingsChange } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType, SelectItemType } from "~/shared/models";
import { DOCUMENTATION_DEPARTMENT, hasOneOfPermissions, RECORDS_EDIT } from "~/shared/permissions";
import { TaxonomyPhylumInfoItem } from "../models";
import { MoveSpecies } from "./controls/move-species";
import { columnDef, columnDefVisibility, TABLE_ID } from "./grid-definitions";
import { TaxonomyFamilyInfoItem, TaxonomyGenusInfoItem, TaxonomySpeciesItem } from "./models";
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
  const statuses = await getVisibleTaxonomyStatusesList(request);
  const zooStatusClause = filterByStatusesClause(statuses);

  const filterClauses = [
    `$filter=taxonomyGenusId eq ${parentId}`
  ];

  if (zooStatusClause) {
    filterClauses.push(zooStatusClause);
  }

  const [fetchError, listResult] = await fetchODataList<TaxonomySpeciesItem>(
    `species?$count=true&$orderby=code&${filterClauses.join(' and ')}`
  );

  const [parentFetchError, parentResult] = await fetchODataList<TaxonomyGenusInfoItem>(
    `taxonomygenera?$filter=id eq ${parentId}`
  );

  const [parentFamilyFetchError, parentFamilyResult] = await fetchODataList<TaxonomyFamilyInfoItem>(
    `taxonomyfamilies?$filter=id eq ${parentResult?.items[0].taxonomyFamilyId}&$expand=taxonomyOrder($select=id,nameLat,nameCz;$expand=taxonomyClass($select=id,taxonomyPhylumId,nameLat,nameCz))`
  );

  const [phylaFetchError, phylaResult] = await fetchODataList<TaxonomyPhylumInfoItem>(
    `taxonomyphyla?$filter=id eq ${parentFamilyResult?.items[0].taxonomyOrder?.taxonomyClass?.taxonomyPhylumId}`
  );

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

  const tableSettings = await fetchTableSettings(userName!, TABLE_ID, {
    columnOrder: columnDef.map(c => c.accessorKey!),
    columnVisibility: columnDefVisibility
  });

  return data({
    genusId: parentId,
    genusInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: phylaResult?.items[0],
    hasEditPermission,
    items: listResult!.items,
    rdbCodes: (rdbCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    citeCodes: (citeCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    euCodes: (euCodesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    protectionTypes: (protectionTypesResult?.items || []).map((i) => {
      return { key: i.code, text: i.displayName } as SelectItemType<string, string>;
    }),
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(TABLE_ID);

export default function SpeciesList() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();
  const selectedChildKey = params.actionParam;

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(loaderData.columnVisibility || {});
  const [columnOrder, setColumnOrder] = useState<string[]>(loaderData.columnOrder || []);

  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

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
        id: loaderData.genusInfo!.id,
        nameLat: loaderData.genusInfo!.nameLat,
        nameCz: loaderData.genusInfo!.nameCz,
      },
      currentPage: {
        nameLat: 'Species',
        nameCz: 'Druh'
      }
    }
  };

  const gridOptions: MRT_TableOptions<TaxonomySpeciesItem> = {
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
      columnVisibility: columnVisibility,
      columnOrder: columnOrder
    },

    rowVirtualizerInstanceRef,

    renderTopToolbar: () => (<></>),
    renderBottomToolbar: () => (<></>),

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
          navigate(`/records/genera/${loaderData.genusId}/species/${row.original.id}${location.search}`, { replace: true });
        },

        onFocus: () => {
          navigate(`/records/genera/${loaderData.genusId}/species/${row.original.id}${location.search}`, { replace: true });
        },

        onDoubleClick: () => {
          navigate(`/records/species/${row.original.id}/specimens/`, { replace: true });
        },

        onKeyDown: (evt: React.KeyboardEvent) => {
          if (evt.key === 'Enter') {
            evt.stopPropagation();
            evt.preventDefault();
            navigate(`/records/species/${row.original.id}/specimens/`, { replace: true });
          }
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

  const openNewItemForm = () => {
    navigate(`/records/genera/${loaderData.genusId}/species/new${location.search}`, { replace: true });
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
        navigate(`/records/genera/${loaderData.genusId}/species/${loaderData.items[0].id}${location.search}`, { replace: true });
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

  const selectedIds = Object.keys(table.getState().rowSelection).map((rid) => parseInt(rid));
  const [moveItemsVisible, setMoveItemsVisible] = useState(false);

  const showFilteredSpecimens = () => {
    const filtersToApply = [
      {
        id: 'speciesId',
        value: selectedIds.map(i => i.toString())
      }
    ];

    const filterParam = encodeColumnFilters(filtersToApply);

    navigate(`/exemplar-list?columnFilters=${encodeURIComponent(filterParam)}`);
  };

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/genera/${loaderData.genusId}/species/export-xls`,
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

                    <Tooltip content="Zobrazit exempláře">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-center"
                        isDisabled={selectedIds.length === 0}
                        onPress={showFilteredSpecimens}>
                        <span className="min-w-[12px]">E</span>
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
          <MoveSpecies
            selectedIds={selectedIds}
            currentParentId={loaderData.genusId}
            onClose={() => {
              setMoveItemsVisible(false);
            }} />
        )}
      </div>
    </>
  );
}
