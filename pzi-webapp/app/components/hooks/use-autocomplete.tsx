import { useEffect, useState } from "react";
import { SelectItemType } from "~/shared/models";
import { useDebounceValue } from "./use-debounce-value";

export function useAutocomplete<TKey>(
  autocompleteUrl: string
) {
  const [additionalQueryParams, setAdditionalQueryParams] = useState<Record<string, string>>({});

  const [selectedKey, setSelectedKey] = useState<TKey | undefined>(undefined);
  const [items, setItems] = useState<SelectItemType<TKey, string>[]>([]);
  const [filterText, setFilterText] = useState<string | undefined>(undefined);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading'>('idle');

  const setDefaultValues = (defaultKey: TKey | undefined, defaultItems: SelectItemType<TKey, string>[]) => {
    setSelectedKey(defaultKey);
    setItems(defaultItems);
  };

  const debouncedFilter = useDebounceValue(filterText, 300);

  useEffect(() => {
    setLoadingState('loading');

    if (!debouncedFilter) {
      setLoadingState('idle');
      setItems([]);

      return;
    }

    const search = async () => {
      if (items.some((itm) => itm.text === debouncedFilter)) {
        setLoadingState('idle');
        return;
      }

      const fetchQueryParams = new URLSearchParams(additionalQueryParams);

      fetchQueryParams.set("q", debouncedFilter);

      const fetchUrl = `${autocompleteUrl}?${fetchQueryParams.toString()}`;

      const result = await fetch(fetchUrl);

      const newItems: SelectItemType<TKey, string>[] = await result.json();

      setLoadingState('idle');
      setItems(newItems);
    };

    search();
  }, [debouncedFilter]);

  return {
    selectedKey,
    setSelectedKey,
    items,
    setItems,
    filterText,
    setFilterText,
    setDefaultValues,
    additionalQueryParams,
    setAdditionalQueryParams,
    loadingState
  };
}
