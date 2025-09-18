/* Sestavy / Zoologie: Statistika kadáverů v období (filtr na druh) */

import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { useFileDownload } from "~/components/hooks/use-file-download";
import DateRangePicker from "~/components/ui/daterangepicker";
 
 
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

export default function StatisticsCadaversBySpeciesReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [speciesId, setSpeciesId] = useState<string>("");
  
  const { isDownloading, downloadFile } = useFileDownload();
  
  const handleDownload = async () => {
    if (!dateFrom || !dateTo || !speciesId) return;
    
    const params = {
      dateFrom: dateFrom,
      dateTo: dateTo,
      mode: "kadaverTab",
      speciesId: speciesId 
    };
    
    const fileUrl = `/print-reports/zoology/statistics-cadavers-in-period?${new URLSearchParams(params as any).toString()}`;

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

            <TextField
              name="speciesId">
              <Label>ID druhu</Label>
              <Input 
                type="text" 
                value={speciesId}
                onChange={(e) => setSpeciesId(e.target.value)}
              />
              <FieldError />
            </TextField>
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={isDownloading || !dateFrom || !dateTo || !speciesId}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
