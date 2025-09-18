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

type LoaderData = {
  report: PrintReport;
};

export default function RegistrationsListReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const { isDownloading, downloadFile } = useFileDownload();

  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [errors, setErrors] = useState<{ minDate?: string; maxDate?: string }>({});

  const isValidDateFormat = (value: string) => /^\d{4}\/\d{2}\/\d{2}$/.test(value);

  const handleDownload = async () => {
    const newErrors: typeof errors = {};

    if (!isValidDateFormat(minDate)) {
      newErrors.minDate = "Datum musí být ve formátu YYYY/MM/DD";
    }
    if (!isValidDateFormat(maxDate)) {
      newErrors.maxDate = "Datum musí být ve formátu YYYY/MM/DD";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const params = { minDate, maxDate };
      const url = `/print-reports/economy/economy-of-movement-summary?${new URLSearchParams(params).toString()}`;
      await downloadFile(url);
    } catch (error) {
      console.error("Error initiating download:", error);
    }
  };

  return (
    <div className="w-full">
      <Card className="rounded-none border bg-card text-card-foreground shadow-none">
        <fieldset disabled={false} className="flex flex-wrap gap-4 p-2 bg-secondary min-h-[50px]">
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

            <DateRangePicker
              from={minDate}
              to={maxDate}
              onChange={(from, to) => { setMinDate(from); setMaxDate(to); }}
            />
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant="default"
              size="sm"
              onPress={handleDownload}
              isDisabled={!minDate || !maxDate}
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
