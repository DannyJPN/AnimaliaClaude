/* Sestavy / Zoologie: Statistika ke dni podle řádu */
import { FileDownIcon } from "lucide-react";
import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { TextArea, TextField } from "~/components/ui/textfield";
import SingleDatePicker from "~/components/ui/singledatepicker";
import { printReports } from "../../data";
import { PrintReport } from "../../models";
import { useFileDownload } from "~/components/hooks/use-file-download";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get('reportId');

  if (!reportId) {
    throw new Error('Report ID is required');
  }

  const report = printReports.find(r => r.id === parseInt(reportId));
  if (!report) {
    throw new Error(`Report with ID ${reportId} not found`);
  }

  return { report };
}

type LoaderData = {
  report: PrintReport;
};

export default function StatisticsByOrderReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [date, setDate] = useState<string>("");
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    if (!date) return;

    // Construct query params - používáme pouze formát YYYY/MM/DD
    const params = {
      date: date
    };

    var exportUrl = `/print-reports/zoology/statistics-by-order?${new URLSearchParams(params as any).toString()}`;

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
              onPress={handleDownload}
              isDisabled={!date || isDownloading}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
