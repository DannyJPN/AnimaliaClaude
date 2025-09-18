import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardTitle, CardFooter } from "~/components/ui/card";
import { TextField } from "~/components/ui/textfield";
import { Label } from "~/components/ui/field";
import { TextArea } from "~/components/ui/textfield";
import { FieldError } from "~/components/ui/field";
import DateRangePicker from "~/components/ui/daterangepicker";
import { useFileDownload } from "~/components/hooks/use-file-download";

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

export default function FeedingDaysReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const { isDownloading, downloadFile } = useFileDownload();
  
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const handleDownload = async () => {
    if (!dateFrom || !dateTo) return;
    
    try {
      const params = {
        minDate: dateFrom,
        maxDate: dateTo
      };
      
      const url = `/print-reports/economy/economy-of-movement-transactions?${new URLSearchParams(params as any).toString()}`;
      await downloadFile(url);
    } catch (error) {
      console.error('Error initiating download:', error);
    }
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

          <div className="space-y-2">
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
            />
          </div>
        </CardContent>

        <CardFooter className="p-2 pt-0">
          <Button
            type="button"
            aria-label="Generovat Report"
            variant='default'
            size="sm"
            onPress={handleDownload}
            isDisabled={!dateFrom || !dateTo}>
            <FileDownIcon className="size-3 mr-2" />
            Generovat Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}