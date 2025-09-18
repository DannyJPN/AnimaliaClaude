// Sestavy / Ekonomika – Inventura všech rajonů (bez volby rajonu)

import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import SingleDatePicker from "~/components/ui/singledatepicker";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectPopover, SelectListBox } from "~/components/ui/select";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get("reportId");

  if (!reportId) {
    throw new Error("Report ID is required");
  }

  const report = printReports.find((r) => r.id === Number(reportId));
  if (!report) {
    throw new Error("Report not found");
  }
  return { report };
}

type LoaderData = {
  report: PrintReport;
};

export default function RegionInventoryAllReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [date, setDate] = useState<string>("");
  const [vertebrateFilter, setVertebrateFilter] = useState<string>('vertebrate');
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    if (!date) return;

    const params = { 
      date,
      isVertebrate: (vertebrateFilter === 'vertebrate').toString()
    };

    var fileUrl = `/print-reports/economy/region-inventory-all?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(fileUrl);
  };

  return (
    <div className="w-full">
      <Card className="rounded-none border bg-card text-card-foreground shadow-none">
        <fieldset
          disabled={false}
          className="flex flex-wrap gap-4 p-2 bg-secondary min-h-[50px]"
        >
          <CardTitle className="text-xl p-4">
            {report.type} - {report.name}
          </CardTitle>
        </fieldset>

        <div>
          <CardContent className="p-2 pt-0 space-y-4">
            <TextField isDisabled={true} name="note" defaultValue={report.description} className="col-span-4">
              <Label>Popis</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <SingleDatePicker
              label="Ke dni"
              value={date}
              onChange={(val) => setDate(val)}
            />
            
            <TextField name="vertebrateFilter" className="col-span-4">
              <Label>Skupina</Label>
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
              type="button"
              aria-label="Generovat Report"
              variant="default"
              size="sm"
              onPress={handleDownload}
              isDisabled={!date || isDownloading}
            >
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
