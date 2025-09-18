import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";

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

interface LoaderData {
  report: PrintReport;
}

export default function ContractsByDate() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;

  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    if (!minDate && !maxDate) return;

    const params = {
      minDate: minDate,
      maxDate: maxDate
    };

    const fileUrl = `/print-reports/economy/contracts-by-date?${new URLSearchParams(params as any).toString()}`;

    await downloadFile(fileUrl);
  };

  return (
    <div className="w-full">
      <Card className="rounded-none border bg-card text-card-foreground shadow-none">
        <fieldset className="flex flex-wrap gap-4 p-2 bg-secondary min-h-[50px]">
          <CardTitle className="text-xl p-4">
            {report.type} - {report.name}
          </CardTitle>
        </fieldset>

        <div>
          <CardContent className="p-2 pt-0 space-y-4">

            <TextField isDisabled name="note" defaultValue={report.description} className="col-span-4">
              <Label>Popis</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <div className="space-y-2">
              <DateRangePicker
                from={minDate}
                to={maxDate}
                onChange={(from, to) => {
                  setMinDate(from);
                  setMaxDate(to);
                }}
              />
            </div>

          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button type="button" isDisabled={isDownloading || (!minDate && !maxDate)} onPress={handleDownload}>
              <FileDownIcon className="mr-2 h-4 w-4" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
