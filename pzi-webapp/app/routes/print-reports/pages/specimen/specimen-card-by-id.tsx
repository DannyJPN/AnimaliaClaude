/* ZA-28 / ZA-278 -> Sestavy / Programy: Exempláře - Karty exemplářů - ID (P2) */

import { FileDownIcon } from "lucide-react";
import { PrintReport, InZooFilterMode } from "../../models";
import { printReports } from "../../data";
import { SelectItemType } from "~/shared/models";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { fetchJson } from "~/lib/fetch";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";

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

export default function SpecimenCardById() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const { isDownloading, downloadFile } = useFileDownload();
  
  const [specimenId, setSpecimenId] = useState<number>();
  
  const handleDownload = async () => {
    if (!specimenId) return;

    try {
      const params = {
        specimenId: specimenId
      };
      
      await downloadFile(`/print-reports/specimen/specimen-card?${new URLSearchParams(params as any).toString()}`);
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

            <TextField
              name="specimenId">
              <Label>ID Exempláře</Label>
              <Input 
                type="number" 
                value={specimenId}
                onChange={(e) => setSpecimenId(e.target.valueAsNumber)}
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
              isDisabled={!specimenId || isDownloading}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}