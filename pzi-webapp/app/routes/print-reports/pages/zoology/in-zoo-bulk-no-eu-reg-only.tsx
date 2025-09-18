/* ZA-53 -> Sestavy / Zoologie - V majetku (hromadne) - ne 've stavu' */

import { FileDownIcon } from "lucide-react";
import { PrintReport, InZooFilterMode } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
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

export default function InZooBulkNoEuPermitRegOnlyReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [selectedClassOption, setSelectedClassOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const classFiltersQueryDebounced = useDebounceValue(classSearchQuery, 20);

  const { isDownloading, downloadFile } = useFileDownload();

  const classFiltersSuggestionsData = useQuery({
    queryKey: ['class-suggestions', classFiltersQueryDebounced],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!classFiltersQueryDebounced || classFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-classes',
        {
          method: 'POST',
          body: JSON.stringify({
            query: classFiltersQueryDebounced
          })
        }
      );
    }
  });

  const handleClassSearch = (value: string) => {
    if (value === selectedClassOption?.text) {
      return;
    }

    setClassSearchQuery(value);
  };

  const handleClassSelect = (key: number | undefined) => {
    if (key === undefined) {
      setSelectedClassOption(undefined)
    }

    const selectedSuggestion = classSuggestions.find((option) => option.key === key);
    setSelectedClassOption(selectedSuggestion);
  };

  const [classSuggestions, setClassSuggestions] = useState<SelectItemType<number, string>[]>([]);

  useEffect(() => {
    const newData = classFiltersSuggestionsData.data || [];

    if (selectedClassOption && !newData.some((itm) => itm.key === selectedClassOption?.key)) {
      newData.push(selectedClassOption!);
    }

    setClassSuggestions(newData);
  }, [classFiltersSuggestionsData.data, selectedClassOption]);

  const handleDownload = async () => {
    if (!selectedClassOption) return;
    
    const params = {
      classId: selectedClassOption.key.toString()
    };

    const fileUrl = `/print-reports/zoology/in-zoo-bulk-no-eu-reg-only?${new URLSearchParams(params).toString()}`;

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

            <JollyComboBox
              name="class_id"
              label="Zvolit třídu"
              items={classSuggestions}
              selectedKey={selectedClassOption?.key}
              onSelectionChange={(k) => {
                handleClassSelect(k as number);
              }}
              onInputChange={handleClassSearch}
              allowsEmptyCollection
              isLoading={classFiltersSuggestionsData.isLoading}
            >
             {(item) => <ComboboxItem key={item.key} textValue={item.text}>{item.text}</ComboboxItem>}
            </JollyComboBox>
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={isDownloading || !selectedClassOption}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}