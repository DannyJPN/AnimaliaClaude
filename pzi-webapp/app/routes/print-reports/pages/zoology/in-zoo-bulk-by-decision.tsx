/* ZA-54 -> Sestavy / Zoologie - V majetku (hromadne) - podle rozhodnuti */

import { FileDownIcon } from "lucide-react";
import { PrintReport, InZooFilterMode } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectPopover, SelectListBox } from "~/components/ui/select";
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

export default function InZooBulkByDecision() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [decisionType, setDecisionType] = useState<string>(InZooFilterMode.DecisionCrException);
  
  const { isDownloading, downloadFile } = useFileDownload();
  
  const handleDownload = async () => {
    if (!decisionType) return;
    
    const params = {
      mode: decisionType,
    };

    var fileUrl =  `/print-reports/zoology/in-zoo-bulk-by-decision?${new URLSearchParams(params as any).toString()}`;

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

            <TextField name="decisionTypeSelect" className="col-span-4">
              <Label>Skupina</Label>
              <Select 
                selectedKey={decisionType}
                defaultSelectedKey="CRVyjimka"
                onSelectionChange={(value) => setDecisionType(value as string)}
                aria-label="Typ rozhodnutí"
                isRequired
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectListBox>
                    <SelectItem id={InZooFilterMode.DecisionCrException}>ČR výjimka</SelectItem>
                    <SelectItem id={InZooFilterMode.DecisionEuFauna}>EU fauna</SelectItem>
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
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={isDownloading || !decisionType}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}