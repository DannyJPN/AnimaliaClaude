import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardTitle, CardFooter } from "~/components/ui/card";
import { TextField } from "~/components/ui/textfield";
import { Label } from "~/components/ui/field";
import { TextArea } from "~/components/ui/textfield";
import { FieldError } from "~/components/ui/field";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { useQuery } from "@tanstack/react-query";
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

export default function DepositInquiryEngReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const { isDownloading, downloadFile } = useFileDownload();
  
  const [selectedPartnerOption, setSelectedPartnerOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const partnerFiltersQueryDebounced = useDebounceValue(partnerSearchQuery, 20);

  const partnerFiltersSuggestionsData = useQuery({
    queryKey: ['partner-suggestions', partnerFiltersQueryDebounced],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!partnerFiltersQueryDebounced || partnerFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-zoo-partner',
        {
          method: 'POST',
          body: JSON.stringify({
            query: partnerFiltersQueryDebounced
          })
        }
      );
    }
  });

  const handlePartnerSearch = (value: string) => {
    if (value === selectedPartnerOption?.text) {
      return;
    }

    setPartnerSearchQuery(value);
  };

  const handlePartnerSelect = (key: number | undefined) => {
    if (key === undefined) {
      setSelectedPartnerOption(undefined)
    }

    const selectedSuggestion = partnerSuggestions.find((option) => option.key === key);
    setSelectedPartnerOption(selectedSuggestion);
  };

  const [partnerSuggestions, setPartnerSuggestions] = useState<SelectItemType<number, string>[]>([]);

  useEffect(() => {
    const newData = partnerFiltersSuggestionsData.data || [];

    if (selectedPartnerOption && !newData.some((itm) => itm.key === selectedPartnerOption?.key)) {
      newData.push(selectedPartnerOption!);
    }

    setPartnerSuggestions(newData);
  }, [partnerFiltersSuggestionsData.data, selectedPartnerOption]);

  const handleDownload = async () => {
      if (!selectedPartnerOption) {
        alert('Partner is required');
        return;
      }

      const params = new URLSearchParams({
        language: 'eng',
        partnerId: selectedPartnerOption.key.toString()
      });

      const url = `/print-reports/exports/economy/deposit-inquiry-export?${params.toString()}`;
      await downloadFile(url);
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
            <Label>Description</Label>
            <TextArea />
            <FieldError />
          </TextField>

          <JollyComboBox
            label="Zvolit partnera"
            name="partnerId"
            items={partnerSuggestions}
            selectedKey={selectedPartnerOption?.key}
            onSelectionChange={(key) => {
              handlePartnerSelect(key as number);
            }}
            onInputChange={handlePartnerSearch}
            allowsEmptyCollection
            isLoading={partnerFiltersSuggestionsData.isLoading}>
            {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
          </JollyComboBox>
        </CardContent>

        <CardFooter className="p-2 pt-0">
          <Button
            type="button"
            aria-label="Generate Report"
            variant='default'
            size="sm"
            onPress={handleDownload}
            isDisabled={!selectedPartnerOption || isDownloading}>
            <FileDownIcon className="size-3 mr-2" />
            Generate Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
