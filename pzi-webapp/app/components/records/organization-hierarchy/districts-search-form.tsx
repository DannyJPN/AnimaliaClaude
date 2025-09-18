import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { Form } from "react-router";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxListBox, ComboboxPopover } from "~/components/ui/combobox";
import { FieldGroup } from "~/components/ui/field";
import { fetchJson } from "~/lib/fetch";
import { DistrictItem } from "~/routes/records/organization-hierarchy/districts-search-api";

export function DistrictsSearchForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [districtsQuery, setDistrictsQuery] = useState<string>('');
  const districtsQueryDebounced = useDebounceValue(districtsQuery, 350);

  const districtSuggestionsData = useQuery({
    queryKey: [
      'districts-search-form',
      districtsQueryDebounced
    ],
    queryFn: async ({ signal }): Promise<DistrictItem[]> => {
      if (!districtsQueryDebounced || districtsQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<DistrictItem[]>(
        '/records/org-hierarchy/districts-search-api',
        {
          method: 'POST',
          body: JSON.stringify({
            query: districtsQueryDebounced
          }),
          signal
        }
      );
    }
  });

  const districtSuggestions = useMemo(() => {
    return districtSuggestionsData.data || [];
  }, [districtSuggestionsData.data]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen) {
      if (districtSuggestions.length == 0) {
        e.preventDefault();

        formRef.current?.submit();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (districtsQuery.trim().length < 2) {
      e.preventDefault();
    }
  };

  return (
    <Form
      ref={formRef}
      className="grow"
      action="/records/org-hierarchy/districts-search"
      method="get"
      onSubmit={handleSubmit}
    >
      <fieldset
        className="w-full items-center flex flex-row gap-1 pr-2">

        <FieldGroup className="p-0">
          <Combobox
            aria-label="Hledat rajon"
            name="q"
            className="grow"
            items={districtSuggestions}
            onInputChange={(v) => {
              setDistrictsQuery(v);
            }}
            onOpenChange={setIsOpen}
            allowsCustomValue
            allowsEmptyCollection>
            <ComboboxInput
              placeholder="Hledat rajon"
              onKeyDown={handleKeyDown}
            />
            <ComboboxPopover>
              <ComboboxListBox<(typeof districtSuggestions)[number]>>
                {(result) => (
                  <ComboboxItem
                    key={result.id}
                    id={result.id}
                    href={`/records/org-hierarchy/workplaces/${result.parentId}/districts/${result.id}`}
                    textValue={result.name}>
                    {result.name}
                  </ComboboxItem>
                )}
              </ComboboxListBox>
            </ComboboxPopover>
          </Combobox>
          <Button
            variant="ghost"
            type="submit"
            size="sm">
            <SearchIcon className="size-4" />
          </Button>
        </FieldGroup>
      </fieldset>
    </Form>
  );
}