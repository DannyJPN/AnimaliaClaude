/* Sestavy / Zoologie - EU fauna */

import { FileDownIcon } from "lucide-react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { TextArea, TextField } from "~/components/ui/textfield";
import { printReports } from "../../data";
import { PrintReport } from "../../models";

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

export default function EuFaunaReport() {
  // Get data from the loader
  const { report } = useLoaderData<typeof loader>() as LoaderData;

  const { isDownloading, downloadFile } = useFileDownload();

  // Handle download by redirecting to the export endpoint
  const handleDownload = async () => {
    const params = {
      protectionType: 'eufauna'
    };

    var fileUrl = `/print-reports/zoology/eu-fauna?${new URLSearchParams(params as any).toString()}`;

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
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              isDisabled={isDownloading}
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onClick={handleDownload}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
