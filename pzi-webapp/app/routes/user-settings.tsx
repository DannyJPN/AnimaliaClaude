import { useQuery } from "@tanstack/react-query";
import { LoaderIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { SearchField } from "react-aria-components";
import { ActionFunctionArgs, data, Form, LoaderFunctionArgs, redirectDocument, useLoaderData } from "react-router";
import { apiCall } from "~/.server/api-actions";
import { fetchODataList } from "~/.server/odata-api";
import { pziConfig } from "~/.server/pzi-config";
import { commitSession } from "~/.server/session-storage";
import { getTaxonomySearchBy, getUserId, getUserSession, getVisibleTaxonomyStatusesList, requireLoggedInUser } from "~/.server/user-session";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Checkbox, CheckboxGroup } from "~/components/ui/checkbox";
import { FieldGroup, Label } from "~/components/ui/field";
import { SearchFieldClear, SearchFieldInput } from "~/components/ui/searchfield";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request, pziConfig);

  const statuses = await getVisibleTaxonomyStatusesList(request);
  const searchBy = await getTaxonomySearchBy(request);
  const userId = await getUserId(request);

  const taxonomySearchBy: string[] = [];

  if (searchBy.cz) {
    taxonomySearchBy.push('cz');
  }

  if (searchBy.lat) {
    taxonomySearchBy.push('lat');
  }

  const fetchFlaggedSpecies = fetchODataList<{ speciesId: number, species: { nameCz?: string, nameLat?: string } }>(
    [
      `UserFlaggedSpecies?$filter=userId eq ${userId}`,
      "$expand=species($select=id,nameCz,nameLat)",
      "$select=id,speciesId"
    ].join('&')
  );

  const fetchFlaggedDistrict = fetchODataList<{ district: { id: number, name: string } }>(
    [
      `UserFlaggedDistricts?$filter=userId eq ${userId}`,
      "$select=id,districtId",
      "$expand=district($select=id,name)"
    ].join('&')
  );

  const [flaggedSpeciesRes, flaggedDistrictsRes] = await Promise.all([fetchFlaggedSpecies, fetchFlaggedDistrict]);

  const [, flaggedSpeciesData] = flaggedSpeciesRes;
  const [, flaggedDistrictsData] = flaggedDistrictsRes;

  const selectedDistricts: SelectItemType<number, string>[] = (flaggedDistrictsData?.items || [])
    .map((fd) => {
      return { key: fd.district.id, text: fd.district.name };
    });

  const selectedSpecies: SelectItemType<number, string>[] = (flaggedSpeciesData?.items || [])
    .map((fs) => {
      return {
        key: fs.speciesId,
        text: `${fs.species.nameLat} (${fs.species.nameCz || ''})`
      };
    });

  return data({
    visibleTaxonomyStatuses: statuses,
    taxonomySearchBy: taxonomySearchBy,
    selectedDistricts,
    selectedSpecies
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const newVisibleTaxonomyStatuses = formData.getAll("visibleTaxonomyStatuses") as string[];
  const newTaxonomySearchBy = formData.getAll("taxonomySearchBy") as string[];

  const districtIds = formData.getAll("districtIds").map((dId) => parseInt(dId as string));
  const speciesIds = formData.getAll("speciesIds").map((dId) => parseInt(dId as string));

  const session = await getUserSession(request);

  session.set('visibleTaxonomyStatuses', newVisibleTaxonomyStatuses);
  session.set('taxonomySearchBy', { 'cz': newTaxonomySearchBy.includes('cz'), 'lat': newTaxonomySearchBy.includes('lat') });

  await apiCall(
    "api/users/usersettings",
    "POST",
    JSON.stringify({
      userName: session.get('userName'),
      visibleTaxonomyStatuses: newVisibleTaxonomyStatuses,
      taxonomySearchByCz: newTaxonomySearchBy.includes('cz'),
      taxonomySearchByLat: newTaxonomySearchBy.includes('lat'),
      flaggedDistricts: districtIds,
      flaggedSpecies: speciesIds
    }),
    pziConfig
  );

  throw redirectDocument("/user-settings", {
    headers: { "set-cookie": await commitSession(session) }
  });
}

export default function UserSettings() {
  const loaderData = useLoaderData<typeof loader>();

  const [visibleStatuses, setVisibleStatuses] = useState(loaderData.visibleTaxonomyStatuses);
  const [searchBy, setSearchBy] = useState(loaderData.taxonomySearchBy);
  const [selectedSpecies, setSelectedSpecies] = useState(loaderData.selectedSpecies);
  const [selectedDistricts, setSelectedDistricts] = useState(loaderData.selectedDistricts);
  const [dataModified, setDataModified] = useState(false);

  const [districtsQuery, setDistrictsQuery] = useState<string | undefined>(undefined);
  const districtsQueryDebounced = useDebounceValue(districtsQuery, 350);

  const districtSuggestionsData = useQuery({
    queryKey: [
      'usersettings-districtfilter-suggestions',
      districtsQueryDebounced
    ],
    queryFn: async ({signal}): Promise<SelectItemType<number, string>[]> => {
      if (!districtsQueryDebounced || districtsQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-org-levels',
        {
          method: 'POST',
          body: JSON.stringify({
            query: districtsQueryDebounced,
            levels: ['district']
          }),
          signal
        }
      );
    }
  });

  const [speciesQuery, setSpeciesQuery] = useState<string | undefined>(undefined);
  const speciesQueryDebounced = useDebounceValue(speciesQuery, 350);

  const speciesSuggestionsData = useQuery({
    queryKey: [
      'usersettings-speciesfilter-suggestions',
      speciesQueryDebounced
    ],
    queryFn: async ({signal}): Promise<SelectItemType<number, string>[]> => {
      if (!speciesQueryDebounced || speciesQueryDebounced.length < 2) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-species',
        {
          method: 'POST',
          body: JSON.stringify({
            query: speciesQueryDebounced
          }),
          signal
        }
      );
    }
  });

  const selectedDistrictIds = selectedDistricts.map(sd => sd.key.toString());
  const selectedSpeciesIds = selectedSpecies.map(s => s.key.toString());

  const isChanged =
    visibleStatuses.length !== loaderData.visibleTaxonomyStatuses.length
    || loaderData.visibleTaxonomyStatuses.some((v) => !visibleStatuses.includes(v))
    || loaderData.taxonomySearchBy.length !== searchBy.length
    || loaderData.taxonomySearchBy.some((v) => !searchBy.includes(v))
    || dataModified;

  const canSave = visibleStatuses.length > 0
    && searchBy.length > 0
    && isChanged;

  return (
    <Form method="post">

      <div className="p-2 flex-1 md:flex">

        <Card className="w-full md:w-1/3">
          <CardTitle className="text-xl p-2">
            Evidence
          </CardTitle>

          <CardContent className="p-2 pt-0">

            <CheckboxGroup
              value={visibleStatuses}
              onChange={setVisibleStatuses}
              name="visibleTaxonomyStatuses">
              <Label>Zvolte stavy viditelné v Evidenci</Label>
              <Checkbox
                value="Z">Z (v ZOO)</Checkbox>
              <Checkbox
                value="A">A (archiv)</Checkbox>
              <Checkbox
                value="D">D (deponace)</Checkbox>
              <Checkbox
                value="N">N (neevidovaný)</Checkbox>
            </CheckboxGroup>

            <CheckboxGroup
              value={searchBy}
              onChange={setSearchBy}
              name="taxonomySearchBy">
              <Label>Zvolte jazyk(y) pro hledání v Evidenci</Label>
              <Checkbox
                value="cz">Česky</Checkbox>
              <Checkbox
                value="lat">Latinsky</Checkbox>
            </CheckboxGroup>

          </CardContent>
        </Card>

        <Card className="w-full md:w-1/3">
          <CardTitle className="text-xl p-2">
            Druhy
          </CardTitle>

          <CardContent className="p-2 pt-0">
            <CheckboxGroup
              name="speciesIds"
              value={selectedSpeciesIds}>
              <Label>Vybrané</Label>
              {selectedSpecies.map((s) => {
                return (
                  <Checkbox
                    key={s.key}
                    value={s.key.toString()}
                    onChange={() => {
                      setDataModified(true);
                      setSelectedSpecies(
                        selectedSpecies.filter((ss) => ss.key !== s.key)
                      );
                    }}>
                    {s.text}
                  </Checkbox>
                )
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr druhů"
              value={speciesQuery || ''}
              onChange={setSpeciesQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat druhy" />
                <SearchFieldClear>
                  {speciesSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!speciesSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr druhu"
              value={[]}>
              {(speciesSuggestionsData.data || [])
                .filter((s) => !selectedSpeciesIds.includes(s.key.toString()))
                .map((s) => {
                  return (
                    <Checkbox
                      key={s.key}
                      value={s.key.toString()}
                      isSelected={false}
                      onChange={() => {
                        setDataModified(true);
                        setSelectedSpecies([
                          ...selectedSpecies,
                          s
                        ]);
                      }}>
                      {s.text}
                    </Checkbox>
                  );
                })}
            </CheckboxGroup>
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/3">
          <CardTitle className="text-xl p-2">
            Rajony
          </CardTitle>

          <CardContent className="p-2 pt-0">
            <CheckboxGroup
              name="districtIds"
              value={selectedDistrictIds}>
              <Label>Vybrané</Label>
              {selectedDistricts.map((d) => {
                return (
                  <Checkbox
                    key={d.key}
                    value={d.key.toString()}
                    onChange={() => {
                      setDataModified(true);
                      setSelectedDistricts(
                        selectedDistricts.filter((sd) => sd.key !== d.key)
                      );
                    }}>
                    {d.text}
                  </Checkbox>
                )
              })}
            </CheckboxGroup>

            <SearchField
              className="pt-2 pb-2"
              aria-label="Filtr rajonů"
              value={districtsQuery || ''}
              onChange={setDistrictsQuery}>
              <FieldGroup className="w-full">
                <SearchIcon aria-hidden className="size-4 text-muted-foreground" />
                <SearchFieldInput placeholder="Hledat rajony" />
                <SearchFieldClear>
                  {districtSuggestionsData.isLoading && (
                    <LoaderIcon aria-hidden className="size-4" />
                  )}
                  {!districtSuggestionsData.isLoading && (
                    <XIcon aria-hidden className="size-4" />
                  )}
                </SearchFieldClear>
              </FieldGroup>
            </SearchField>

            <CheckboxGroup
              aria-label="Výběr rajonu"
              value={[]}>
              {(districtSuggestionsData.data || [])
                .filter((d) => !selectedDistrictIds.includes(d.key.toString()))
                .map((d) => {
                  return (
                    <Checkbox
                      key={d.key}
                      value={d.key.toString()}
                      isSelected={false}
                      onChange={() => {
                        setDataModified(true);
                        setSelectedDistricts([
                          ...selectedDistricts,
                          d
                        ]);
                      }}>
                      {d.text}
                    </Checkbox>
                  );
                })}
            </CheckboxGroup>
          </CardContent>
        </Card>
      </div>

      <div className="p-2 flex">
        <Card className="w-full">
          <CardFooter className="p-2 pt-2">
            <Button type="submit" isDisabled={!canSave}>
              Uložit
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
}
