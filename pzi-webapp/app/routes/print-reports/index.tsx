import { NoSsr } from "@mui/material";
import { MaterialReactTable, MRT_ShowHideColumnsButton, MRT_TableOptions, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_CS } from 'material-react-table/locales/cs';
import { RouterProvider } from "react-aria-components";
import { data, LoaderFunctionArgs, Outlet, ShouldRevalidateFunctionArgs, useHref, useLoaderData, useLocation, useNavigate, useSearchParams, useSubmit } from "react-router";
import { useTableSearchParams } from "tanstack-table-search-params";
import { getUserName } from "~/.server/user-session";
import { printReportsTableDefaults } from "~/components/table-defaults";
import { buttonVariants } from "~/components/ui/button";
import { printReports } from "./data";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { columnDef, columnVisibility } from "./grid-definition";
import { PrintReport, PrintReportType } from "./models";
import { useState } from "react";
import { getEnumKeyByValue } from "~/shared/utility";

export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  // revalidate on POST actions
  if (args.actionStatus
    && args.actionStatus === 200
    && args.actionResult
    && args.actionResult.success) {
    return true;
  }

  // do not revalidate on same url
  if (args.currentUrl.href === args.nextUrl.href) {
    return false;
  }

  // do not revalidate when on child path
  return args.nextUrl.pathname.startsWith('/print-exports/reports-list/')
    && args.nextUrl.search !== args.currentUrl.search;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userName = await getUserName(request);

  return data({
    items: printReports,
    totalCount: printReports?.length || 0,
  });
}

export default function TableDataList() {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReportType, setSelectedReportType] = useState<string>("All");
  const [selectedRow, setSelectedRow] = useState<PrintReport | null>(null);

  const stateAndOnChanges = useTableSearchParams({
    replace: (url) => {
      const newSearchParams = new URLSearchParams(url);
      setSearchParams(newSearchParams);
    },
    query: searchParams,
    pathname: '',
  });

  const handleRowSelect = (report: PrintReport) => {
    if (!report.link) return; // Don't navigate if there's no link
    
    setSelectedRow(report);
    const linkPath = report.link
      .startsWith('/') ? report.link.substring(1) : report.link;
    
    // Remove print-exports/reports-list/ prefix if present
    const finalPath = linkPath.replace(/^print-exports\/reports-list\//, '');
    // Append the report ID as a query parameter
    navigate(`${finalPath}?reportId=${report.id}`, { replace: true });
  };

  const tableOptions: MRT_TableOptions<PrintReport> = {
    localization: MRT_Localization_CS,
    ...printReportsTableDefaults,
    enablePagination: false,
    paginationDisplayMode: 'pages',

    positionToolbarAlertBanner: 'none',

    data: loaderData.items.filter(item => {
      const itemEnumKey = getEnumKeyByValue(PrintReportType, item.type ?? '');
      return selectedReportType === "All" || itemEnumKey === selectedReportType;
    }),
    rowCount: loaderData.totalCount,
    columns: columnDef,

    initialState: {
      density: "compact",
      columnVisibility: columnVisibility,
    },
    
    displayColumnDefOptions: { },

    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        row.toggleSelected();
        handleRowSelect(row.original);
      },
      className: selectedRow?.id === row.original.id ? 'row-selected' : '',
      sx: {
        cursor: 'pointer',
        backgroundColor: selectedRow?.id === row.original.id ? 'hsl(var(--secondary))' : '',
      },
    }),

    renderTopToolbar: (props) => {
      return (
        <div className="@container">
          <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">

            <div className="flex items-center">

              <Select
                className="min-w-48"
                aria-label="Sestavy"
                defaultSelectedKey="All"
                selectedKey={selectedReportType}
                onSelectionChange={(key) => {
                  setSelectedReportType(key.toString());
                }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectPopover className="min-w-48">
                  <SelectListBox>
                    <SelectItem id="All">
                      Všechny
                    </SelectItem>
                    <SelectItem id="Specimen">
                      Exempláře
                    </SelectItem>
                    <SelectItem id="Species">
                      Druhy
                    </SelectItem>
                    <SelectItem id="Economy">
                      Ekonomika
                    </SelectItem>
                    <SelectItem id="Zoology">
                      Zoologie
                    </SelectItem>
                    <SelectItem id="Mzpr">
                      MŽPR
                    </SelectItem>
                  </SelectListBox>
                </SelectPopover>
              </Select>
            </div>

          </div>

          <div className="w-full flex-1 sm:flex sm:flex-row p-2 gap-4">
            <div className="grow"></div>

            <div className="flex flex-row-reverse gap-1 content-center items-center">

              <MRT_ShowHideColumnsButton
                className={cn("custom-showhide-icon")}
                table={table}>
              </MRT_ShowHideColumnsButton>
            </div>
          </div>
        </div>
      );
    },

    ...stateAndOnChanges
  };

  const table = useMaterialReactTable(tableOptions);

  return (
    <div className="flex-1 md:flex">
      <div className="w-full md:w-1/2">
        <RouterProvider navigate={navigate} useHref={useHref}>
          <div className="w-full">
            <NoSsr>
              <MaterialReactTable table={table} />
            </NoSsr>
          </div>
        </RouterProvider>
      </div>
      <div className="w-full md:w-1/2">
        <Outlet />
      </div>
    </div>
  )
};
