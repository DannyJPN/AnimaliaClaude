import {
    ActionFunctionArgs,
    useFetcher,
    useLocation,
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router";
import { handleStringCUD } from "~/.server/records/string-crud-action-handler";
import { pziConfig } from "~/.server/pzi-config";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { LockIcon, SettingsIcon } from "lucide-react";
import { Rearing } from "./models";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { FormValidationContext } from "react-aria-components";
import { loader } from "./list";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";

export async function action({ request }: ActionFunctionArgs) {
    return await handleStringCUD<Rearing>(
        request,
        (formData) => {
            const formDataEntries = Object.fromEntries(formData);
            const postData: Partial<Rearing> = {
                code: formDataEntries["code"]?.toString(),
                displayName: formDataEntries["displayName"]?.toString(),
                sort: Number(formDataEntries["sort"]),
                note: formDataEntries["note"]?.toString(),
            };
            return postData;
        },
        "api/rearings",
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
    ? actionParam!
    : "";

  const [selectedItem, setSelectedItem] = useState<Rearing | undefined>(undefined);
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
        navigate(`/lists/rearings${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/lists/rearings/${fetcher.data.changeResult?.code}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (itemId) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si: { code: string; }  ) => si.code === itemId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        code: "",
      } as Rearing);
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

            <TextField name="code"
              defaultValue={selectedItem?.code}
              className="grow"
              isRequired
              isReadOnly={mode === 'edit'}>
              <Label>Kód</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

          </fieldset>

          <div className="flex">
            <div className="grow"></div>
            <div className="flex gap-1 p-2">
              <ActionsMenu
                item={selectedItem}
                isDisabled={mode === 'insert'}
              />
              {/*
              <Button variant='outline'
                size="sm"
                isDisabled={changingValues || !outletContext.hasEditPermission}
                onPressChange={() => {
                  setChangingValues(true);
                }}>
                <LockIcon className="size-3" />
              </Button>
              */}
            </div>
          </div>

          <fieldset
            className="grid grid-cols-4 gap-2 p-2"
            disabled={editDisabled}>

            <TextField name="displayName" defaultValue={selectedItem?.displayName} className="col-span-2">
              <Label>Název</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="sort" defaultValue={selectedItem?.sort?.toString()} className="col-span-2">
              <Label>Pořadí</Label>
              <Input type="number" />
              <FieldError />
            </TextField>
            <div className="col-span-full" />

            <TextField name="note" defaultValue={selectedItem?.note ?? ''} className="col-span-4">
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
                value={mode}
                size='sm'
                isDisabled={fetcher.state !== 'idle'}>
                Uložit
              </Button>

              {mode === 'edit' && (
                <>
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
                        return `/lists/rearings/${itm.code}${location.search}`
                      }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}

export function ActionsMenu({ item, isDisabled }: {
    item: Rearing,
    isDisabled: boolean,
}) {
    return (
        <>
            <MenuTrigger>
                <Button
                    aria-label="Akce"
                    size="sm"
                    variant="outline"
                    isDisabled={isDisabled} >
                    <SettingsIcon className="size-3" />
                </Button>
                <MenuPopover>
                    <Menu>
                    </Menu>
                </MenuPopover>
            </MenuTrigger>
        </>
    );
}