import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useLoaderData, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { fetchTableSettings } from "~/.server/table-settings";
import { getUserName, getUserPermissions } from "~/.server/user-session";
import { RecordsPageGridHeader } from "~/components/records/records-pages-controls";
import { enumerationsToSelects } from "~/lib/mappers";
import { getExportXlsUrl } from "~/lib/table-params-encoder-decoder";
import { createPostTableSettingsHandler } from "~/lib/table-settings";
import { cn } from "~/lib/utils";
import { EnumerationType } from "~/shared/models";
import { RECORDS_EDIT, DOCUMENTATION_DEPARTMENT, hasOneOfPermissions } from "~/shared/permissions";
import { documentsColumnDef, documentsColumnDefisibility, flattenODataSpeciesDocumentResult, SPECIES_DOCUMENS_TABLE_ID } from "./../grid-definitions";
import { TaxonomyFamilyInfoItem, TaxonomySpeciesDocumentItem, TaxonomySpeciesInfoItem } from "./../models";
import { TaxonomyPhylumInfoItem } from "../../models";
import { Card } from "~/components/ui/card";
import { NoSsr } from "@mui/material";
import { MaterialReactTable } from "material-react-table";
import { useConfiguredTable, useDefaultTableRedirects } from "~/components/hooks/table-hooks";
import { useFileDownload } from "~/components/hooks/use-file-download";

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

  const [fetchError, listResult] = await fetchODataList<TaxonomySpeciesDocumentItem>(
    `documentspecies?$count=true&$orderby=date&$filter=speciesId eq ${parentId}&$expand=documentType`
  );

  const [parentFetchError, parentResult] = await fetchODataList<TaxonomySpeciesInfoItem>(
    `species?$filter=id eq ${parentId}&$expand=taxonomyGenus($select=id,nameLat,nameCz,taxonomyFamilyId)`
  );

  const [parentFamilyFetchError, parentFamilyResult] = await fetchODataList<TaxonomyFamilyInfoItem>(
    `taxonomyfamilies?$filter=id eq ${parentResult?.items[0].taxonomyGenus?.taxonomyFamilyId}&$expand=taxonomyOrder($select=id,nameLat,nameCz;$expand=taxonomyClass($select=id,nameLat,nameCz,taxonomyPhylumId))`
  );

  const [documentTypesError, documentTypesResult] = await fetchODataList<EnumerationType>(
    'speciesdocumenttypes?$orderby=sort'
  );

  const [phylaFetchError, phylaResult] = await fetchODataList<TaxonomyPhylumInfoItem>(
    `taxonomyphyla?$filter=id eq ${parentFamilyResult?.items[0].taxonomyOrder?.taxonomyClass?.taxonomyPhylumId}`
  );

  const flattenedItems = (listResult?.items || []).map(flattenODataSpeciesDocumentResult);

  const tableSettings = await fetchTableSettings(userName!, SPECIES_DOCUMENS_TABLE_ID, {
    columnOrder: documentsColumnDef.map(c => c.accessorKey!),
    columnVisibility: documentsColumnDefisibility
  });

  return data({
    speciesId: parentId,
    speciesInfo: parentResult?.items[0],
    familyInfo: parentFamilyResult?.items[0],
    phylumInfo: phylaResult?.items[0],
    items: flattenedItems,
    documentTypes: enumerationsToSelects(documentTypesResult?.items),
    hasEditPermission,
    ...tableSettings
  });
}

const postTableSettings = createPostTableSettingsHandler(SPECIES_DOCUMENS_TABLE_ID);

export default function List() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDownloading, downloadFile } = useFileDownload();
  const selectedChildKey = params.actionParam;

  const selectedItem = loaderData.items.find((i) => i.id.toString() === selectedChildKey);

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
        nameLat: 'Species',
        nameCz: 'Druh'
      }
    }
  };

  const goToDetail = (id: number) => {
    navigate(`/records/species/${loaderData.speciesId}/documents/${id}${location.search}`, { replace: true });
  }

  const openNewItemForm = () => {
    navigate(`/records/species/${loaderData.speciesId}/documents/new${location.search}`, { replace: true });
  };

  const { table, rowVirtualizerInstanceRef } = useConfiguredTable<TaxonomySpeciesDocumentItem>({
    searchParams,
    setSearchParams,
    currentColumnVisibility: loaderData.columnVisibility || {},
    currentColumnOrder: loaderData.columnOrder || [],
    postTableSettings,
    columns: documentsColumnDef,
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

          onKeyDown: (evt: React.KeyboardEvent) => {
            if (evt.key === 'Enter') {
              evt.stopPropagation();
              evt.preventDefault();
            }
          }
        };
      },
    }
  });

  useDefaultTableRedirects<TaxonomySpeciesDocumentItem>({
    items: loaderData.items,
    selectedChildKey,
    table,
    rowVirtualizerRef: rowVirtualizerInstanceRef,
    openNewItemForm: () => {
      openNewItemForm();
    },
    openDefaultItem: () => {
      goToDetail(loaderData.items[0].id);
    }
  }, [selectedChildKey, loaderData.items, navigate]);

  const handleExport = async () => {
    const url = getExportXlsUrl(
      `/records/species/${loaderData.speciesId}/documents-export-xls`,
      searchParams
    );

    await downloadFile(url);
  };

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
              onNewItem={openNewItemForm}
              noNewItem={!loaderData.hasEditPermission}
              onExport={handleExport}
              isExporting={isDownloading}
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
