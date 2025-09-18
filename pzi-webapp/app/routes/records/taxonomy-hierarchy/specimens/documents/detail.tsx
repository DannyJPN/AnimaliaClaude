import { LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import {
  ActionFunctionArgs,
  useFetcher,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams
} from "react-router";
import { pziConfig } from "~/.server/pzi-config";
import { handleCUD } from "~/.server/records/crud-action-handler";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { ZooFormatDateField } from "~/components/ui/zoo-format-datefield";
import { parseCheckboxBoolean, parseOptionalNumber } from "~/lib/utils";
import { SpecimenHeaderDetail, SpecimenNavigation } from "../controls";
import { TaxonomySpecimenDocumentItem, TaxonomySpecimenDocumentItemWithRelations } from "../models";
import { loader } from "./list";

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpecimenDocumentItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpecimenDocumentItem> = {
        ...formDataEntries,
        specimenId: parseOptionalNumber(formData, 'specimenId'),
        isValid: parseCheckboxBoolean(formData, 'isValid')
      } as Partial<TaxonomySpecimenDocumentItem>;

      return postData;
    },
    'api/documentspecimens',
    pziConfig
  );
}

type ContextType = Awaited<ReturnType<typeof loader>>["data"];

export default function Detail() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const outletContext = useOutletContext<ContextType>();

  const actionParam = params.actionParam;

  const isNew = actionParam === "new";
  const mode = isNew ? "insert" : "edit";

  const itemId = !isNew && actionParam ? parseInt(actionParam) : Number.MIN_SAFE_INTEGER;

  const [formKey, setFormKey] = useState(Date.now().toString());
  const fetcher = useFetcher<typeof action>({ key: formKey });

  const [selectedItem, setSelectedItem] = useState<TaxonomySpecimenDocumentItemWithRelations | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(isNew);

  const editDisabled = !changingValues || fetcher.state !== "idle";

  useEffect(() => {
    const actionSuccess = fetcher.state === "idle" && fetcher.data?.success;
    if (!actionSuccess) return;

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case "delete":
        navigate(`/records/specimens/${outletContext.specimenId}/documents${location.search}`);
        break;
      case "insert":
        navigate(`/records/specimens/${outletContext.specimenId}/documents/${fetcher.data.changeResult?.id}${location.search}`, { replace: true });
        break;
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    const foundItem = outletContext.items.find((si) => si.id === itemId);

    if (mode === "edit" && !foundItem) {
      return;
    }

    if (itemId !== Number.MIN_SAFE_INTEGER && foundItem) {
      setChangingValues(false);
      setSelectedItem(foundItem);
    } else {
      setChangingValues(true);
      setSelectedItem({
        id: Number.MIN_SAFE_INTEGER,
        specimenId: outletContext.specimenId,
        isValid: true,
      } as TaxonomySpecimenDocumentItemWithRelations);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items, mode]);

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={`${formKey}-${changingValues}`}
      className="rounded-none border bg-card text-card-foreground shadow-none">
      <fetcher.Form method="POST" className="flex flex-col h-full">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>

          <fieldset className="flex flex-row gap-4 p-2 items-end bg-secondary">
            <SpecimenHeaderDetail specimen={outletContext.specimenInfo!} />
          </fieldset>

          <div className="flex">
            <div className="grow">
              <SpecimenNavigation
                speciesId={outletContext.specimenInfo!.speciesId}
                specimenId={outletContext.specimenId}
                activePage="documents"
              />
            </div>
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
            disabled={editDisabled}
            className="grid grid-cols-4 gap-2 p-2"
          >
            <TextField
              name="number"
              defaultValue={selectedItem.number}
              className="col-span-4">
              <Label>Číslo</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="documentTypeCode"
              label="Druh"
              defaultItems={outletContext.documentTypes}
              defaultSelectedKey={selectedItem?.documentTypeCode}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2">
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <div className="col-span-2">
              <Label>Platný</Label>
              <div className="h-8 flex items-center">
                <Checkbox
                  name="isValid"
                  defaultSelected={selectedItem.isValid}
                  isDisabled={editDisabled}>
                </Checkbox>
              </div>
            </div>

            <ZooFormatDateField
              name="date"
              label="Datum"
              defaultValue={selectedItem.date || ""}
              errorMessage={fetcher.data?.validationErrors?.date?.at(0)}
              className="col-span-2">
            </ZooFormatDateField>

            <TextField
              name="partner"
              defaultValue={selectedItem.partner}
              className="col-span-2">
              <Label>Komu</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              name="note"
              defaultValue={selectedItem.note}
              className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <input type="hidden" name="id" value={selectedItem?.id ?? ''} />
            <input type="hidden" name="specimenId" value={selectedItem?.specimenId ?? outletContext.specimenId} />
          </fieldset>


          {changingValues && (
            <div className="p-2 flex gap-2">
              <Button
                variant="default"
                type="submit"
                name="formAction"
                value={mode}
                size="sm"
                isDisabled={fetcher.state !== "idle"}
              >
                Uložit
              </Button>

              {mode === "edit" && (
                <>
                  <Button
                    variant="destructive"
                    type="submit"
                    name="formAction"
                    value="delete"
                    size="sm"
                    isDisabled={fetcher.state !== "idle"}
                  >
                    Smazat
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    isDisabled={fetcher.state !== "idle"}
                    onPressChange={() => setChangingValues(false)}
                  >
                    Zrušit
                  </Button>
                </>
              )}
            </div>
          )}

          <ItemListNavigation
            currentItem={selectedItem}
            items={outletContext.items}
            getItemLink={(itm) =>
              `/records/specimens/${outletContext.specimenId}/documents/${itm.id}${location.search}`
            }
          />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
