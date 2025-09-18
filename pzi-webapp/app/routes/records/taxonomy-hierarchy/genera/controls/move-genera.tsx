import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { action as moveGeneraAction } from '../operations/move-genera';

export function MoveGenera(props: {
  selectedIds: number[],
  currentParentId: number
  onClose: () => void
}) {
  const submitFetcher = useFetcher<typeof moveGeneraAction>();

  const [selectedParentOption, setSelectedParentOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const parentSearchQueryDebounced = useDebounceValue(parentSearchQuery, 500);

  const parentQuery = useQuery({
    queryKey: ['families-search', parentSearchQueryDebounced, props.currentParentId],
    enabled: parentSearchQueryDebounced.length >= 2,
    queryFn: async ({ signal }) => {
      if (!parentSearchQueryDebounced || parentSearchQueryDebounced.length < 2) {
        return [];
      }

      const result = await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-families',
        {
          method: 'POST',
          body: JSON.stringify({
            query: parentSearchQueryDebounced,
            ignoreIds: [props.currentParentId, ...props.selectedIds]
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
      setSelectedParentOption(undefined)
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

  useEffect(() => {
    if (submitFetcher.data?.success) {
      props.onClose();
    }
  }, [submitFetcher.state, submitFetcher.data]);

  return (
    <DialogOverlay
      isOpen={true}
      onOpenChange={props.onClose}>

      <DialogContent
        side="right" className="w-full sm:max-w-[75%] overflow-scroll">
        <submitFetcher.Form
          method="post"
          action="/records/genera/operations/move-genera"
          className="grid grid-cols-1">

          {props.selectedIds.map((id, idx) => {
            return (
              <input key={id} type="hidden" name={`generaIds[${idx}]`} value={id} />
            );
          })}

          <JollyComboBox
            label="Cílová čeleď"
            name="parentId"
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

          <div className="flex gap-2 mt-4">
            <Button
              type="submit"
              size="sm"
              isDisabled={!selectedParentOption || selectedParentOption.key === props.currentParentId || submitFetcher.state !== 'idle'}>
              Přesunout
            </Button>
          </div>
        </submitFetcher.Form>
      </DialogContent>

    </DialogOverlay>
  );
}
