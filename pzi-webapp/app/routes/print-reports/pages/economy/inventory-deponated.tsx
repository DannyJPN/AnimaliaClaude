/* ZA-100 -> Sestavy/Programy - Ekonomika - Stav deponací ke dni */

import { FileDownIcon } from "lucide-react";
import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { printReports } from "../../data";
import { PrintReport } from "../../models";
import { useFileDownload } from "~/components/hooks/use-file-download";
import SingleDatePicker from "~/components/ui/singledatepicker";

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

export default function InventoryDeponated() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [date, setDate] = useState<string>("");
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    const params = {
      date: date
    };

    const fileUrl = `/print-reports/economy/inventory-deponated-export?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(fileUrl);
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

            <SingleDatePicker
              label="Datum ke dni"
              value={date}
              onChange={(val) => setDate(val)}
            />
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              isDisabled={isDownloading || !date}
              onPress={handleDownload}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
