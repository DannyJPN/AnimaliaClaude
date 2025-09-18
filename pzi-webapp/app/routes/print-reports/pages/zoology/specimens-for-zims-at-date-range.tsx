// Sestavy / Zoologie - Seznam exemplářů pro ARKS v období

import { FileDownIcon } from "lucide-react";
import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { TextArea, TextField } from "~/components/ui/textfield";
import { printReports } from "../../data";
import { PrintReport } from "../../models";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectPopover, SelectListBox } from "~/components/ui/select";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get('reportId');

  if (!reportId) {
    throw new Error('Report ID is required');
  }

  const report = printReports.find(r => r.id === Number(reportId));

  if (!report) {
    throw new Error('Report not found');
  }

  return { report };
}

type LoaderData = {
  report: PrintReport;
};

export default function Report() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [statusDateRange, setStatusDateRange] = useState<string>('');
  const [vertebrateFilter, setVertebrateFilter] = useState<string>('vertebrate');
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    const params = {
      dateRange: statusDateRange,
      isVertebrate: (vertebrateFilter === 'vertebrate').toString()
    };
 
    const fileUrl = `/print-reports/zoology/specimens-for-zims-at-date-range-export?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(fileUrl);
  };

  return (
    <div className="w-full">
      <Card className="rounded-none border bg-card text-card-foreground shadow-none">
        <fieldset
          disabled={isDownloading}
          className="flex flex-wrap gap-4 p-2 bg-secondary min-h-[50px]">
          <CardTitle className="text-xl p-4">
            {report.type} - {report.name}
          </CardTitle>
        </fieldset>

        <div>
          <CardContent className="p-2 pt-0 space-y-4">
            <TextField
              isDisabled={true}
              name="note"
              defaultValue={report.description}
              className="col-span-4">
              <Label>Popis</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <ZooFormatDateField
              name="statusDateRange"
              label="Období"
              placeholder="YYYY/MM"
              value={statusDateRange}
              onChange={(e) => setStatusDateRange(e)}>
            </ZooFormatDateField>

            <TextField name="vertebrateFilter" className="col-span-4">
              <Label>Typ</Label>
              <Select 
                selectedKey={vertebrateFilter}
                defaultSelectedKey="vertebrate"
                onSelectionChange={(value) => setVertebrateFilter(value as string)}
                aria-label="Vertebrate filter"
                isRequired
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectListBox>
                    <SelectItem id="vertebrate">Vertebrates</SelectItem>
                    <SelectItem id="invertebrate">Invertebrates</SelectItem>
                  </SelectListBox>
                </SelectPopover>
              </Select>
              <FieldError />
            </TextField>
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              isDisabled={isDownloading || !statusDateRange || !vertebrateFilter}
              type="button"
              aria-label="Stáhnout CSV"
              variant='default'
              size="sm"
              onClick={handleDownload}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
