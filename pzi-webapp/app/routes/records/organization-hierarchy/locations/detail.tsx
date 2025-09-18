import { useQuery } from "@tanstack/react-query";
import { HeartIcon, LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { loader } from "./list";
import { Location } from "./models";
import { ItemListNavigation } from "~/components/common/item-list-navigation";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<Location>(
    request,
    (formData) => {
      const values = Object.fromEntries(formData);

      const parseNum = (key: string): number | undefined => {
        const s = values[key]?.toString().trim();
        return s !== "" ? Number(s) : undefined;
      };

      const postData: Partial<Location> = {
        id: parseNum("id"),
        organizationLevelId: Number(values["organizationLevelId"]),
        expositionSetId: Number(values["expositionSetId"]),
        name: values["name"]?.toString(),
        objectNumber: parseNum("objectNumber"),
        roomNumber: parseNum("roomNumber"),
        availableForVisitors:
          values["availableForVisitors"] === "on" ||
          values["availableForVisitors"] === "true",
        locationTypeCode: parseNum("locationTypeCode"),
        areaM2: parseNum("areaM2"),
        capacityM3: parseNum("capacityM3"),
        note: values["note"]?.toString(),
      };

      return postData;
    },
    "api/Locations",
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

const locationTypeOptions: SelectItemType<number, string>[] = [
  { key: 0, text: "0" },
  { key: 1, text: "1" },
  { key: 2, text: "2" },
];

export default function Detail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const outletContext = useOutletContext<ContextType>();

  const [formKey, setFormKey] = useState(Date.now().toString());
  const fetcher = useFetcher<typeof action>({ key: formKey });

  const actionParam = params.actionParam;

  const mode = actionParam === 'new'
    ? 'insert'
    : 'edit';

  const itemId = mode === 'edit'
    ? parseInt(actionParam!)
    : Number.MIN_SAFE_INTEGER;

  const [selectedItem, setSelectedItem] = useState<Location | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  const [selectedExpositionSetOption, setSelectedExpositionSetOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [expositionSetOptions, setExpositionSetOptions] = useState<SelectItemType<number, string>[]>([]);
  const [expositionSetsQuery, setExpositionSetsQuery] = useState<string | undefined>(undefined);
  const expositionSetsQueryDebounced = useDebounceValue(expositionSetsQuery, 250);

  const expositionSetsOptionsData = useQuery({
    queryKey: [
      'lists-locations-expositionsets-options',
      expositionSetsQueryDebounced,
      selectedExpositionSetOption
    ],
    queryFn: async (): Promise<SelectItemType<number, string>[]> => {
      if (!expositionSetsQueryDebounced || expositionSetsQueryDebounced.length < 1) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        '/autocompletes/autocomplete-exposition-sets',
        {
          method: 'POST',
          body: JSON.stringify({
            query: expositionSetsQueryDebounced
          })
        }
      );
    }
  });

  useEffect(() => {
    const basicOptions = selectedExpositionSetOption
      ? [selectedExpositionSetOption]
      : [];

    const queryOptions = (expositionSetsOptionsData.data || [])
      .filter((exps) => exps.key !== selectedExpositionSetOption?.key);

    setExpositionSetOptions([...basicOptions, ...queryOptions]);
  }, [expositionSetsOptionsData.data, selectedExpositionSetOption]);

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/org-hierarchy/districts/${outletContext.districtId}/locations${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/org-hierarchy/districts/${outletContext.districtId}/locations/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }

    setFormKey(Date.now().toString());

  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    const foundItem = outletContext.items.find((si) => si.id === itemId);

    if (mode === "edit" && !foundItem) {
      return;
    }

    if (itemId !== Number.MIN_SAFE_INTEGER && foundItem) {
      setChangingValues(false);

      const expositionSetOption = foundItem.expositionSet
        ? { key: foundItem.expositionSet.id, text: foundItem.expositionSet.name }
        : undefined;

      setSelectedItem(foundItem);
      setSelectedExpositionSetOption(expositionSetOption);
      setExpositionSetOptions(expositionSetOption ? [expositionSetOption] : []);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        organizationLevelId: outletContext.districtId,
      } as Location);
      setSelectedExpositionSetOption(undefined);
      setExpositionSetOptions([]);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={`${formKey}-${changingValues}`}
      className="rounded-none border bg-card text-card-foreground shadow-none">
      <fetcher.Form method="POST" className="flex flex-col h-full">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>
          <fieldset
            disabled={editDisabled}
            className="flex flex-wrap gap-2 p-2 bg-secondary">

            <JollyComboBox
              name="organizationLevelId"
              label="Rajony"
              defaultItems={[{
                key: outletContext.districtId,
                text: outletContext.districtInfo?.name ?? 'Neznámý rajon'
              }]}
              defaultSelectedKey={outletContext.districtId}
              allowsEmptyCollection={false}
              isLoading={false}
              isDisabled
              className="grow"
            >
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>


            <JollyComboBox
              name="expositionSetId"
              label="Expoziční celek"
              items={expositionSetOptions}
              defaultSelectedKey={selectedItem?.expositionSetId}
              isLoading={expositionSetsOptionsData.isLoading}
              isDisabled={mode === 'edit'}
              onInputChange={(value) => {
                setExpositionSetsQuery(value);
              }}
              onSelectionChange={(key) => {
                const selectedOption = expositionSetOptions.find((exps) => exps.key === key);
                setSelectedExpositionSetOption(selectedOption);
              }}
              className="grow"
            >
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

          </fieldset>

          <div className="flex">
            <div className="grow"></div>
            <div className="flex gap-1 p-2">
              <Button
                variant="outline"
                size="sm"
                onPressChange={() => { }}>
                <HeartIcon className="size-3" />
              </Button>

              <Button variant='outline'
                size="sm"
                isDisabled={changingValues || !outletContext.hasEditPermission}
                onPressChange={() => {
                  setChangingValues(true);
                }}>
                <LockIcon className="size-3" />
              </Button>
            </div>
          </div>

          <fieldset
            className="grid grid-cols-4 gap-2 p-2"
            disabled={editDisabled}>

            <TextField
              name="name"
              defaultValue={selectedItem.name}
              className="col-span-2"
            >
              <Label>Název</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="objectNumber"
              defaultValue={selectedItem.objectNumber?.toString()}
              className="col-span-1"
            >
              <Label>Číslo objektu</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="roomNumber"
              defaultValue={selectedItem.roomNumber?.toString()}
              className="col-span-1"
            >
              <Label>Číslo místnosti</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <div className="col-span-full" />

            <div className="col-span-1 ">
              <JollyComboBox
                name="locationTypeCode"
                label="Typ umístění"
                defaultItems={locationTypeOptions}
                defaultSelectedKey={selectedItem.locationTypeCode}
                allowsEmptyCollection={false}
                isLoading={false}
              >
                {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
              </JollyComboBox>
              <FieldError />
            </div>

            <TextField
              name="areaM2"
              defaultValue={selectedItem.areaM2?.toString()}
              className="col-span-1"
            >
              <Label>Plocha (m²)</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="capacityM3"
              defaultValue={selectedItem.capacityM3?.toString()}
              className="col-span-1"
            >
              <Label>Kapacita (m³)</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <div>
              <Label>Dostupné pro návštěvníky</Label>
              <div className="h-8 flex items-center justify-center">
                <Checkbox
                  aria-label="availableForVisitors"
                  name="availableForVisitors"
                  defaultSelected={
                    selectedItem.availableForVisitors
                  }
                />
              </div>
            </div>

            <div className="col-span-full" />

            <TextField
              name="note"
              defaultValue={selectedItem.note}
              className="col-span-full">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <input type='hidden' name='id' defaultValue={selectedItem.id} />
          </fieldset>

          {changingValues && (
            <div className="p-2 flex gap-2">
              <Button
                variant='default'
                type="submit"
                name="formAction"
                value={mode}
                size='sm'
                isDisabled={fetcher.state !== 'idle'}>
                Uložit
              </Button>

              {mode === 'edit' && (
                <>
                  <Button
                    variant='destructive'
                    isDisabled={fetcher.state !== 'idle'}
                    size='sm'
                    type="submit"
                    name="formAction"
                    value="delete">
                    Smazat
                  </Button>

                  <Button variant='secondary'
                    size='sm'
                    isDisabled={fetcher.state !== 'idle'}
                    onPressChange={() => {
                      setChangingValues(false);
                    }}>
                    Zrušit
                  </Button>
                </>
              )}
            </div>
          )}

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/records/org-hierarchy/districts/${outletContext.districtId}/locations/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card >
  );
}
