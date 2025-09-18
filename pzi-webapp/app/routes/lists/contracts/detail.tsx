import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { useAutocomplete } from "~/components/hooks/use-autocomplete";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { parseOptionalNumber } from "~/lib/utils";
import { loader } from "./list";
import { Contract, ContractWithRelatedData } from "./models";
import { ContractsNavigation } from "./navigation";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<Contract>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<Contract> = {
        ...formDataEntries,
        year: parseOptionalNumber(formData, 'year'),
        partnerId: parseOptionalNumber(formData, 'partnerId')
      } as Partial<Contract>;

      return postData;
    },
    'api/contracts',
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

  const [selectedItem, setSelectedItem] = useState<ContractWithRelatedData | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  const partnerAutocomplete = useAutocomplete<number>(
    '/autocompletes/autocomplete-partner'
  );

  useEffect(() => {
    partnerAutocomplete.setDefaultValues(
      selectedItem?.partnerId,
      selectedItem?.partnerId
        ? [{ key: selectedItem.partnerId, text: selectedItem.partner_keyword! }]
        : []
    )
  }, [selectedItem]);

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/lists/contracts${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/lists/contracts/${fetcher.data.changeResult?.id}${location.search}`);
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
      } as ContractWithRelatedData);
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

            <TextField
              name="number"
              defaultValue={selectedItem?.number}
              className="grow">
              <Label>Číslo</Label>
              <Input type="text" autoFocus={true} />
              <FieldError />
            </TextField>

            <TextField
              name="year"
              defaultValue={selectedItem?.year?.toString()}>
              <Label>Rok</Label>
              <Input type="number" />
              <FieldError />
            </TextField>

            <TextField
              name="date"
              defaultValue={selectedItem?.date}>
              <Label>Datum</Label>
              <Input type="text" />
              <FieldError />
            </TextField>
          </fieldset>

          <div className="flex">
            <ContractsNavigation
              contractId={selectedItem?.id || -1}
              activePage="home"
              navigationsDisabled={mode === 'insert'} />
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
              name="movementReasonCode"
              label="Pohyb"
              defaultItems={outletContext.contractMovementReasons}
              defaultSelectedKey={selectedItem?.movementReasonCode}
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="contractTypeCode"
              label="Druh"
              defaultItems={outletContext.contractTypes}
              defaultSelectedKey={selectedItem?.contractTypeCode}
              isLoading={false}>
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
              isLoading={partnerAutocomplete.loadingState !== 'idle'}
              className="col-span-2"
            >
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="note"
              defaultValue={selectedItem.note}
              className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <TextField
              name="notePartner"
              defaultValue={selectedItem.notePartner}
              className="col-span-4">
              <Label>Poznámka Partner</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <TextField

              name="notePrague"
              defaultValue={selectedItem.notePrague}
              className="col-span-4">
              <Label>Poznámka Praha</Label>
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
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
