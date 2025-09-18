import { HeartIcon, LockIcon } from "lucide-react";
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
import { SpeciesNavigation } from "../controls";
import { TaxonomySpeciesDocumentItem, TaxonomySpeciesDocumentItemWithFlatRelatedData } from "./../models";
import type { loader } from "./list";

const classificationTypeOptions = [
  { key: "E", text: "E" },
  { key: "S", text: "S" }
];

export async function action({ request }: ActionFunctionArgs) {
  return await handleCUD<TaxonomySpeciesDocumentItem>(
    request,
    (formData) => {
      const formDataEntries = Object.fromEntries(formData);

      const postData: Partial<TaxonomySpeciesDocumentItem> = {
        ...formDataEntries,
        speciesId: parseOptionalNumber(formData, "speciesId"),
        isValid: parseCheckboxBoolean(formData, "isValid")
      } as Partial<TaxonomySpeciesDocumentItem>;

      if (!postData.documentTypeCode) {
        postData.documentTypeCode = undefined;
      }

      return postData;
    },
    "api/documentspecies",
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

  const [selectedItem, setSelectedItem] = useState<TaxonomySpeciesDocumentItemWithFlatRelatedData | undefined>(undefined);
  const [changingValues, setChangingValues] = useState(isNew);

  const editDisabled = !changingValues || fetcher.state !== "idle";

  useEffect(() => {
    const actionSuccess = fetcher.state === "idle" && fetcher.data?.success;
    if (!actionSuccess) return;

    setFormKey(Date.now().toString());

    switch (fetcher.data?.action) {
      case "delete":
        navigate(`/records/species/${outletContext.speciesId}/documents${location.search}`);
        break;
      case "insert":
        navigate(`/records/species/${outletContext.speciesId}/documents/${fetcher.data.changeResult?.id}${location.search}`, { replace: true });
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
        speciesId: outletContext.speciesId,
        isValid: true
      } as TaxonomySpeciesDocumentItemWithFlatRelatedData);
    }

    setFormKey(Date.now().toString());
  }, [itemId, outletContext.items, mode]);

  if (!selectedItem) {
    return null;
  }

  return (
    <Card
      key={`${formKey}-${changingValues}`}
      className="rounded-none border bg-card text-card-foreground shadow-none"
    >
      <fetcher.Form method="POST" className="flex flex-col h-full">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>
          <fieldset className="flex flex-row gap-4 p-2 items-end bg-secondary">
            <TextField
              name="code"
              defaultValue={outletContext.speciesInfo?.code}
              className="w-16"
              isDisabled
            >
              <Label>Kód</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              className="w-48 grow"
              name="nameLat"
              defaultValue={outletContext.speciesInfo?.nameLat}
              isDisabled
            >
              <Label>Latinsky</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <TextField
              className="w-48 grow"
              name="nameCz"
              defaultValue={outletContext.speciesInfo?.nameCz}
              isDisabled
            >
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
              className="w-16"
              isDisabled
              isLoading={false}
            >
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>
          </fieldset>

          <div className="flex">
            {selectedItem && (
              <SpeciesNavigation
                genusId={outletContext.speciesInfo!.taxonomyGenusId}
                speciesId={selectedItem.speciesId}
                activePage="documents"
              />
            )}
            <div className="grow"></div>
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
            disabled={editDisabled}
            className="grid grid-cols-4 gap-2 p-2"
          >
            <TextField
              name="number"
              defaultValue={selectedItem?.number}
              className="col-span-2"
              autoFocus
            >
              <Label>Číslo</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <ZooFormatDateField
              name="date"
              label="Datum"
              defaultValue={selectedItem.date || ""}
              errorMessage={fetcher.data?.validationErrors?.date?.at(0)}>
            </ZooFormatDateField>

            <div></div>

            <JollyComboBox
              name="documentTypeCode"
              label="Druh"
              defaultItems={outletContext.documentTypes}
              defaultSelectedKey={selectedItem?.documentTypeCode}
              isLoading={false}
            >
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>

            <div></div>

            <Checkbox
              name="isValid"
              defaultSelected={selectedItem?.isValid}
              isDisabled={editDisabled}
            >
              Platný
            </Checkbox>

            <div></div>

            <TextField
              name="note"
              defaultValue={selectedItem?.note}
              className="col-span-4"
            >
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <input type="hidden" name="id" value={selectedItem?.id ?? ''} />
            <input type="hidden" name="speciesId" value={selectedItem?.speciesId ?? outletContext.speciesId} />
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
              `/records/taxonomy-hierarchy/species/${outletContext.speciesId}/documents/${itm.id}${location.search}`
            }
          />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
