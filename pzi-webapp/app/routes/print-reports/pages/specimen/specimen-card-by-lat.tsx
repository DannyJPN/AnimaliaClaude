/* ZA-30 / ZA-280 -> Sestavy / Programy: Exempláře - Karty exemplářů - LAT (P3) */

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

export default function SpecimenCardByLat() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const { isDownloading, downloadFile } = useFileDownload();
  
  const [selectedSpeciesOption, setSelectedSpeciesOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState("");
  const speciesSearchQueryDebounced = useDebounceValue(speciesSearchQuery, 500);
  const [accessionNumberFrom, setAccessionNumberFrom] = useState<number>();
  const [accessionNumberTo, setAccessionNumberTo] = useState<number>();
  

  const speciesQuery = useQuery({
    queryKey: ['species-search', speciesSearchQueryDebounced, ""],
    enabled: speciesSearchQueryDebounced.length >= 2,
    queryFn: async ({ signal }) => {
      if (!speciesSearchQueryDebounced || speciesSearchQueryDebounced.length < 2) {
        return [];
      }

      const result = await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-species',
        {
          method: 'POST',
          body: JSON.stringify({
            query: speciesSearchQueryDebounced,
          }),
          signal: signal
        }
      );

      return result;
    }
  });

  const handleSpeciesSearch = (value: string) => {
    if (value === selectedSpeciesOption?.text) {
      return;
    }

    setSpeciesSearchQuery(value);
  };

  const handleSpeciesSelect = (key: number | undefined) => {
    if (key === undefined) {
      setSelectedSpeciesOption(undefined)
    }

    const selectedSuggestion = speciesSuggestions.find((option) => option.key === key);
    setSelectedSpeciesOption(selectedSuggestion);
  };

  const [speciesSuggestions, setSpeciesSuggestions] = useState<SelectItemType<number, string>[]>([]);

  useEffect(() => {
    const newData = speciesQuery.data || [];

    if (selectedSpeciesOption && !newData.some((itm) => itm.key === selectedSpeciesOption?.key)) {
      newData.push(selectedSpeciesOption!);
    }

    setSpeciesSuggestions(newData);
  }, [speciesQuery.data]);

  const handleDownload = async () => {
    if (!selectedSpeciesOption || !accessionNumberFrom || !accessionNumberTo) return;

    try {
      const params = {
        speciesId: selectedSpeciesOption.key,
        accessionNumberFrom: accessionNumberFrom,
        accessionNumberTo: accessionNumberTo
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

            <JollyComboBox
              label="Zvolit druh"
              name="speciesId"
              items={speciesSuggestions}
              selectedKey={selectedSpeciesOption?.key}
              onSelectionChange={(key) => {
                handleSpeciesSelect(key as number);
              }}
              onInputChange={handleSpeciesSearch}
              allowsEmptyCollection
              isLoading={speciesQuery.isLoading}>
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="accessionNumberFrom">
              <Label>Min. přírůstkové číslo</Label>
              <Input 
                type="number" 
                value={accessionNumberFrom}
                onChange={(e) => setAccessionNumberFrom(e.target.valueAsNumber)}
              />
              <FieldError />
            </TextField>

            <TextField
              name="accessionNumberTo">
              <Label>Max. přírůstkové číslo</Label>
              <Input 
                type="number" 
                value={accessionNumberTo}
                onChange={(e) => setAccessionNumberTo(e.target.valueAsNumber)}
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
              isDisabled={!selectedSpeciesOption || !accessionNumberFrom || !accessionNumberTo || isDownloading}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}