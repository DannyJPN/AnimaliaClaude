import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { Form } from "react-router";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxListBox, ComboboxPopover } from "~/components/ui/combobox";
import { FieldGroup } from "~/components/ui/field";
import { fetchJson } from "~/lib/fetch";
import { LocationItem } from "~/routes/records/exposition-hierarchy/locations-search-api";

export function LocationsSearchForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [locationsQuery, setLocationsQuery] = useState<string>('');
  const locationsQueryDebounced = useDebounceValue(locationsQuery, 350);

  const locationSuggestionsData = useQuery({
    queryKey: [
      'locations-search-form',
      locationsQueryDebounced
    ],
    queryFn: async ({ signal }): Promise<LocationItem[]> => {
      if (!locationsQueryDebounced || locationsQueryDebounced.length < 1) {
        return [];
      }

      return await fetchJson<LocationItem[]>(
        '/records/exposition-hierarchy/locations-search-api',
        {
          method: 'POST',
          body: JSON.stringify({
            query: locationsQueryDebounced
          }),
          signal
        }
      );
    }
  });

  const locationSuggestions = useMemo(() => {
    return locationSuggestionsData.data || [];
  }, [locationSuggestionsData.data]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen) {
      if (locationSuggestions.length == 0) {
        e.preventDefault();

        formRef.current?.submit();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (locationsQuery.trim().length < 1) {
      e.preventDefault();
    }
  };

  return (
    <Form
      ref={formRef}
      className="grow"
      action="/records/exposition-hierarchy/locations-search"
      method="get"
      onSubmit={handleSubmit}
    >
      <fieldset
        className="w-full items-center flex flex-row gap-1 pr-2">

        <FieldGroup className="p-0">
          <Combobox
            aria-label="Hledat lokaci"
            name="q"
            className="grow"
            items={locationSuggestions}
            onInputChange={(v) => {
              setLocationsQuery(v);
            }}
            onOpenChange={setIsOpen}
            allowsCustomValue
            allowsEmptyCollection>
            <ComboboxInput
              placeholder="Hledat lokaci"
              onKeyDown={handleKeyDown}
            />
            <ComboboxPopover>
              <ComboboxListBox<(typeof locationSuggestions)[number]>>
                {(result) => (
                  <ComboboxItem
                    key={result.id}
                    id={result.id}
                    href={`/records/exposition-hierarchy/sets/${result.expositionSetId}/locations/${result.id}`}
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