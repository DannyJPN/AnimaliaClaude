import {
    ActionFunctionArgs,
    useFetcher,
    useLocation,
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router";
import { handleZooCUD } from "~/.server/records/zoo-crud-action-handler";
import { pziConfig } from "~/.server/pzi-config";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { LockIcon, SettingsIcon } from "lucide-react";
import { Zoos } from "./models";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { FormValidationContext } from "react-aria-components";
import { loader } from "./list";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";

export async function action({ request }: ActionFunctionArgs) {
    return await handleZooCUD<Zoos>(
        request,
        (formData) => {
            const formDataEntries = Object.fromEntries(formData);
            console.log("formDataEntries['id']:", formDataEntries["id"]); // Add this line
            const postData: Partial<Zoos> = {
                id: formDataEntries["id"]?.toString(),
                keyword: formDataEntries["keyword"]?.toString(),
                name: formDataEntries["name"]?.toString(),
                city: formDataEntries["city"]?.toString(),
                streetNumber: formDataEntries["streetNumber"]?.toString(),
                postalCode: formDataEntries["postalCode"]?.toString(),
                country: formDataEntries["country"]?.toString(),
                phone: formDataEntries["phone"]?.toString(),
                email: formDataEntries["email"]?.toString(),
                website: formDataEntries["website"]?.toString(),
                lastName: formDataEntries["lastName"]?.toString(),
                firstName: formDataEntries["firstName"]?.toString(),
                note: formDataEntries["note"]?.toString(),
            };
            return postData;
        },
        "api/zoos",
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

  const [selectedItem, setSelectedItem] = useState<Zoos | undefined>(undefined);
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
        navigate(`/lists/zoos${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/lists/zoos/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (itemId) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si: { id: string; }  ) => si.id === itemId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: "",
      } as Zoos);
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

            <TextField name="id"
              defaultValue={selectedItem?.id}
              className="grow"
              isRequired
              isReadOnly={mode === 'edit'}>
              <Label>ID</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="keyword"
              defaultValue={selectedItem?.keyword}
              className="grow">
              <Label>Keyword</Label>
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

            <TextField name="name" defaultValue={selectedItem?.name} className="col-span-2">
              <Label>Název</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="city" defaultValue={selectedItem?.city} className="col-span-1">
              <Label>Město</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="streetNumber" defaultValue={selectedItem?.streetNumber} className="col-span-1">
              <Label>Ulice a číslo</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="postalCode" defaultValue={selectedItem?.postalCode} className="col-span-1">
              <Label>PSČ</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="country" defaultValue={selectedItem?.country} className="col-span-1">
              <Label>Země</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="phone" defaultValue={selectedItem?.phone} className="col-span-1">
              <Label>Telefon</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="email" defaultValue={selectedItem?.email} className="col-span-1">
              <Label>Email</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="website" defaultValue={selectedItem?.website} className="col-span-1">
              <Label>Website</Label>
              <Input type="text" />
              <FieldError />
            </TextField>
            <div className="col-span-full" />

            <TextField name="firstName" defaultValue={selectedItem?.firstName} className="col-span-1">
              <Label>Křestní jméno</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="lastName" defaultValue={selectedItem?.lastName} className="col-span-1">
              <Label>Příjmení</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="note" defaultValue={selectedItem?.note} className="col-span-4">
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
                        return `/lists/zoos/${itm.id}${location.search}`
                      }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}

export function ActionsMenu({ item, isDisabled }: {
    item: Zoos,
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
