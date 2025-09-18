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
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { TextArea, TextField } from "~/components/ui/textfield";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { parseOptionalNumber } from "~/lib/utils";
import { SpecimenHeaderDetail, SpecimenNavigation } from "./controls";
import { TaxonomySpecimenRecordItem, TaxonomySpecimenRecordItemWithRelations } from "./models";
import { loader } from "./records-list";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpecimenRecordItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpecimenRecordItem> = {
        ...formDataEntries,
        specimenId: parseOptionalNumber(formData, 'specimenId'),
        partnerId: parseOptionalNumber(formData, 'partnerId'),
      } as Partial<TaxonomySpecimenRecordItem>;

      return postData;
    },
    'api/recordspecimens',
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

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenRecordItemWithRelations | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  const partnerSpeciesAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-species'
  );

  const partnerAutocomplete = useAutocomplete<number>(
    '/records/specimens/autocomplete-specimen'
  );

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/specimens/${outletContext.specimenId}/records${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/specimens/${outletContext.specimenId}/records/${fetcher.data.changeResult?.id}${location.search}`);
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
        partner_species_id: outletContext.specimenInfo?.speciesId,
        partner_species_name: outletContext.specimenInfo?.species?.nameLat,
        date: ''
      } as TaxonomySpecimenRecordItemWithRelations);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  useEffect(() => {
    partnerAutocomplete.setDefaultValues(
      selectedItem?.partnerId,
      selectedItem?.partnerId
        ? [{ key: selectedItem.partnerId!, text: selectedItem.partner_displayName! }]
        : []
    );

    partnerAutocomplete.setAdditionalQueryParams({
      'speciesId': selectedItem?.partner_species_id?.toString()!
    });

    partnerSpeciesAutocomplete.setDefaultValues(
      selectedItem?.partner_species_id,
      selectedItem?.partner_species_id
        ? [{ key: selectedItem.partner_species_id!, text: selectedItem.partner_species_name! }]
        : []
    );
  }, [selectedItem]);

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
              activePage="records" />

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

            <ZooFormatDateField
              name="date"
              label="Datum"
              defaultValue={selectedItem.date || ""}
              errorMessage={fetcher.data?.validationErrors?.date?.at(0)}
              className="col-span-2">
            </ZooFormatDateField>

            <JollyComboBox
              name="actionTypeCode"
              label="Výkon"
              defaultItems={outletContext.actionTypes}
              defaultSelectedKey={selectedItem?.actionTypeCode}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2">
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="note"
              defaultValue={selectedItem.note || ""}
              className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="partner_species_id"
              label="Partner (druh)"
              items={partnerSpeciesAutocomplete.items}
              onSelectionChange={(k) => {
                partnerSpeciesAutocomplete.setSelectedKey(k as number);

                partnerAutocomplete.setAdditionalQueryParams({
                  'speciesId': k as string
                });

                partnerAutocomplete.setDefaultValues(
                  undefined,
                  []
                );

                partnerAutocomplete.setFilterText('');
                partnerAutocomplete.setSelectedKey(undefined);
              }}
              onInputChange={(v) => {
                partnerSpeciesAutocomplete.setFilterText(v);
              }}
              defaultSelectedKey={selectedItem?.partner_species_id}
              allowsEmptyCollection
              isLoading={partnerSpeciesAutocomplete.loadingState !== 'idle'}
            >
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="partnerId"
              label="Partner"
              items={partnerAutocomplete.items}
              onSelectionChange={(k) => {
                partnerAutocomplete.setSelectedKey(k as number);
              }}
              onInputChange={(v) => {
                partnerAutocomplete.setFilterText(v);
              }}
              defaultSelectedKey={selectedItem?.partnerId}
              allowsEmptyCollection
              isLoading={partnerAutocomplete.loadingState != 'idle'}
            >
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

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
                    navigate(`/records/specimens/${outletContext.specimenId}/records${location.search}`);
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
              return `/records/specimens/${outletContext.specimenId}/records/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
