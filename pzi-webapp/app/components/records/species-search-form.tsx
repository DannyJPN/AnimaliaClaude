import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useState, KeyboardEvent, FormEvent, useRef } from "react";
import { Form, useFetcher, useRouteLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { useDebounceValue } from "../hooks/use-debounce-value";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxListBox, ComboboxPopover } from "../ui/combobox";
import { FieldGroup } from "../ui/field";

export type SpeciesSearchResult = {
  id: number;
  nameLat?: string;
  nameCz?: string;
};

export function SpeciesSearchForm() {
  const loaderData = useRouteLoaderData<{ taxonomySearchBy: { cz: boolean, lat: boolean } }>('app-layout');
  const formRef = useRef<HTMLFormElement>(null);

  const [searchNameLat, setSearchNameLat] = useState(loaderData?.taxonomySearchBy.lat ?? true);
  const [searchNameCz, setSearchNameCz] = useState(loaderData?.taxonomySearchBy.cz ?? false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpeciesSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetcher = useFetcher();

  const debouncedQuery = useDebounceValue(query, 350);

  const doSearch = async () => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("query", query);
      formData.append("searchNameLat", searchNameLat.toString());
      formData.append("searchNameCz", searchNameCz.toString());

      fetcher.submit(formData, {
        action: "/api/taxonomy-species-context-search"
      });

      const response = await fetch("/api/taxonomy-species-context-search", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    }
  };

  useEffect(() => {
    doSearch();
  }, [debouncedQuery, searchNameCz, searchNameLat]);

  const handleCheckboxChange = useCallback((type: "lat" | "cz", checked: boolean) => {
    let cz = searchNameCz;
    let lat = searchNameLat;

    if (type === "lat") {
      lat = checked;
    } else {
      cz = checked;
    }

    if (!cz && !lat) {
      lat = true;
    }

    setSearchNameCz(cz);
    setSearchNameLat(lat);
  }, [searchNameLat, searchNameCz]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen) {
      if (results.length == 0) {
        e.preventDefault();
        
        formRef.current?.submit();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    if (query.trim().length < 2) {
      e.preventDefault();
    }
  };

  return (
    <Form
      ref={formRef}
      className="grow"
      action="/records/species-search"
      method="get"
      onSubmit={handleSubmit}
    >
      <fieldset
        className="w-full items-center flex flex-row gap-1 pr-2">
        <Checkbox
          name="cz"
          className="text-sm"
          isSelected={searchNameCz}
          value="true"
          onChange={(checked) => handleCheckboxChange("cz", checked)}>
          česky
        </Checkbox>
        <Checkbox
          name="lat"
          className="text-sm"
          isSelected={searchNameLat}
          value="true"
          onChange={(checked) => handleCheckboxChange("lat", checked)}>
          latinsky
        </Checkbox>

        <FieldGroup className="p-0">
          <Combobox
            aria-label="Hledat druh"
            name="q"
            className="grow"
            items={results}
            onInputChange={(v) => {
              setQuery(v);
            }}
            onOpenChange={setIsOpen}
            allowsCustomValue
            allowsEmptyCollection>
            <ComboboxInput 
              placeholder="Hledat druh" 
              onKeyDown={handleKeyDown}
            />
            <ComboboxPopover>
              <ComboboxListBox<(typeof results)[number]>>
                {(result) => (
                  <ComboboxItem
                    key={result.id}
                    id={result.id}
                    href={`/records/species/${result.id}/specimens`}
                    textValue={[result.nameLat, result.nameCz].filter(r => r).join(' / ')}
                  >
                    {[result.nameLat, result.nameCz].filter(r => r).join(' / ')}
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
