/* Sestavy / Ekonomika - Obálka */

import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectPopover, SelectListBox } from "~/components/ui/select";
import type { Key } from "react-aria-components";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reportId = url.searchParams.get("reportId");

  if (!reportId) {
    throw new Error("Report ID is required");
  }

  const report = printReports.find((r) => r.id === Number(reportId));

  if (!report) {
    throw new Error("Report not found");
  }

  return { report };
}

type LoaderData = {
  report: PrintReport;
};

export default function EnvelopeReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [selectedPartnerOption, setSelectedPartnerOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [selectedZooOption, setSelectedZooOption] = useState<SelectItemType<string, string> | undefined>(undefined);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const [zooSearchQuery, setZooSearchQuery] = useState("");
  const [addressType, setAddressType] = useState<"partner" | "zoo">("partner");
  
  const partnerSearchQueryDebounced = useDebounceValue(partnerSearchQuery, 500);
  const zooSearchQueryDebounced = useDebounceValue(zooSearchQuery, 500);

  // Partner autocomplete query
  const partnerQuery = useQuery({
    queryKey: ['partner-suggestions', partnerSearchQueryDebounced],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!partnerSearchQueryDebounced || partnerSearchQueryDebounced.length < 2) {
        return [];
      }
      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-zoo-partner',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: partnerSearchQueryDebounced })
        }
      );
    },
    enabled: !!partnerSearchQueryDebounced && partnerSearchQueryDebounced.length >= 2
  });

  // Zoo autocomplete query
  const zooQuery = useQuery({
    queryKey: ['zoo-suggestions', zooSearchQueryDebounced],
    queryFn: async (): Promise<SelectItemType<string, string>[]> => {
      if (!zooSearchQueryDebounced || zooSearchQueryDebounced.length < 2) {
        return [];
      }
      return await fetchJson<SelectItemType<string, string>[]>(
        '/autocompletes/autocomplete-zoos',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: zooSearchQueryDebounced })
        }
      );
    },
    enabled: !!zooSearchQueryDebounced && zooSearchQueryDebounced.length >= 2
  });

  const handlePartnerSearch = (value: string) => {
    if (value === selectedPartnerOption?.text) {
      return;
    }
    setPartnerSearchQuery(value);
  };

  const handlePartnerSelect = (key: number | undefined) => {
    if (key === undefined) {
      setSelectedPartnerOption(undefined);
      return;
    }
    const selectedSuggestion = partnerSuggestions.find((option) => option.key === key);
    setSelectedPartnerOption(selectedSuggestion);
  };

  const handleZooSearch = (value: string) => {
    if (value === selectedZooOption?.text) {
      return;
    }
    setZooSearchQuery(value);
  };

  const handleZooSelect = (key: string | undefined) => {
    if (key === undefined) {
      setSelectedZooOption(undefined);
      return;
    }
    const selectedSuggestion = zooSuggestions.find((option) => option.key === key);
    setSelectedZooOption(selectedSuggestion);
  };

  const [partnerSuggestions, setPartnerSuggestions] = useState<SelectItemType<number, string>[]>([]);
  const [zooSuggestions, setZooSuggestions] = useState<SelectItemType<string, string>[]>([]);

  useEffect(() => {
    const newData = partnerQuery.data || [];

    if (selectedPartnerOption && !newData.some((itm) => itm.key === selectedPartnerOption?.key)) {
      newData.push(selectedPartnerOption!);
    }

    setPartnerSuggestions(newData);
  }, [partnerQuery.data, selectedPartnerOption]);

  useEffect(() => {
    const newData = zooQuery.data || [];

    if (selectedZooOption && !newData.some((itm) => itm.key === selectedZooOption?.key)) {
      newData.push(selectedZooOption!);
    }

    setZooSuggestions(newData);
  }, [zooQuery.data, selectedZooOption]);

  const { isDownloading, downloadFile } = useFileDownload();

  const handleDownload = async () => {
    if (addressType === "partner" && !selectedPartnerOption) return;
    if (addressType === "zoo" && !selectedZooOption) return;

    const params = new URLSearchParams();
    if (addressType === "partner" && selectedPartnerOption) {
      params.set("partnerId", selectedPartnerOption.key.toString());
    } else if (addressType === "zoo" && selectedZooOption) {
      params.set("zooId", selectedZooOption.key);
    }

    const fileUrl = `/print-reports/economy/envelope-export?${params.toString()}`;
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
              <Label>Typ příjemce</Label>
              <Select
                selectedKey={addressType}
                onSelectionChange={(key) => {
                  setAddressType(key as "partner" | "zoo");
                  // Reset selections when changing type
                  setSelectedPartnerOption(undefined);
                  setSelectedZooOption(undefined);
                  setPartnerSearchQuery("");
                  setZooSearchQuery("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectListBox>
                    <SelectItem id="partner">Partner</SelectItem>
                    <SelectItem id="zoo">Zahrada</SelectItem>
                  </SelectListBox>
                </SelectPopover>
              </Select>
            </div>

            {addressType === "partner" && (
              <div className="space-y-2">
                <Label>Partner</Label>
                <JollyComboBox
                  name="partnerId"
                  items={partnerSuggestions}
                  selectedKey={selectedPartnerOption?.key}
                  onSelectionChange={(key) => {
                    handlePartnerSelect(key as number);
                  }}
                  onInputChange={handlePartnerSearch}
                  allowsEmptyCollection
                  isLoading={partnerQuery.isLoading}>
                  {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
                </JollyComboBox>
              </div>
            )}

            {addressType === "zoo" && (
              <div className="space-y-2">
                <Label>Zahrada</Label>
                <JollyComboBox
                  name="zooId"
                  items={zooSuggestions}
                  selectedKey={selectedZooOption?.key}
                  onSelectionChange={(key) => {
                    handleZooSelect(key as string);
                  }}
                  onInputChange={handleZooSearch}
                  allowsEmptyCollection
                  isLoading={zooQuery.isLoading}>
                  {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
                </JollyComboBox>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant="default"
              size="sm"
              onPress={handleDownload}
              isDisabled={isDownloading || (addressType === "partner" && !selectedPartnerOption) || (addressType === "zoo" && !selectedZooOption)}
            >
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
