import { useQuery } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { ItemPicker } from "~/components/common/item-picker";
import { useAutocomplete } from "~/components/hooks/use-autocomplete";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { fetchJson } from "~/lib/fetch";
import { parseOptionalNumber } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { SpecimenHeaderDetail, SpecimenNavigation } from "./controls";
import { TaxonomySpecimenMovementItem, TaxonomySpecimenMovementItemWithFlatRelatedData } from "./models";
import { loader } from "./movements-list";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpecimenMovementItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpecimenMovementItem> = {
        ...formDataEntries,
        specimenId: parseOptionalNumber(formData, 'specimenId'),
        quantity: parseOptionalNumber(formData, 'quantity'),
        quantityActual: parseOptionalNumber(formData, 'quantityActual'),
        contractId: parseOptionalNumber(formData, 'contractId'),
        price: parseOptionalNumber(formData, 'price'),
        priceFinal: parseOptionalNumber(formData, 'priceFinal'),
        locationId: parseOptionalNumber(formData, 'locationId'),
      } as Partial<TaxonomySpecimenMovementItem>;

      if (!postData.decrementReasonCode) {
        postData.decrementReasonCode = undefined;
      }

      if (!postData.incrementReasonCode) {
        postData.incrementReasonCode = undefined;
      }

      return postData;
    },
    'api/movements',
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

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenMovementItemWithFlatRelatedData | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const [selectedPartnerOption, setSelectedPartnerOption] = useState<SelectItemType<number, string> | undefined>(undefined);
  const [partnerOptions, setPartnerOptions] = useState<SelectItemType<number, string>[]>([]);
  const [partnerQuery, setPartnerQuery] = useState<string | undefined>(undefined);
  const partnerQueryDebounced = useDebounceValue(partnerQuery, 250);

  const partnersOptionsData = useQuery({
    queryKey: [
      'movements-partners-search', partnerQueryDebounced
    ],
    queryFn: async ({ signal }): Promise<SelectItemType<number, string>[]> => {
      if (!partnerQueryDebounced || partnerQueryDebounced.length < 1) {
        return [];
      }

      return await fetchJson<SelectItemType<number, string>[]>(
        `/autocompletes/autocomplete-partner?q=${partnerQueryDebounced}`,
        {
          method: 'GET',
          signal
        }
      );
    }
  });

  useEffect(() => {
    setFormKey(Date.now().toString());
  }, [changingValues]);

  useEffect(() => {
    if (!partnersOptionsData.data) {
      return;
    }

    const newOptions = [
      ...(selectedPartnerOption ? [selectedPartnerOption] : []),
      ...partnersOptionsData.data.filter(({ key }) => key !== selectedPartnerOption?.key)
    ];

    setPartnerOptions(newOptions);
  }, [partnersOptionsData.data]);

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
        navigate(`/records/specimens/${outletContext.specimenId}/movements${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/specimens/${outletContext.specimenId}/movements/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (itemId !== Number.MIN_SAFE_INTEGER) {
      setChangingValues(false);

      const outletItem = outletContext.items.find((si) => si.id === itemId)!;

      setSelectedItem(outletItem);

      var outletItemPartner = outletItem?.locationId
          ? { key: outletItem.locationId, text: outletItem.partner_keyword! }
          : undefined;

      setSelectedPartnerOption(outletItemPartner);
    } else {
      setChangingValues(true);
      
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        specimenId: outletContext.specimenId,
        date: '',
        quantity: 1,
        quantityActual: 1
      } as TaxonomySpecimenMovementItemWithFlatRelatedData);

      setSelectedPartnerOption(undefined);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  useEffect(() => {
    contractAutocomplete.setDefaultValues(
      selectedItem?.contractId,
      selectedItem?.contract
        ? [{ key: selectedItem.contractId!, text: selectedItem.contract_number! }]
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
              activePage="movements" />

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
              label="Datum pohybu"
              defaultValue={selectedItem.date || ""}
              errorMessage={fetcher.data?.validationErrors?.date?.at(0)}
              className="col-span-2">
            </ZooFormatDateField>

            <ZooFormatDateField
              name="accountingDate"
              label="Účetní datum"
              defaultValue={selectedItem.accountingDate || ""}
              errorMessage={fetcher.data?.validationErrors?.accountingDate?.at(0)}
              className="col-span-2">
            </ZooFormatDateField>

            <TextField
              name="quantity"
              defaultValue={selectedItem.quantity?.toString() || ""}
              className="col-span-2">
              <Label>Počet v ZOO</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="quantityActual"
              defaultValue={selectedItem.quantityActual?.toString() || ""}
              className="col-span-2">
              <Label>Počet v pohybu</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="incrementReasonCode"
              label="Přírustek"
              defaultItems={outletContext.incrementReasons}
              defaultSelectedKey={selectedItem?.incrementReasonCode}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2">
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="decrementReasonCode"
              label="Úbytek"
              defaultItems={outletContext.decrementReasons}
              defaultSelectedKey={selectedItem?.decrementReasonCode}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2">
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <ItemPicker
              name="locationId"
              label="Místo"
              placeholder="Zvolit místo"
              className="col-span-2"
              selectedItem={selectedPartnerOption}
              selectedItemChanged={(opt) => {
                setSelectedPartnerOption(opt);
              }}
              filteredItems={partnerOptions || []}
              onFilterChanged={(value) => {
                setPartnerQuery(value || '');
              }}
              changesDisabled={!changingValues}
            />

            <TextField
              name="gender"
              defaultValue={selectedItem.gender}
              className="col-span-2">
              <Label>Pohlaví skupiny M,F[,U]</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="price"
              defaultValue={selectedItem.price?.toString()}
              className="col-span-2">
              <Label>Cena [Kč]</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="priceFinal"
              defaultValue={selectedItem.priceFinal?.toString()}
              className="col-span-2">
              <Label>Obchodní cena [Kč]</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="note"
              defaultValue={selectedItem.note || ""}
              className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="contractId"
              label="Smlouva"
              items={contractAutocomplete.items}
              onSelectionChange={(k) => {
                contractAutocomplete.setSelectedKey(k as number);
              }}
              onInputChange={(v) => {
                contractAutocomplete.setFilterText(v);
              }}
              defaultSelectedKey={selectedItem?.contractId}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2"
            >
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="contractNote"
              defaultValue={selectedItem.contractNote || ""}
              className="col-span-2">
              <Label>Poznámka ke smlouvě</Label>
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
                    navigate(`/records/specimens/${outletContext.specimenId}/movements${location.search}`);
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
              return `/records/specimens/${outletContext.specimenId}/movements/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
