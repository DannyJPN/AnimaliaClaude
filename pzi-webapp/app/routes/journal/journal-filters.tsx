import { useQuery } from "@tanstack/react-query";
import { LoaderIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Form, SetURLSearchParams } from "react-router";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { useTableColumnFiltersManagement } from "~/components/hooks/use-table-column-filters-management";
import { Button } from "~/components/ui/button";
import { Checkbox, CheckboxGroup } from "~/components/ui/checkbox";
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { FieldGroup, Label } from "~/components/ui/field";
import { SearchField, SearchFieldClear, SearchFieldInput } from "~/components/ui/searchfield";
import { Input, TextField } from "~/components/ui/textfield";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { JOURNAL_ENTRY_TYPES, JOURNAL_STATUSES } from "./models";

type JournalFiltersProps = {
  activeTableColumnFilters: Record<string, string[]>,
  setFiltersDisplayed: (displayed: boolean) => void,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
  activeSpeciesFilters: SelectItemType<number, string>[],
  activeDistrictsFilters: SelectItemType<number, string>[],
};

export function JournalFilters({
  activeTableColumnFilters,
  setFiltersDisplayed,
  searchParams,
  setSearchParams,
  activeSpeciesFilters,
  activeDistrictsFilters
}: JournalFiltersProps) {
  const { tableColumnFilters, updateTableColumnFilters, setFilterParamsToQuery, clearFilterParamsInQuery } = useTableColumnFiltersManagement({
    activeTableColumnFilters
  });

  const selectedEntryTypes = (tableColumnFilters['entryType'] || []).reduce((acc, s) => {
    acc[s] = true;

    return acc;
  }, {} as Record<string, boolean>);

  const entryTypeOptions = JOURNAL_ENTRY_TYPES.map((s) => {
    return {
      key: s.key,
      text: s.text,
      selected: !!selectedEntryTypes[s.key]
    };
  });

  const selectedStatuses = (tableColumnFilters['status'] || []).reduce((acc, s) => {
    acc[s] = true;

    return acc;
  }, {} as Record<string, boolean>);

  const statusOptions = JOURNAL_STATUSES.map((s) => {
    return {
      key: s.key,
      text: s.text,
      selected: !!selectedStatuses[s.key]
    };
  });

  const [speciesFilters, setSpeciesFilters] = useState<SelectItemType<number, string>[]>(activeSpeciesFilters);
  const [speciesFiltersQuery, setSpeciesFiltersQuery] = useState<string | undefined>(undefined);
  const speciesFiltersQueryDebounced = useDebounceValue(speciesFiltersQuery, 500);

  const [districtFilters, setDistrictFilters] = useState<SelectItemType<number, string>[]>(activeDistrictsFilters);
  const [districtFiltersQuery, setDistrictFiltersQuery] = useState<string | undefined>(undefined);
  const districtFiltersQueryDebounced = useDebounceValue(districtFiltersQuery, 500);

  const speciesFiltersSuggestionsData = useQuery({
    queryKey: [
      'journal-list-speciesfilter-suggestions',
      speciesFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!speciesFiltersQueryDebounced || speciesFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-species',
        {
          method: 'POST',
          body: JSON.stringify({
            query: speciesFiltersQueryDebounced,
            ignoreNotInZoo: true
          })
        }
      );
    }
  });

  const speciesFiltersSuggestionsShown = !speciesFiltersSuggestionsData.isLoading
    && (speciesFiltersQueryDebounced?.length || 0) >= 2;

  const speciesFiltersSuggestions = speciesFiltersSuggestionsShown && speciesFiltersSuggestionsData.data
    ? speciesFiltersSuggestionsData.data.filter((s) => {
      return !speciesFilters.some((sf) => sf.key === s.key);
    })
    : [];

  const districtFiltersSuggestionsData = useQuery({
    queryKey: [
      'journal-list-districtfilter-suggestions',
      districtFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!districtFiltersQueryDebounced || districtFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-org-levels',
        {
          method: 'POST',
          body: JSON.stringify({
            query: districtFiltersQueryDebounced,
            levels: ['district']
          })
        }
      );
    }
  });

  const districtFiltersSuggestionsShown = !districtFiltersSuggestionsData.isLoading
    && (districtFiltersQueryDebounced?.length || 0) >= 2;

  const districtFiltersSuggestions = districtFiltersSuggestionsShown && districtFiltersSuggestionsData.data
    ? districtFiltersSuggestionsData.data.filter((d) => {
      return !tableColumnFilters['districtId']?.includes(d.key.toString());
    })
    : [];

  return (
    <DialogOverlay
      isOpen={true}
      onOpenChange={() => {
        setFiltersDisplayed(false);
      }}>

      <DialogContent
        side="left" className="w-full sm:max-w-[375px] overflow-scroll">

        <Form
          className="grid grid-cols-1"
          onSubmit={(evt) => {
            evt.preventDefault();

            setFilterParamsToQuery(searchParams, (newSearchParams) => {
              setSearchParams(newSearchParams);
              setFiltersDisplayed(false);
            });
          }}>

<CheckboxGroup
            className="pb-2"
            name="entryType"
            value={tableColumnFilters['entryType'] || []}>
            <Label>Status</Label>
            {entryTypeOptions.map((so) => {
              return (
                <Checkbox
                  key={so.key}
                  value={so.key}
                  onChange={() => {
                    let newOptions = [];

                    if (so.selected) {
                      newOptions = (tableColumnFilters['entryType'] || [])
                        .filter((selectedOption) => selectedOption !== so.key);
                    } else {
                      newOptions = [
                        ...(tableColumnFilters['entryType'] || []),
                        so.key
                      ];
                    };

                    updateTableColumnFilters(
                      'entryType',
                      newOptions.length > 0 ? newOptions : undefined
                    );
                  }}>
                  {so.text}
                </Checkbox>
              );
            })}
          </CheckboxGroup>

          <CheckboxGroup
            className="pb-2"
            name="status"
            value={tableColumnFilters['status'] || []}>
            <Label>Status</Label>
            {statusOptions.map((so) => {
              return (
                <Checkbox
                  key={so.key}
                  value={so.key}
                  onChange={() => {
                    let newStatuses = [];

                    if (so.selected) {
                      newStatuses = (tableColumnFilters['status'] || [])
                        .filter((selectedStatus) => selectedStatus !== so.key);
                    } else {
                      newStatuses = [
                        ...(tableColumnFilters['status'] || []),
                        so.key
                      ];
                    };

                    updateTableColumnFilters(
                      'status',
                      newStatuses.length > 0 ? newStatuses : undefined
                    );
                  }}>
                  {so.text}
                </Checkbox>
              );
            })}
          </CheckboxGroup>

          <TextField
            className="w-full"
            name="author"
            value={tableColumnFilters['author']?.at(0) || ''}
            onChange={(value) => {
              updateTableColumnFilters('author', value ? [value] : undefined);
            }}>
            <Label>Autor</Label>
            <Input type="text" />
          </TextField>

          <CheckboxGroup
            name="speciesId"
            value={tableColumnFilters['speciesId'] || []}>
            <Label>Druhy</Label>
            {speciesFilters.map((s) => {
              return (
                <Checkbox
                  key={s.key}
                  value={s.key.toString()}
                  onChange={() => {
                    setSpeciesFilters(
                      speciesFilters.filter((sf) => sf.key !== s.key)
                    );

                    const newSpeciesIdFilters = (tableColumnFilters['speciesId'] || [])
                      .filter((sid) => sid !== s.key.toString());

                    updateTableColumnFilters(
                      'speciesId',
                      newSpeciesIdFilters.length > 0 ? newSpeciesIdFilters : undefined
                    );
                  }}>
                  {s.text}
                </Checkbox>
              );
            })}
          </CheckboxGroup>

          <SearchField
            className="pt-2 pb-2"
            aria-label="Filtr druhů"
            value={speciesFiltersQuery || ''}
            onChange={setSpeciesFiltersQuery}>
            <FieldGroup className="w-full">
              <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
              <SearchFieldInput placeholder="Hledat druhy" />
              <SearchFieldClear>
                {speciesFiltersSuggestionsData.isLoading && (
                  <LoaderIcon aria-hidden className="size-4" />
                )}
                {!speciesFiltersSuggestionsData.isLoading && (
                  <XIcon aria-hidden className="size-4" />
                )}
              </SearchFieldClear>
            </FieldGroup>
          </SearchField>

          <CheckboxGroup
            aria-label="Vyběr druhů"
            value={[]}>
            {speciesFiltersSuggestions.map((s) => {
              return (
                <Checkbox
                  key={s.key}
                  value={s.key.toString()}
                  isSelected={false}
                  onChange={() => {
                    setSpeciesFilters([...speciesFilters, s]);
                    updateTableColumnFilters(
                      'speciesId',
                      [
                        ...(tableColumnFilters['speciesId'] || []),
                        s.key.toString()
                      ]
                    );
                  }}>
                  {s.text}
                </Checkbox>
              );
            })}
          </CheckboxGroup>

          <div className="pb-2">
            <Label>Rajony</Label>
            <CheckboxGroup
              name="districtId"
              value={tableColumnFilters['districtId'] || []}>
              {districtFilters.map((d) => {
                return (
                  <Checkbox
                    key={d.key}
                    value={d.key.toString()}
                    onChange={() => {
                      setDistrictFilters(
                        districtFilters.filter((df) => df.key !== d.key)
                      );

                      const newDistricts = (tableColumnFilters['districtId'] || [])
                        .filter((dId) => dId !== d.key.toString());

                      updateTableColumnFilters(
                        'districtId',
                        newDistricts.length > 0 ? newDistricts : undefined
                      );
                    }}>
                    {d.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr rajonů"
              value={districtFiltersQuery || ''}
              onChange={setDistrictFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat rajony" />
                <SearchFieldClear>
                  {districtFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!districtFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr rajonu"
              value={[]}>
              {districtFiltersSuggestions.map((d) => {
                return (
                  <Checkbox
                    key={d.key}
                    value={d.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setDistrictFilters([...districtFilters, d]);
                      updateTableColumnFilters(
                        'districtId',
                        [
                          ...(tableColumnFilters['districtId'] || []),
                          d.key.toString()
                        ]
                      );
                    }}>
                    {d.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm">
              Filtrovat
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onPressChange={() => {
                clearFilterParamsInQuery(searchParams, (newSearchParams) => {
                  setSearchParams(newSearchParams);
                  setSpeciesFilters([]);
                  setFiltersDisplayed(false);
                });
              }}>
              Zrušit filtry
            </Button>
          </div>
        </Form>
      </DialogContent>
    </DialogOverlay>
  );
}
