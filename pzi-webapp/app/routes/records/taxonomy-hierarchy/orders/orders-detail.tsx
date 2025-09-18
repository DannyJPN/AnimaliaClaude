import { CircleEllipsisIcon, HeartIcon, LockIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";
import { Input, TextField } from "~/components/ui/textfield";
import { TaxonomyOrderItem } from "./models";
import { loader } from "./orders-list";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomyOrderItem>(
    request,
    (formData) => {
      const postData: Partial<TaxonomyOrderItem> = Object.fromEntries(formData);
      return postData;
    },
    'api/taxonomyorders',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>['data'];

export default function OrderDetail() {
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

  const orderId = mode === 'edit'
    ? parseInt(actionParam!)
    : Number.MIN_SAFE_INTEGER;

  const [selectedItem, setSelectedItem] = useState<TaxonomyOrderItem | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');

  const setFocusRef = useCallback((node: HTMLInputElement | null) => {
    if (node && changingValues && mode === 'edit') {
      setTimeout(() => {
        node.focus();
      }, 0);
    }
  }, [changingValues, mode]);

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;
    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/classes/${outletContext.classId}/orders${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/classes/${outletContext.classId}/orders/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (orderId !== Number.MIN_SAFE_INTEGER) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si) => si.id === orderId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        taxonomyClassId: outletContext.classId,
        nameLat: '',
        nameCz: '',
        nameEn: '',
        nameSk: '',
        code: ''
      } as TaxonomyOrderItem);
    }

    setFormKey(Date.now().toString());
  }, [orderId, outletContext.items]);

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
              name="nameLat"
              defaultValue={selectedItem.nameLat}>
              <Label>Latinsky</Label>
              <Input type="text" autoFocus={true} ref={setFocusRef} />
              <FieldError />
            </TextField>

            <TextField
              name="nameCz"
              defaultValue={selectedItem.nameCz}>
              <Label>Česky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="code"
              defaultValue={selectedItem.code}>
              <Label>Kód</Label>
              <Input type="text" />
              <FieldError />
            </TextField>
          </fieldset>

          <div className="flex">
            <div className="grow"></div>
            <div className="flex gap-1 p-2">
              <ActionsMenu
                itemId={selectedItem!.id} />

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
              name="nameEn"
              defaultValue={selectedItem.nameEn}
              className="col-span-2">
              <Label>Anglicky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="nameSk"
              defaultValue={selectedItem.nameSk}
              className="col-span-2">
              <Label>Slovensky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <input type='hidden' name='id' defaultValue={selectedItem.id} />
            <input type='hidden' name='taxonomyClassId' defaultValue={selectedItem.taxonomyClassId} />
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
                    navigate(`/records/classes/${outletContext.classId}/orders${location.search}`);
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
              return `/records/classes/${outletContext.classId}/orders/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}

export function ActionsMenu({ itemId }: { itemId: number }) {
  return (
    <MenuTrigger>
      <Button aria-label="Akce" size="icon" variant="outline" className="text-xs p-0 w-8 h-8 bg-transparent">
        <CircleEllipsisIcon className="size-3" />
      </Button>
      <MenuPopover>
        <Menu>
          <MenuSection>
            <MenuHeader>Navigace</MenuHeader>
            <MenuItem href={`/records/orders/${itemId}/families`}>Čelede</MenuItem>
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
}
