/* ZA-41 Sestavy / Zoologie - Pohyb v obdobi bez vlivu na stav v zoo (P2) */

import { FileDownIcon } from "lucide-react";
import { PrintReport, StateInfluenceMode } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";

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

export default function InventoryMovementsNoInfluenceReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    if (!dateFrom || !dateTo) return;
    
    const params = {
      minDate: dateFrom,
      maxDate: dateTo,
      stateInfluence: StateInfluenceMode.WithoutInfluence
    };
    
    await downloadFile(`/print-reports/zoology/inventory-movements?${new URLSearchParams(params as any).toString()}`);
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

            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
            />

          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={ isDownloading || !dateFrom || !dateTo}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
