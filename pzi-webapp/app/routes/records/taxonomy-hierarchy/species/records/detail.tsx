import { HeartIcon, LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { parseOptionalNumber } from "~/lib/utils";
import { SelectItemType } from "~/shared/models";
import { SpeciesNavigation } from "../controls";
import { TaxononomySpeciesRecordItem, TaxononomySpeciesRecordItemWithFlatRelatedData } from "../models";
import { loader } from './list';

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxononomySpeciesRecordItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxononomySpeciesRecordItem> = {
        ...formDataEntries,
        speciesId: parseOptionalNumber(formData, 'speciesId'),
      } as Partial<TaxononomySpeciesRecordItem>;

      if (!postData.actionTypeCode) {
        postData.actionTypeCode = undefined;
      }

      return postData;
    },
    'api/recordspecies',
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

  const [massRecordsShown, setMasRecordsShown] = useState(false);

  const [selectedItem, setSelectedItem] = useState<TaxononomySpeciesRecordItem | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/species/${outletContext.speciesId}/records${location.search}`, { replace: true });
        break;
      }
      case 'insert': {
        navigate(`/records/species/${outletContext.speciesId}/records/${fetcher.data.changeResult?.id}${location.search}`, { replace: true });
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
        speciesId: outletContext.speciesId,
        date: ''
      } as TaxononomySpeciesRecordItemWithFlatRelatedData);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items]);

  const classificationTypeOptions: SelectItemType<string, string>[] = [
    { key: 'E', text: 'E' },
    { key: 'S', text: 'S' }
  ];

  // This formType needs to be 'insert', 'edit', or 'new' for the header component to work correctly
  const formType = mode === 'insert'
    ? 'insert'
    : 'edit';

  if (!selectedItem) {
    return (null);
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

            <TextField
              name="code"
              defaultValue={outletContext.speciesInfo?.code}
              className="w-16"
              isDisabled={true}>
              <Label>Kód</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              className="w-48 grow"
              name="nameLat"
              defaultValue={outletContext.speciesInfo?.nameLat}
              isDisabled={true}>
              <Label>Latinsky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              className="w-48 grow"
              name="nameCz"
              defaultValue={outletContext.speciesInfo?.nameCz}
              isDisabled={true}>
              <Label>Česky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="classificationTypeCode"
              label="Typ"
              defaultItems={classificationTypeOptions}
              defaultSelectedKey={outletContext.speciesInfo?.classificationTypeCode}
              allowsEmptyCollection
              isLoading={false}
              className="w-16"
              isDisabled={true}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

          </fieldset>

          <div className="flex">
            <SpeciesNavigation
              genusId={outletContext.speciesInfo!.taxonomyGenusId}
              speciesId={selectedItem.speciesId}
              activePage="records"
            />

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
            className='grid grid-cols-4 gap-2 p-2'
            disabled={editDisabled}>

            <ZooFormatDateField
              name="date"
              label="Datum"
              defaultValue={selectedItem.date || ""}
              errorMessage={fetcher.data?.validationErrors?.date?.at(0)}>
            </ZooFormatDateField>

            <JollyComboBox
              name="actionTypeCode"
              label="Výkon"
              defaultItems={outletContext.actionTypes}
              defaultSelectedKey={selectedItem?.actionTypeCode}
              allowsEmptyCollection
              isLoading={false}>
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

            <input type='hidden' name='id' value={selectedItem.id} />
            <input type='hidden' name='speciesId' value={selectedItem.speciesId} />

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
              return `/records/species/${outletContext.speciesId}/records/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
