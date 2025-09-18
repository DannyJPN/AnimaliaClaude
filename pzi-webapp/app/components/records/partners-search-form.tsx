import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useState, KeyboardEvent, FormEvent, useRef } from "react";
import { Form, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { useDebounceValue } from "../hooks/use-debounce-value";
import { Combobox, ComboboxInput, ComboboxItem, ComboboxListBox, ComboboxPopover } from "../ui/combobox";
import { FieldGroup } from "../ui/field";

export type PartnerSearchResult = {
  id: number;
  keyword: string;
};

export function PartnersSearchForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PartnerSearchResult[]>([]);
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

      fetcher.submit(formData, {
        action: "/api/partners-context-search"
      });

      const response = await fetch("/api/partners-context-search", {
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
  }, [debouncedQuery]);

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
      action="/lists/partners"
      method="get"
      onSubmit={handleSubmit}
    >
      <FieldGroup className="p-0">
        <Combobox
          aria-label="Hledat partnera"
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
            placeholder="Hledat partnera" 
            onKeyDown={handleKeyDown}
          />
          <ComboboxPopover>
            <ComboboxListBox<(typeof results)[number]>>
              {(result) => (
                <ComboboxItem
                  key={result.id}
                  id={result.id}
                  href={`/lists/partners/${result.id}`}
                  textValue={result.keyword}
                >
                  {result.keyword}
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
    </Form>
  );
}
