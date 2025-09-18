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

type ExemplarListFiltersProps = {
  activeTableColumnFilters: Record<string, string[]>;
  setFiltersDisplayed: (displayed: boolean) => void;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  activeSpeciesFilters: SelectItemType<number, string>[];
  activeDistrictsFilters: SelectItemType<number, string>[];
  activeWorkplaceFilters: SelectItemType<number, string>[];
  activeDepartmentFilters: SelectItemType<number, string>[];
  activeLocationFilters: SelectItemType<number, string>[];
  activeExpositionSetFilters: SelectItemType<number, string>[];
  activeExpositionAreaFilters: SelectItemType<number, string>[];
  activePhylumFilters: SelectItemType<number, string>[];
  activeClassFilters: SelectItemType<number, string>[];
  activeOrderFilters: SelectItemType<number, string>[];
  activeFamilyFilters: SelectItemType<number, string>[];
  activeGenusFilters: SelectItemType<number, string>[];
};

export function ExemplarListFilters({
  activeTableColumnFilters,
  setFiltersDisplayed,
  searchParams,
  setSearchParams,
  activeSpeciesFilters,
  activeDistrictsFilters,
  activeWorkplaceFilters,
  activeDepartmentFilters,
  activeLocationFilters,
  activeExpositionSetFilters,
  activeExpositionAreaFilters,
  activePhylumFilters,
  activeClassFilters,
  activeOrderFilters,
  activeFamilyFilters,
  activeGenusFilters
}: ExemplarListFiltersProps) {
  const { tableColumnFilters, updateTableColumnFilters, setFilterParamsToQuery, clearFilterParamsInQuery } = useTableColumnFiltersManagement({
    activeTableColumnFilters
  });
  
  const [speciesFilters, setSpeciesFilters] = useState<SelectItemType<number, string>[]>(activeSpeciesFilters);
  const [speciesFiltersQuery, setSpeciesFiltersQuery] = useState<string | undefined>(undefined);
  const speciesFiltersQueryDebounced = useDebounceValue(speciesFiltersQuery, 500);

  const [districtFilters, setDistrictFilters] = useState<SelectItemType<number, string>[]>(activeDistrictsFilters);
  const [districtFiltersQuery, setDistrictFiltersQuery] = useState<string | undefined>(undefined);
  const districtFiltersQueryDebounced = useDebounceValue(districtFiltersQuery, 500);
  
  const [workplaceFilters, setWorkplaceFilters] = useState<SelectItemType<number, string>[]>(activeWorkplaceFilters);
  const [workplaceFiltersQuery, setWorkplaceFiltersQuery] = useState<string | undefined>(undefined);
  const workplaceFiltersQueryDebounced = useDebounceValue(workplaceFiltersQuery, 500);
  
  const [departmentFilters, setDepartmentFilters] = useState<SelectItemType<number, string>[]>(activeDepartmentFilters);
  const [departmentFiltersQuery, setDepartmentFiltersQuery] = useState<string | undefined>(undefined);
  const departmentFiltersQueryDebounced = useDebounceValue(departmentFiltersQuery, 500);
  
  const [locationFilters, setLocationFilters] = useState<SelectItemType<number, string>[]>(activeLocationFilters);
  const [locationFiltersQuery, setLocationFiltersQuery] = useState<string | undefined>(undefined);
  const locationFiltersQueryDebounced = useDebounceValue(locationFiltersQuery, 500);
  
  const [expositionSetFilters, setExpositionSetFilters] = useState<SelectItemType<number, string>[]>(activeExpositionSetFilters);
  const [expositionSetFiltersQuery, setExpositionSetFiltersQuery] = useState<string | undefined>(undefined);
  const expositionSetFiltersQueryDebounced = useDebounceValue(expositionSetFiltersQuery, 500);
  
  const [expositionAreaFilters, setExpositionAreaFilters] = useState<SelectItemType<number, string>[]>(activeExpositionAreaFilters);
  const [expositionAreaFiltersQuery, setExpositionAreaFiltersQuery] = useState<string | undefined>(undefined);
  const expositionAreaFiltersQueryDebounced = useDebounceValue(expositionAreaFiltersQuery, 500);
  
  const [phylumFilters, setPhylumFilters] = useState<SelectItemType<number, string>[]>(activePhylumFilters);
  const [phylumFiltersQuery, setPhylumFiltersQuery] = useState<string | undefined>(undefined);
  const phylumFiltersQueryDebounced = useDebounceValue(phylumFiltersQuery, 500);
  
  const [classFilters, setClassFilters] = useState<SelectItemType<number, string>[]>(activeClassFilters);
  const [classFiltersQuery, setClassFiltersQuery] = useState<string | undefined>(undefined);
  const classFiltersQueryDebounced = useDebounceValue(classFiltersQuery, 500);
  
  const [orderFilters, setOrderFilters] = useState<SelectItemType<number, string>[]>(activeOrderFilters);
  const [orderFiltersQuery, setOrderFiltersQuery] = useState<string | undefined>(undefined);
  const orderFiltersQueryDebounced = useDebounceValue(orderFiltersQuery, 500);
  
  const [familyFilters, setFamilyFilters] = useState<SelectItemType<number, string>[]>(activeFamilyFilters);
  const [familyFiltersQuery, setFamilyFiltersQuery] = useState<string | undefined>(undefined);
  const familyFiltersQueryDebounced = useDebounceValue(familyFiltersQuery, 500);
  
  const [genusFilters, setGenusFilters] = useState<SelectItemType<number, string>[]>(activeGenusFilters);
  const [genusFiltersQuery, setGenusFiltersQuery] = useState<string | undefined>(undefined);
  const genusFiltersQueryDebounced = useDebounceValue(genusFiltersQuery, 500);
  
  const speciesFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-speciesfilter-suggestions',
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
            query: speciesFiltersQueryDebounced
          })
        }
      );
    }
  });

  const speciesFiltersSuggestionsShown = !speciesFiltersSuggestionsData.isLoading
    && (speciesFiltersQueryDebounced?.length || 0) >= 2;

  const speciesFiltersSuggestions = speciesFiltersSuggestionsShown && speciesFiltersSuggestionsData.data
    ? speciesFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['speciesId']?.includes(s.key.toString());
    })
    : [];

  const districtFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-districtfilter-suggestions',
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

  const workplaceFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-workplacefilter-suggestions',
      workplaceFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!workplaceFiltersQueryDebounced || workplaceFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-org-levels',
        {
          method: 'POST',
          body: JSON.stringify({
            query: workplaceFiltersQueryDebounced,
            levels: ['workplace']
          })
        }
      );
    }
  });

  const workplaceFiltersSuggestionsShown = !workplaceFiltersSuggestionsData.isLoading
    && (workplaceFiltersQueryDebounced?.length || 0) >= 2;

  const workplaceFiltersSuggestions = workplaceFiltersSuggestionsShown && workplaceFiltersSuggestionsData.data
    ? workplaceFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['workplaceId']?.includes(s.key.toString());
    })
    : [];

  const departmentFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-departmentfilter-suggestions',
      departmentFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!departmentFiltersQueryDebounced || departmentFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-org-levels',
        {
          method: 'POST',
          body: JSON.stringify({
            query: departmentFiltersQueryDebounced,
            levels: ['department']
          })
        }
      );
    }
  });

  const departmentFiltersSuggestionsShown = !departmentFiltersSuggestionsData.isLoading
    && (departmentFiltersQueryDebounced?.length || 0) >= 2;

  const departmentFiltersSuggestions = departmentFiltersSuggestionsShown && departmentFiltersSuggestionsData.data
    ? departmentFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['departmentId']?.includes(s.key.toString());
    })
    : [];
    
  const locationFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-locationfilter-suggestions',
      locationFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!locationFiltersQueryDebounced || locationFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-locations',
        {
          method: 'POST',
          body: JSON.stringify({
            query: locationFiltersQueryDebounced
          })
        }
      );
    }
  });

  const locationFiltersSuggestionsShown = !locationFiltersSuggestionsData.isLoading
    && (locationFiltersQueryDebounced?.length || 0) >= 2;

  const locationFiltersSuggestions = locationFiltersSuggestionsShown && locationFiltersSuggestionsData.data
    ? locationFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['locationId']?.includes(s.key.toString());
    })
    : [];
    
  const expositionSetFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-expositionsetfilter-suggestions',
      expositionSetFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!expositionSetFiltersQueryDebounced || expositionSetFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-exposition-sets',
        {
          method: 'POST',
          body: JSON.stringify({
            query: expositionSetFiltersQueryDebounced
          })
        }
      );
    }
  });

  const expositionSetFiltersSuggestionsShown = !expositionSetFiltersSuggestionsData.isLoading
    && (expositionSetFiltersQueryDebounced?.length || 0) >= 2;

  const expositionSetFiltersSuggestions = expositionSetFiltersSuggestionsShown && expositionSetFiltersSuggestionsData.data
    ? expositionSetFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['expositionSetId']?.includes(s.key.toString());
    })
    : [];
    
  const expositionAreaFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-expositionareafilter-suggestions',
      expositionAreaFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!expositionAreaFiltersQueryDebounced || expositionAreaFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-exposition-areas',
        {
          method: 'POST',
          body: JSON.stringify({
            query: expositionAreaFiltersQueryDebounced
          })
        }
      );
    }
  });

  const expositionAreaFiltersSuggestionsShown = !expositionAreaFiltersSuggestionsData.isLoading
    && (expositionAreaFiltersQueryDebounced?.length || 0) >= 2;

  const expositionAreaFiltersSuggestions = expositionAreaFiltersSuggestionsShown && expositionAreaFiltersSuggestionsData.data
    ? expositionAreaFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['expositionAreaId']?.includes(s.key.toString());
    })
    : [];
    
  const phylumFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-phylumfilter-suggestions',
      phylumFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!phylumFiltersQueryDebounced || phylumFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-phyla',
        {
          method: 'POST',
          body: JSON.stringify({
            query: phylumFiltersQueryDebounced
          })
        }
      );
    }
  });

  const phylumFiltersSuggestionsShown = !phylumFiltersSuggestionsData.isLoading
    && (phylumFiltersQueryDebounced?.length || 0) >= 2;

  const phylumFiltersSuggestions = phylumFiltersSuggestionsShown && phylumFiltersSuggestionsData.data
    ? phylumFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['phylumId']?.includes(s.key.toString());
    })
    : [];
    
  const classFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-classfilter-suggestions',
      classFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!classFiltersQueryDebounced || classFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-classes',
        {
          method: 'POST',
          body: JSON.stringify({
            query: classFiltersQueryDebounced
          })
        }
      );
    }
  });

  const classFiltersSuggestionsShown = !classFiltersSuggestionsData.isLoading
    && (classFiltersQueryDebounced?.length || 0) >= 2;

  const classFiltersSuggestions = classFiltersSuggestionsShown && classFiltersSuggestionsData.data
    ? classFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['classId']?.includes(s.key.toString());
    })
    : [];
    
  const orderFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-orderfilter-suggestions',
      orderFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!orderFiltersQueryDebounced || orderFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-orders',
        {
          method: 'POST',
          body: JSON.stringify({
            query: orderFiltersQueryDebounced
          })
        }
      );
    }
  });

  const orderFiltersSuggestionsShown = !orderFiltersSuggestionsData.isLoading
    && (orderFiltersQueryDebounced?.length || 0) >= 2;

  const orderFiltersSuggestions = orderFiltersSuggestionsShown && orderFiltersSuggestionsData.data
    ? orderFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['orderId']?.includes(s.key.toString());
    })
    : [];
    
  const familyFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-familyfilter-suggestions',
      familyFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!familyFiltersQueryDebounced || familyFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-families',
        {
          method: 'POST',
          body: JSON.stringify({
            query: familyFiltersQueryDebounced
          })
        }
      );
    }
  });

  const familyFiltersSuggestionsShown = !familyFiltersSuggestionsData.isLoading
    && (familyFiltersQueryDebounced?.length || 0) >= 2;

  const familyFiltersSuggestions = familyFiltersSuggestionsShown && familyFiltersSuggestionsData.data
    ? familyFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['familyId']?.includes(s.key.toString());
    })
    : [];
    
  const genusFiltersSuggestionsData = useQuery({
    queryKey: [
      'exemplar-list-genusfilter-suggestions',
      genusFiltersQueryDebounced
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!genusFiltersQueryDebounced || genusFiltersQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-genera',
        {
          method: 'POST',
          body: JSON.stringify({
            query: genusFiltersQueryDebounced
          })
        }
      );
    }
  });

  const genusFiltersSuggestionsShown = !genusFiltersSuggestionsData.isLoading
    && (genusFiltersQueryDebounced?.length || 0) >= 2;

  const genusFiltersSuggestions = genusFiltersSuggestionsShown && genusFiltersSuggestionsData.data
    ? genusFiltersSuggestionsData.data.filter((s) => {
      return !tableColumnFilters['genusId']?.includes(s.key.toString());
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

          <div className="pb-2 mt-4">
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
          
          <div className="mb-4">
            <Label className="mb-2 block">Pracoviště</Label>
            <CheckboxGroup
              aria-label="Vybrané pracoviště"
              value={tableColumnFilters['workplaceId'] || []}>
              {workplaceFilters.map((w) => {
                return (
                  <Checkbox
                    key={w.key}
                    value={w.key.toString()}
                    onChange={() => {
                      setWorkplaceFilters(
                        workplaceFilters.filter((wf) => wf.key !== w.key)
                      );

                      const newWorkplaces = (tableColumnFilters['workplaceId'] || [])
                        .filter((wId) => wId !== w.key.toString());

                      updateTableColumnFilters(
                        'workplaceId',
                        newWorkplaces.length > 0 ? newWorkplaces : undefined
                      );
                    }}>
                    {w.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr pracovišť"
              value={workplaceFiltersQuery || ''}
              onChange={setWorkplaceFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat pracoviště" />
                <SearchFieldClear>
                  {workplaceFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!workplaceFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr pracoviště"
              value={[]}>
              {workplaceFiltersSuggestions.map((w) => {
                return (
                  <Checkbox
                    key={w.key}
                    value={w.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setWorkplaceFilters([...workplaceFilters, w]);
                      updateTableColumnFilters(
                        'workplaceId',
                        [
                          ...(tableColumnFilters['workplaceId'] || []),
                          w.key.toString()
                        ]
                      );
                    }}>
                    {w.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Oddělení</Label>
            <CheckboxGroup
              aria-label="Vybraná oddělení"
              value={tableColumnFilters['departmentId'] || []}>
              {departmentFilters.map((d) => {
                return (
                  <Checkbox
                    key={d.key}
                    value={d.key.toString()}
                    onChange={() => {
                      setDepartmentFilters(
                        departmentFilters.filter((df) => df.key !== d.key)
                      );

                      const newDepartments = (tableColumnFilters['departmentId'] || [])
                        .filter((dId) => dId !== d.key.toString());

                      updateTableColumnFilters(
                        'departmentId',
                        newDepartments.length > 0 ? newDepartments : undefined
                      );
                    }}>
                    {d.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr oddělení"
              value={departmentFiltersQuery || ''}
              onChange={setDepartmentFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat oddělení" />
                <SearchFieldClear>
                  {departmentFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!departmentFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr oddělení"
              value={[]}>
              {departmentFiltersSuggestions.map((d) => {
                return (
                  <Checkbox
                    key={d.key}
                    value={d.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setDepartmentFilters([...departmentFilters, d]);
                      updateTableColumnFilters(
                        'departmentId',
                        [
                          ...(tableColumnFilters['departmentId'] || []),
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
          
          <div className="mb-4">
            <Label className="mb-2 block">Umístění</Label>
            <CheckboxGroup
              aria-label="Vybraná umístění"
              value={tableColumnFilters['locationId'] || []}>
              {locationFilters.map((l) => {
                return (
                  <Checkbox
                    key={l.key}
                    value={l.key.toString()}
                    onChange={() => {
                      setLocationFilters(
                        locationFilters.filter((lf) => lf.key !== l.key)
                      );

                      const newLocations = (tableColumnFilters['locationId'] || [])
                        .filter((lId) => lId !== l.key.toString());

                      updateTableColumnFilters(
                        'locationId',
                        newLocations.length > 0 ? newLocations : undefined
                      );
                    }}>
                    {l.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr umístění"
              value={locationFiltersQuery || ''}
              onChange={setLocationFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat umístění" />
                <SearchFieldClear>
                  {locationFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!locationFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr umístění"
              value={[]}>
              {locationFiltersSuggestions.map((l) => {
                return (
                  <Checkbox
                    key={l.key}
                    value={l.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setLocationFilters([...locationFilters, l]);
                      updateTableColumnFilters(
                        'locationId',
                        [
                          ...(tableColumnFilters['locationId'] || []),
                          l.key.toString()
                        ]
                      );
                    }}>
                    {l.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Expozice</Label>
            <CheckboxGroup
              aria-label="Vybrané expozice"
              value={tableColumnFilters['expositionSetId'] || []}>
              {expositionSetFilters.map((e) => {
                return (
                  <Checkbox
                    key={e.key}
                    value={e.key.toString()}
                    onChange={() => {
                      setExpositionSetFilters(
                        expositionSetFilters.filter((ef) => ef.key !== e.key)
                      );

                      const newExpositionSets = (tableColumnFilters['expositionSetId'] || [])
                        .filter((eId) => eId !== e.key.toString());

                      updateTableColumnFilters(
                        'expositionSetId',
                        newExpositionSets.length > 0 ? newExpositionSets : undefined
                      );
                    }}>
                    {e.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr expozic"
              value={expositionSetFiltersQuery || ''}
              onChange={setExpositionSetFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat expozice" />
                <SearchFieldClear>
                  {expositionSetFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!expositionSetFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr expozice"
              value={[]}>
              {expositionSetFiltersSuggestions.map((e) => {
                return (
                  <Checkbox
                    key={e.key}
                    value={e.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setExpositionSetFilters([...expositionSetFilters, e]);
                      updateTableColumnFilters(
                        'expositionSetId',
                        [
                          ...(tableColumnFilters['expositionSetId'] || []),
                          e.key.toString()
                        ]
                      );
                    }}>
                    {e.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Oblast expozice</Label>
            <CheckboxGroup
              aria-label="Vybrané oblasti expozic"
              value={tableColumnFilters['expositionAreaId'] || []}>
              {expositionAreaFilters.map((a) => {
                return (
                  <Checkbox
                    key={a.key}
                    value={a.key.toString()}
                    onChange={() => {
                      setExpositionAreaFilters(
                        expositionAreaFilters.filter((af) => af.key !== a.key)
                      );

                      const newExpositionAreas = (tableColumnFilters['expositionAreaId'] || [])
                        .filter((aId) => aId !== a.key.toString());

                      updateTableColumnFilters(
                        'expositionAreaId',
                        newExpositionAreas.length > 0 ? newExpositionAreas : undefined
                      );
                    }}>
                    {a.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr oblastí expozic"
              value={expositionAreaFiltersQuery || ''}
              onChange={setExpositionAreaFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat oblasti expozic" />
                <SearchFieldClear>
                  {expositionAreaFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!expositionAreaFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr oblasti expozice"
              value={[]}>
              {expositionAreaFiltersSuggestions.map((a) => {
                return (
                  <Checkbox
                    key={a.key}
                    value={a.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setExpositionAreaFilters([...expositionAreaFilters, a]);
                      updateTableColumnFilters(
                        'expositionAreaId',
                        [
                          ...(tableColumnFilters['expositionAreaId'] || []),
                          a.key.toString()
                        ]
                      );
                    }}>
                    {a.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Kmen</Label>
            <CheckboxGroup
              aria-label="Vybrané kmeny"
              value={tableColumnFilters['phylumId'] || []}>
              {phylumFilters.map((p) => {
                return (
                  <Checkbox
                    key={p.key}
                    value={p.key.toString()}
                    onChange={() => {
                      setPhylumFilters(
                        phylumFilters.filter((pf) => pf.key !== p.key)
                      );

                      const newPhyla = (tableColumnFilters['phylumId'] || [])
                        .filter((pId) => pId !== p.key.toString());

                      updateTableColumnFilters(
                        'phylumId',
                        newPhyla.length > 0 ? newPhyla : undefined
                      );
                    }}>
                    {p.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr kmenů"
              value={phylumFiltersQuery || ''}
              onChange={setPhylumFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat kmeny" />
                <SearchFieldClear>
                  {phylumFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!phylumFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr kmene"
              value={[]}>
              {phylumFiltersSuggestions.map((p) => {
                return (
                  <Checkbox
                    key={p.key}
                    value={p.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setPhylumFilters([...phylumFilters, p]);
                      updateTableColumnFilters(
                        'phylumId',
                        [
                          ...(tableColumnFilters['phylumId'] || []),
                          p.key.toString()
                        ]
                      );
                    }}>
                    {p.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Třída</Label>
            <CheckboxGroup
              aria-label="Vybrané třídy"
              value={tableColumnFilters['classId'] || []}>
              {classFilters.map((c) => {
                return (
                  <Checkbox
                    key={c.key}
                    value={c.key.toString()}
                    onChange={() => {
                      setClassFilters(
                        classFilters.filter((cf) => cf.key !== c.key)
                      );

                      const newClasses = (tableColumnFilters['classId'] || [])
                        .filter((cId) => cId !== c.key.toString());

                      updateTableColumnFilters(
                        'classId',
                        newClasses.length > 0 ? newClasses : undefined
                      );
                    }}>
                    {c.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr tříd"
              value={classFiltersQuery || ''}
              onChange={setClassFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat třídy" />
                <SearchFieldClear>
                  {classFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!classFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr třídy"
              value={[]}>
              {classFiltersSuggestions.map((c) => {
                return (
                  <Checkbox
                    key={c.key}
                    value={c.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setClassFilters([...classFilters, c]);
                      updateTableColumnFilters(
                        'classId',
                        [
                          ...(tableColumnFilters['classId'] || []),
                          c.key.toString()
                        ]
                      );
                    }}>
                    {c.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Řád</Label>
            <CheckboxGroup
              aria-label="Vybrané řády"
              value={tableColumnFilters['orderId'] || []}>
              {orderFilters.map((o) => {
                return (
                  <Checkbox
                    key={o.key}
                    value={o.key.toString()}
                    onChange={() => {
                      setOrderFilters(
                        orderFilters.filter((of) => of.key !== o.key)
                      );

                      const newOrders = (tableColumnFilters['orderId'] || [])
                        .filter((oId) => oId !== o.key.toString());

                      updateTableColumnFilters(
                        'orderId',
                        newOrders.length > 0 ? newOrders : undefined
                      );
                    }}>
                    {o.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr řádů"
              value={orderFiltersQuery || ''}
              onChange={setOrderFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat řády" />
                <SearchFieldClear>
                  {orderFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!orderFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr řádu"
              value={[]}>
              {orderFiltersSuggestions.map((o) => {
                return (
                  <Checkbox
                    key={o.key}
                    value={o.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setOrderFilters([...orderFilters, o]);
                      updateTableColumnFilters(
                        'orderId',
                        [
                          ...(tableColumnFilters['orderId'] || []),
                          o.key.toString()
                        ]
                      );
                    }}>
                    {o.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Čeleď</Label>
            <CheckboxGroup
              aria-label="Vybrané čeledi"
              value={tableColumnFilters['familyId'] || []}>
              {familyFilters.map((f) => {
                return (
                  <Checkbox
                    key={f.key}
                    value={f.key.toString()}
                    onChange={() => {
                      setFamilyFilters(
                        familyFilters.filter((ff) => ff.key !== f.key)
                      );

                      const newFamilies = (tableColumnFilters['familyId'] || [])
                        .filter((fId) => fId !== f.key.toString());

                      updateTableColumnFilters(
                        'familyId',
                        newFamilies.length > 0 ? newFamilies : undefined
                      );
                    }}>
                    {f.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr čeledí"
              value={familyFiltersQuery || ''}
              onChange={setFamilyFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat čeledi" />
                <SearchFieldClear>
                  {familyFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!familyFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr čeledi"
              value={[]}>
              {familyFiltersSuggestions.map((f) => {
                return (
                  <Checkbox
                    key={f.key}
                    value={f.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setFamilyFilters([...familyFilters, f]);
                      updateTableColumnFilters(
                        'familyId',
                        [
                          ...(tableColumnFilters['familyId'] || []),
                          f.key.toString()
                        ]
                      );
                    }}>
                    {f.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>
          
          <div className="mb-4">
            <Label className="mb-2 block">Rod</Label>
            <CheckboxGroup
              aria-label="Vybrané rody"
              value={tableColumnFilters['genusId'] || []}>
              {genusFilters.map((g) => {
                return (
                  <Checkbox
                    key={g.key}
                    value={g.key.toString()}
                    onChange={() => {
                      setGenusFilters(
                        genusFilters.filter((gf) => gf.key !== g.key)
                      );

                      const newGenera = (tableColumnFilters['genusId'] || [])
                        .filter((gId) => gId !== g.key.toString());

                      updateTableColumnFilters(
                        'genusId',
                        newGenera.length > 0 ? newGenera : undefined
                      );
                    }}>
                    {g.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr rodů"
              value={genusFiltersQuery || ''}
              onChange={setGenusFiltersQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat rody" />
                <SearchFieldClear>
                  {genusFiltersSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!genusFiltersSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr rodu"
              value={[]}>
              {genusFiltersSuggestions.map((g) => {
                return (
                  <Checkbox
                    key={g.key}
                    value={g.key.toString()}
                    isSelected={false}
                    onChange={() => {
                      setGenusFilters([...genusFilters, g]);
                      updateTableColumnFilters(
                        'genusId',
                        [
                          ...(tableColumnFilters['genusId'] || []),
                          g.key.toString()
                        ]
                      );
                    }}>
                    {g.text}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          </div>

          <TextField
            className="w-full mb-4"
            name="zims"
            value={tableColumnFilters['zims']?.at(0) || ''}
            onChange={(value) => {
              updateTableColumnFilters('zims', value ? [value] : undefined);
            }}>
            <Label>ZIMS</Label>
            <Input type="text" placeholder="Hledat ZIMS" />
          </TextField>

          <TextField
            className="w-full mb-4"
            name="marking"
            value={tableColumnFilters['marking']?.at(0) || ''}
            onChange={(value) => {
              updateTableColumnFilters('marking', value ? [value] : undefined);
            }}>
            <Label>Značení</Label>
            <Input type="text" placeholder="Hledat značení" />
          </TextField>
          
          <div className="flex gap-2 mt-4">
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
                  setDistrictFilters([]);
                  setWorkplaceFilters([]);
                  setDepartmentFilters([]);
                  setLocationFilters([]);
                  setExpositionSetFilters([]);
                  setExpositionAreaFilters([]);
                  setPhylumFilters([]);
                  setClassFilters([]);
                  setOrderFilters([]);
                  setFamilyFilters([]);
                  setGenusFilters([]);
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
