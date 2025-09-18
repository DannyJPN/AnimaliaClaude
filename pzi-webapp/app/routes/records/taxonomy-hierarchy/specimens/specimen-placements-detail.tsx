import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { parseOptionalNumber } from "~/lib/utils";
import { SpecimenHeaderDetail, SpecimenNavigation } from "./controls";
import { SpecimenPlacementItem } from "./models";
import { loader } from "./specimen-placements-list";
import { TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<SpecimenPlacementItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);
      const postData: Partial<SpecimenPlacementItem> = {
        ...formDataEntries,
        specimenId: parseOptionalNumber(formData, 'specimenId'),
        validSince: formDataEntries.validSince as string,
        locationId: parseOptionalNumber(formData, 'locationId'),
        organizationLevelId: parseOptionalNumber(formData, 'organizationLevelId'),
      };
      return postData;
    },
    'api/SpecimenPlacements',
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

  const [selectedItem, setSelectedItem] = useState<SpecimenPlacementItem | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(mode === 'insert');
  const [validatioErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const editDisabled = !changingValues || fetcher.state !== 'idle';

  useEffect(() => {
    const actionSuccess = fetcher.state === 'idle' && fetcher.data?.success;

    if (fetcher.state === 'idle' && !fetcher.data?.success) {
      setValidationErrors(fetcher.data?.validationErrors || {});
    }

    if (!actionSuccess) {
      return;
    }

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case 'delete': {
        navigate(`/records/specimens/${outletContext.specimenId}/specimen-placements${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/specimens/${outletContext.specimenId}/specimen-placements/${fetcher.data.changeResult?.id}${location.search}`);
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
        id: Number.MIN_SAFE_INTEGER
      } as SpecimenPlacementItem);
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
        <FormValidationContext.Provider value={validatioErrors}>
          <fieldset
            disabled={editDisabled}
            className="flex flex-wrap gap-2 p-2 bg-secondary">
            <SpecimenHeaderDetail specimen={outletContext.specimenInfo!} />
          </fieldset>

          <div className="flex">
            <SpecimenNavigation
              speciesId={outletContext.specimenInfo!.speciesId}
              specimenId={outletContext.specimenId}
              activePage="placements" />

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
            className="grid grid-cols-1 gap-2 p-2"
            disabled={editDisabled}>

            <ZooFormatDateField
              name="validSince"
              label="Datum"
              defaultValue={selectedItem.validSince || ""}
              errorMessage={validatioErrors?.validSince?.at(0)}
              className="col-span-2"
              autoFocus>
            </ZooFormatDateField>

            <JollyComboBox
              name="organizationLevelId"
              label="Organizační jednotka"
              defaultItems={outletContext.organizationLevels}
              defaultSelectedKey={selectedItem.organizationLevelId}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2"
              onInputChange={() => {
                setValidationErrors({
                  ...validatioErrors,
                  organizationLevelId: [],
                  locationId: []
                });
              }}>
              {item => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="locationId"
              label="Lokace"
              defaultItems={outletContext.locations}
              defaultSelectedKey={selectedItem.locationId}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2"
              onInputChange={() => {
                setValidationErrors({
                  ...validatioErrors,
                  organizationLevelId: [],
                  locationId: []
                });
              }}>
              {item => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>
            
            <TextField
              name="note"
              defaultValue={selectedItem.note || ""}
              className="col-span-2">
              <Label>Poznámka</Label>
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
                    navigate(`/records/specimens/${outletContext.specimenId}/specimen-placements${location.search}`);
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
              return `/records/specimens/${outletContext.specimenId}/specimen-placements/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
