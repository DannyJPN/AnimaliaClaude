import {
    ActionFunctionArgs,
    useFetcher,
    useLocation,
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { pziConfig } from "~/.server/pzi-config";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { LockIcon, SettingsIcon, FileDownIcon } from "lucide-react";
import { Partners } from "./models";
import { useEffect, useState } from "react";
import { Card, CardFooter } from "~/components/ui/card";
import { FormValidationContext } from "react-aria-components";
import { loader } from "./list";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Menu, MenuHeader, MenuItem, MenuPopover, MenuSection, MenuTrigger } from "~/components/ui/menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useFileDownload } from "~/components/hooks/use-file-download";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";

export async function action({ request }: ActionFunctionArgs) {
    return await handleCUD<Partners>(
        request,
        (formData) => {
            const formDataEntries = Object.fromEntries(formData);
            const postData: Partial<Partners> = {
                id: formDataEntries["id"] ? Number(formDataEntries["id"]) : undefined,
                keyword: formDataEntries["keyword"]?.toString(),
                name: formDataEntries["name"]?.toString(),
                status: formDataEntries["status"]?.toString(),
                city: formDataEntries["city"]?.toString(),
                streetAddress: formDataEntries["streetAddress"]?.toString(),
                postalCode: formDataEntries["postalCode"]?.toString(),
                country: formDataEntries["country"]?.toString(),
                phone: formDataEntries["phone"]?.toString(),
                email: formDataEntries["email"]?.toString(),
                partnerType: formDataEntries["partnerType"]?.toString(),
                lastName: formDataEntries["lastName"]?.toString(),
                firstName: formDataEntries["firstName"]?.toString(),
                note: formDataEntries["note"]?.toString(),
            };
            return postData;
        },
        "api/partners",
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

  const [selectedItem, setSelectedItem] = useState<Partners | undefined>(undefined);
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
        navigate(`/lists/partners${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/lists/partners/${fetcher.data.changeResult?.id}${location.search}`);
        break;
      }
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (itemId !== Number.MIN_SAFE_INTEGER) {
      setChangingValues(false);
      setSelectedItem(outletContext.items.find((si: { id: number; }  ) => si.id === itemId)!);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
      } as Partners);
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

            <TextField name="keyword"
              defaultValue={selectedItem?.keyword}
              className="grow">
              <Label>Keyword</Label>
              <Input type="text" autoFocus={true} />
              <FieldError />
            </TextField>

          </fieldset>

          <div className="flex">
            <div className="grow"></div>
            <div className="flex gap-1 p-2">
              <ActionsMenu
                partner={selectedItem}
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

            <TextField name="status" defaultValue={selectedItem?.status} className="col-span-2">
              <Label>Status</Label>
              <Input type="text" />
              <FieldError />
            </TextField>
            <div className="col-span-full" />
            <TextField name="city" defaultValue={selectedItem?.city} className="col-span-1">
              <Label>Město</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField name="streetAddress" defaultValue={selectedItem?.streetAddress} className="col-span-1">
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

            <TextField name="partnerType" defaultValue={selectedItem?.partnerType} className="col-span-1">
              <Label>Typ</Label>
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
                        return `/lists/partners/${itm.id}${location.search}`
                      }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}

function MovementsByPartnerDialog({ partner, onClose }: { partner: Partners, onClose: () => void }) {
    const { isDownloading, downloadFile } = useFileDownload();
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const handleDownload = async () => {
        if (!dateFrom || !dateTo) return;

        const params: Record<string, string> = {
            minDate: dateFrom,
            maxDate: dateTo,
            partnerId: partner.id.toString(),
        };

        await downloadFile(`/print-reports/zoology/movement-in-zoo-by-partner?${new URLSearchParams(params).toString()}`);
        onClose();
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pohyb podle partnerů: {partner.name}</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <ZooFormatDateField
                    name="dateFrom"
                    value={dateFrom}
                    onChange={setDateFrom}
                    placeholder="YYYY/MM/DD"
                    label="Datum od"
                />

                <ZooFormatDateField
                    name="dateTo"
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="YYYY/MM/DD"
                    label="Datum do"
                />
            </div>
            <CardFooter className="p-2 pt-0">
                <Button
                    type="button"
                    aria-label="Generovat Report"
                    variant='default'
                    size="sm"
                    onPress={handleDownload}
                    isDisabled={!dateFrom || !dateTo || isDownloading}>
                    <FileDownIcon className="size-3 mr-2" />
                    Generovat Report
                </Button>
            </CardFooter>
        </DialogContent>
    );
}

function CadaverByPartnerDialog({ partner, onClose }: { partner: Partners, onClose: () => void }) {
    const { isDownloading, downloadFile } = useFileDownload();
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const handleDownload = async () => {
        if (!dateFrom || !dateTo) return;

        const params: Record<string, string> = {
            minDate: dateFrom,
            maxDate: dateTo,
            partnerId: partner.id.toString(),
        };

        await downloadFile(`/print-reports/zoology/movement-in-zoo-by-partner?${new URLSearchParams(params).toString()}`);
        onClose();
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Pohyb podle partnerů: {partner.name}</DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
                <ZooFormatDateField
                    name="dateFrom"
                    value={dateFrom}
                    onChange={setDateFrom}
                    placeholder="YYYY/MM/DD"
                    label="Datum od"
                />

                <ZooFormatDateField
                    name="dateTo"
                    value={dateTo}
                    onChange={setDateTo}
                    placeholder="YYYY/MM/DD"
                    label="Datum do"
                />
            </div>
            <CardFooter className="p-2 pt-0">
                <Button
                    type="button"
                    aria-label="Generovat Report"
                    variant='default'
                    size="sm"
                    onPress={handleDownload}
                    isDisabled={!dateFrom || !dateTo || isDownloading}>
                    <FileDownIcon className="size-3 mr-2" />
                    Generovat Report
                </Button>
            </CardFooter>
        </DialogContent>
    );
}

export function ActionsMenu({ partner, isDisabled }: {
    partner: Partners,
    isDisabled: boolean,
}) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
                        <MenuSection>
                            <MenuHeader>Sestavy</MenuHeader>
                            <MenuItem onAction={() => setIsDialogOpen(true)}>Pohyb podle partnerů</MenuItem>
                        </MenuSection>
                        <MenuSection>
                            <MenuHeader>Korespondence</MenuHeader>
                            <MenuItem onAction={() => window.open(`/print-reports/economy/envelope-export?partnerId=${partner.id}`, '_blank')}>
                                Obálka
                            </MenuItem>
                            <MenuItem onAction={() => window.open(`/print-reports/exports/economy/deposit-inquiry-export?language=cz&partnerId=${partner.id}`, '_blank')}>
                                Dotaz k deponacím - CZ
                            </MenuItem>
                            <MenuItem onAction={() => window.open(`/print-reports/exports/economy/deposit-inquiry-export?language=eng&partnerId=${partner.id}`, '_blank')}>
                                Dotaz k deponacím - ENG
                            </MenuItem>
                        </MenuSection>
                    </Menu>
                </MenuPopover>
            </MenuTrigger>
            <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <MovementsByPartnerDialog partner={partner} onClose={() => setIsDialogOpen(false)} />
            </DialogTrigger>
        </>
    );
}
