import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { action as moveSpecimensAction } from '../operations/move-specimens';

export function MoveSpecimens(props: {
  selectedIds: number[],
  currentSpeciesId: number
  onClose: () => void
}) {
  const submitFetcher = useFetcher<typeof moveSpecimensAction>();

  const [selectedSpeciesOption, setSelectedSpeciesOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [speciesSearchQuery, setSpeciesSearchQuery] = useState("");
  const speciesSearchQueryDebounced = useDebounceValue(speciesSearchQuery, 500);

  const speciesQuery = useQuery({
    queryKey: ['species-search', speciesSearchQueryDebounced, props.currentSpeciesId],
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
            ignoreIds: [props.currentSpeciesId]
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
          action="/records/specimens/operations/move-specimens"
          className="grid grid-cols-1">

          {props.selectedIds.map((id, idx) => {
            return (
              <input key={id} type="hidden" name={`specimenIds[${idx}]`} value={id} />
            );
          })}

          <JollyComboBox
            label="Cílový druh"
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

          <div className="flex gap-2 mt-4">
            <Button
              type="submit"
              size="sm"
              isDisabled={!selectedSpeciesOption || selectedSpeciesOption.key === props.currentSpeciesId || submitFetcher.state !== 'idle'}>
              Přesunout
            </Button>
          </div>
        </submitFetcher.Form>
      </DialogContent>

    </DialogOverlay>
  );
}
