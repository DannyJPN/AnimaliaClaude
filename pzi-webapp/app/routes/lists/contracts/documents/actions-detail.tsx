import { Card } from "~/components/ui/card";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { useEffect, useState } from "react";
import { ContractAction } from "../models";
import { loader } from "./actions-list";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { Label, FieldError } from "~/components/ui/field";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { FormValidationContext } from "react-aria-components";
import { ContractsNavigation } from "../navigation";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { Button } from "~/components/ui/button";
import { LockIcon } from "lucide-react";

export async function action({ request, params }: ActionFunctionArgs) {
  const contractId = params.contractId;
  
  return await handleCUD<ContractAction>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);
      
      const postData: Partial<ContractAction> = {
        contractId: parseInt(contractId!),
        id: formDataEntries.id ? parseInt(formDataEntries.id as string) : undefined,
        date: formDataEntries.date as string,
        note: formDataEntries.note as string,
        ...(formDataEntries.actionTypeCode ? { actionTypeCode: formDataEntries.actionTypeCode as string } : {}),
        ...(formDataEntries.actionInitiatorCode ? { actionInitiatorCode: formDataEntries.actionInitiatorCode as string } : {}),
        modifiedBy: formDataEntries.modifiedBy as string
      };
      
      return postData;
    },
    'api/contractactions',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function ActionDetail() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

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

  const [selectedItem, setSelectedItem] = useState<ContractAction | undefined>(undefined);
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
          navigate(`/lists/contracts/${outletContext.contractId}/actions${location.search}`);
          break;
        }
        case 'insert': {
          navigate(`/lists/contracts/${outletContext.contractId}/actions/${fetcher.data.changeResult?.id}${location.search}`);
          break;
        }
      }
    }, [fetcher.state, fetcher.data, navigate, outletContext.contractId, location.search, itemId]);
  
    useEffect(() => {
      if (itemId !== Number.MIN_SAFE_INTEGER) {
        setChangingValues(false);
        const foundItem = outletContext.items.find((si) => si.id === itemId)!;
        if (foundItem) {
          setSelectedItem(foundItem);
        }
      } else {
        setChangingValues(true);
        setSelectedItem({
          id: Number.MIN_SAFE_INTEGER,
          contractId: Number(outletContext.contractId),
        } as ContractAction);
      }
  
      setFormKey(Date.now().toString());
    }, [itemId, outletContext.items, outletContext.contractId]);
  
    if (!selectedItem) {
      return null;
    }

  return (
    <Card className="rounded-none border bg-card text-card-foreground shadow-none">
      <div className="flex flex-col h-full">
        <FormValidationContext.Provider key={itemId} value={{}}>

          <fieldset
            disabled
            className="flex flex-wrap gap-2 p-2 bg-secondary min-h-[72px]"
          >
            {/* Empty fieldset to match the height of the MRT toolbar */}
          </fieldset>

          <div className="flex">
            <ContractsNavigation
              contractId={Number(outletContext.contractId)}
              activePage="actions"
            />
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

          <fetcher.Form method="post" className="flex flex-col h-full">
            {mode === 'edit' && <input type="hidden" name="id" defaultValue={itemId} />}
            <input type="hidden" name="modifiedBy" defaultValue="user" />
            <input type="hidden" name="actionTypeCode" value={selectedItem?.actionTypeCode || ''} />
            <input type="hidden" name="actionInitiatorCode" value={selectedItem?.actionInitiatorCode || ''} />
            <fieldset className="grid grid-cols-4 gap-2 p-2" disabled={editDisabled}>
              <TextField 
                name="date"
                defaultValue={selectedItem?.date}
                className="col-span-4">
                <Label>Datum</Label>
                <Input type="text" />
                <FieldError />
              </TextField>

              <JollyComboBox
                name="actionTypeCode"
                label="Úkon"
                defaultItems={outletContext.actionTypes}
                selectedKey={selectedItem?.actionTypeCode}
                defaultSelectedKey={selectedItem?.actionTypeCode}
                onSelectionChange={(key) => {
                  if (changingValues) {
                    setSelectedItem(prev => ({
                      ...prev!,
                      actionTypeCode: key as string
                    }));
                  }
                }}
                isLoading={false}>
                {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
              </JollyComboBox>

              <JollyComboBox
                name="actionInitiatorCode"
                label="Účastník"
                defaultItems={outletContext.actionInitiators}
                selectedKey={selectedItem?.actionInitiatorCode}
                defaultSelectedKey={selectedItem?.actionInitiatorCode}
                onSelectionChange={(key) => {
                  if (changingValues) {
                    setSelectedItem(prev => ({
                      ...prev!,
                      actionInitiatorCode: key as string
                    }));
                  }
                }}
                isLoading={false}>
                {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
              </JollyComboBox>

              <TextField 
                name="note"
                defaultValue={selectedItem?.note}
                className="col-span-4">
                <Label>Poznámka</Label>
                <TextArea />
                <FieldError />
              </TextField>
              
            </fieldset>
          

          {changingValues && (
            <div className="p-2 flex gap-2">
              <Button
                variant='default'
                type="submit"
                name="formAction"
                value={mode === 'edit' ? 'edit' : 'insert'}
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
                      setFormKey(Date.now().toString());
                    }}>
                    Zrušit
                  </Button>
                </>
              )}
            </div>
          )}
          </fetcher.Form>

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) => {
              return `/lists/contracts/${outletContext.contractId}/actions/${itm.id}${location.search}`;
            }}
          />
        </FormValidationContext.Provider>
      </div>
    </Card>
  );
}
