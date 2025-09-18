

import { FileDownIcon } from "lucide-react";
import { PrintReport } from "../../models";
import { printReports } from "../../data";
import { SelectItemType } from "~/shared/models";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { fetchJson } from "~/lib/fetch";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectPopover, SelectListBox } from "~/components/ui/select";
import SingleDatePicker from "~/components/ui/singledatepicker";
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

export default function RegionInventoryReport() {
  const { report } = useLoaderData<typeof loader>() as LoaderData;
  const [selectedParentOption, setSelectedParentOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const parentSearchQueryDebounced = useDebounceValue(parentSearchQuery, 500);
  const [date, setDate] = useState<string>('');
  const [vertebrateFilter, setVertebrateFilter] = useState<string>('vertebrate');
  const { isDownloading, downloadFile } = useFileDownload();

  const parentQuery = useQuery({
    queryKey: ['sections-search', parentSearchQueryDebounced],
    enabled: parentSearchQueryDebounced.length >= 2,
    queryFn: async ({ signal }) => {
      if (!parentSearchQueryDebounced || parentSearchQueryDebounced.length < 2) {
        return [];
      }

      const result = await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-org-levels',
        {
          method: 'POST',
          body: JSON.stringify({
            query: parentSearchQueryDebounced,
            levels: ['department']
          }),
          signal: signal
        }
      );

      return result;
    }
  });

  const handleParentSearch = (value: string) => {
    if (value === selectedParentOption?.text) {
      return;
    }
    setParentSearchQuery(value);
  };

  const handleParentSelect = (key: number | undefined) => {
    if (key === undefined) {
      setSelectedParentOption(undefined);
      return;
    }

    const selectedSuggestion = parentSuggestions.find((option) => option.key === key);
    setSelectedParentOption(selectedSuggestion);
  };

  const [parentSuggestions, setParentSuggestions] = useState<SelectItemType<number, string>[]>([]);

  useEffect(() => {
    const newData = parentQuery.data || [];

    if (selectedParentOption && !newData.some((itm) => itm.key === selectedParentOption?.key)) {
      newData.push(selectedParentOption!);
    }

    setParentSuggestions(newData);
  }, [parentQuery.data]);

  const handleDownload = async () => {
    if (!selectedParentOption || !date) return;
    
    const params = {
      orgLevelId: selectedParentOption.key,
      date: date,
      isVertebrate: (vertebrateFilter === 'vertebrate').toString()
    };

    var fileUrl = `/print-reports/economy/section-inventory?${new URLSearchParams(params as any).toString()}`;

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

            <SingleDatePicker
              label="Ke dni"
              value={date}
              onChange={(val) => setDate(val)}
            />
            
            <TextField name="vertebrateFilter" className="col-span-4">
              <Label>Skupina</Label>
              <Select 
                selectedKey={vertebrateFilter}
                defaultSelectedKey="vertebrate"
                onSelectionChange={(value) => setVertebrateFilter(value as string)}
                aria-label="Vertebrate filter"
                isRequired
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopover>
                  <SelectListBox>
                    <SelectItem id="vertebrate">Vertebrates</SelectItem>
                    <SelectItem id="invertebrate">Invertebrates</SelectItem>
                  </SelectListBox>
                </SelectPopover>
              </Select>
              <FieldError />
            </TextField>

            <JollyComboBox
                label="Zvolit úsek"
                name="orgLevelId"
                items={parentSuggestions}
                selectedKey={selectedParentOption?.key}
                onSelectionChange={(key) => {
                  handleParentSelect(key as number);
                }}
                onInputChange={handleParentSearch}
                allowsEmptyCollection
                isLoading={parentQuery.isLoading}>
                {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>
            
          </CardContent>

          <CardFooter className="p-2 pt-0">
            <Button
              type="button"
              aria-label="Generovat Report"
              variant='default'
              size="sm"
              onPress={handleDownload}
              isDisabled={isDownloading || !selectedParentOption || !date}>
              <FileDownIcon className="size-3 mr-2" />
              Generovat Report
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}