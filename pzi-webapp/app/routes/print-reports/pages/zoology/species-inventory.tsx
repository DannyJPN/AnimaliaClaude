/* Sestavy / Programy: Inventura */

import { FileDownIcon } from "lucide-react";
import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { TextArea, TextField } from "~/components/ui/textfield";
import { printReports } from "../../data";
import { PrintReport } from "../../models";
import SingleDatePicker from "~/components/ui/singledatepicker";
import { useFileDownload } from "~/components/hooks/use-file-download";
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

export default function SpeciesInventoryReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [statusDate, setStatusDate] = useState<string>('');
  const { isDownloading, downloadFile } = useFileDownload();
  const [vertebrateFilter, setVertebrateFilter] = useState<string>('vertebrate');

  const handleDownload = async () => {
    if (!statusDate) return;

    const params = {
      statusDate: statusDate,
      type: vertebrateFilter
    };

    var exportUrl = `/print-reports/zoology/species-inventory?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(exportUrl);
  };

  return (
    <div className="w-full">
      <Card className="rounded-none border bg-card text-card-foreground shadow-none">
        <fieldset
          disabled={false}
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

            <SingleDatePicker
              value={statusDate}
              onChange={(val) => setStatusDate(val)}
              label="Ke dni"
            />
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={!statusDate || isDownloading}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
