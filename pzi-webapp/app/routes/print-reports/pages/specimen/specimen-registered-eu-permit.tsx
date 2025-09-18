/* ZA-282 -> Frontend - Sestavy / Programy: Exempláře - EU permit (P2) */

import { FileDownIcon, SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { printReports } from "../../data";
import { PrintReport } from "../../models";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Select, SelectItem, SelectListBox, SelectPopover, SelectTrigger, SelectValue } from "~/components/ui/select";

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

export default function RegisteredEuPermit() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;

  const [specimenId, setSpecimenId] = useState<number>();
  const [selectedOrigin, setSelectedOrigin] = useState<{code: string, displayName: string, sort: number, note?: string} | null>(null);
  const [originTypes, setOriginTypes] = useState<{code: string, displayName: string, sort: number, note?: string}[]>([]);

  const { isDownloading, downloadFile } = useFileDownload();

  // Load origin types from database
  useEffect(() => {
    const loadOriginTypes = async () => {
      try {
        const response = await fetch('/api/origin-types');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setOriginTypes(data || []);
      } catch (error) {
        console.error('Error loading origin types:', error);
      }
    };
    loadOriginTypes();
  }, []);

  const handleDownload = async () => {
    if (!specimenId) return;

    const params: any = {
      specimenId: specimenId
    };

    if (selectedOrigin) {
      params.origin = selectedOrigin.code;
    }

    const fileUrl = `/print-reports/specimen/specimen-registered-eu-permit?${new URLSearchParams(params).toString()}`;

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

            <TextField name="origin">
              <Label>Původ</Label>
              <Select 
                selectedKey={selectedOrigin?.code}
                onSelectionChange={(key) => {
                  const origin = key ? originTypes.find(o => o.code === key) : null;
                  setSelectedOrigin(origin || null);
                }}
                placeholder="Vyberte původ"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectListBox>
                    {originTypes.map(origin => (
                      <SelectItem key={origin.code} id={origin.code}>
                        {origin.code}{origin.note ? `|${origin.note}` : ''}
                      </SelectItem>
                    ))}
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
