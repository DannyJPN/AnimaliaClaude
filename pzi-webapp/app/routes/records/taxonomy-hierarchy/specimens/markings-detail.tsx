import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { useAutocomplete } from "~/components/hooks/use-autocomplete";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { parseCheckboxBoolean, parseOptionalNumber } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { SpecimenHeaderDetail, SpecimenNavigation } from "./controls";
import { loader } from "./markings-list";
import { TaxonomySpecimenMarkingItem, TaxonomySpecimenMarkingItemWithRelations } from "./models";

const sides: SelectItemType<string, string>[] = [
  { key: 'L', text: 'L' },
  { key: 'N', text: 'N' },
  { key: 'P', text: 'P' }
];

const placements: SelectItemType<string, string>[] = [
  { key: 'U', text: 'U' },
  { key: 'D', text: 'D' }
];

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpecimenMarkingItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpecimenMarkingItem> = {
        ...formDataEntries,
        specimenId: parseOptionalNumber(formData, 'specimenId'),
        isValid: parseCheckboxBoolean(formData, 'isValid')
      } as Partial<TaxonomySpecimenMarkingItem>;

      return postData;
    },
    'api/markings',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

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

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenMarkingItemWithRelations | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  const contractAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-contract'
  );


  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/specimens/${outletContext.specimenId}/markings${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/specimens/${outletContext.specimenId}/markings/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (itemId !== Number.MIN_SAFE_INTEGER) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si) => si.id === itemId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        specimenId: outletContext.specimenId,
        isValid: true
      } as TaxonomySpecimenMarkingItemWithRelations);
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
            <SpecimenHeaderDetail specimen={outletContext.specimenInfo!} />
          </fieldset>

          <div className="flex">
            <SpecimenNavigation
              speciesId={outletContext.specimenInfo!.speciesId}
              specimenId={outletContext.specimenId}
              activePage="markings" />

            <div className="flex gap-1 p-2">
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

            <JollyComboBox
              name="markingTypeCode"
              label="Typ"
              defaultItems={outletContext.markingTypes}
              defaultSelectedKey={selectedItem?.markingTypeCode}
              allowsEmptyCollection
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <ZooFormatDateField
              name="markingDate"
              label="Datum"
              defaultValue={selectedItem.markingDate || ""}
              errorMessage={fetcher.data?.validationErrors?.markingDate?.at(0)}>
            </ZooFormatDateField>

            <TextField
              name="ringNumber"
              defaultValue={selectedItem.ringNumber}
              className="col-span-4">
              <Label>Značení</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="color"
              label="Barva"
              defaultItems={outletContext.colorTypes}
              defaultSelectedKey={selectedItem?.color}
              allowsEmptyCollection
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="side"
              label="Strana"
              defaultItems={sides}
              defaultSelectedKey={selectedItem?.side}
              allowsEmptyCollection
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="locatedOn"
              label="Umístění"
              defaultItems={placements}
              defaultSelectedKey={selectedItem?.locatedOn}
              allowsEmptyCollection
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <div>
              <Label>Platný</Label>
              <div className="h-8 flex items-center">
                <Checkbox
                  name="isValid"
                  defaultSelected={selectedItem.isValid}
                  isDisabled={editDisabled}>
                </Checkbox>
              </div>
            </div>

            <TextField
              name="note"
              defaultValue={selectedItem.note || ""}
              className="col-span-4">
              <Label>Poznámka</Label>
              <label>{selectedItem.note}</label>
              <TextArea />
              <FieldError />
            </TextField>

            <input type='hidden' name='id' defaultValue={selectedItem.id} />
            <input type='hidden' name='specimenId' defaultValue={outletContext.specimenId} />
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
                </>
              )}

              <Button
                variant='secondary'
                type="button"
                size='sm'
                onPressChange={() => {
                  if (mode === 'edit') {
                    setChangingValues(false);
                  } else {
                    navigate(`/records/specimens/${outletContext.specimenId}/markings${location.search}`);
                  }
                }}>
                Zrušit
              </Button>
            </div>
          )}

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/records/specimens/${outletContext.specimenId}/markings/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
