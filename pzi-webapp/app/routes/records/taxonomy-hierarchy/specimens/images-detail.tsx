import { HeartIcon, LockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, data, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { apiDelete, apiEdit, apiInsert } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";
import { ItemListNavigation } from "~/components/common/item-list-navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { loader, SpecimenImageItem, SpecimenImageUpdateItem } from "./images-list";
import { ChangeActionResult } from "~/shared/models";
import { SpecimenHeaderDetail, SpecimenNavigation } from "./controls";

const getImageErrorResponse = (postData: Partial<SpecimenImageUpdateItem>, imageError: string) => {
  return {
    action: "insert",
    success: false,
    formValues: postData,
    changeResult: undefined,
    validationWarnings: undefined,
    validationErrors: {
      "image": [imageError]
    }
  } as ChangeActionResult<SpecimenImageUpdateItem, Partial<SpecimenImageUpdateItem>>;
};

export async function action({ request }: ActionFunctionArgs) {
  const apiUrl = 'api/SpecimenImages';

  const userName = await getUserName(request);
  const formData = await request.formData();

  const formAction = String(formData.get('formAction'));

  switch (formAction) {
    case 'insert': {
      const postData: Partial<SpecimenImageUpdateItem> = Object.fromEntries(formData);

      const image = formData.get("image") as File | null;

      if (image === null || image.size === 0) {
        return getImageErrorResponse(postData, "Hodnota je povinná");
      }

      if (image.size > 750000) {
        return getImageErrorResponse(postData, "Nahraný soubor je příliš velký.");
      }

      if (!image.type || !image.type.startsWith('image')) {
        return getImageErrorResponse(postData, "Nahraný soubor musí být obrázek.");
      }

      const imageBytes = await image?.arrayBuffer();

      postData.image = Buffer.from(imageBytes!).toString("base64");
      postData.contentType = image!.type;

      const result = await apiInsert<SpecimenImageUpdateItem, Partial<SpecimenImageUpdateItem>>(
        apiUrl,
        postData,
        userName!,
        pziConfig
      );

      return data(result);
    }

    case 'edit': {
      const postData: Partial<SpecimenImageUpdateItem> = Object.fromEntries(formData);
      postData.image = undefined;

      const result = await apiEdit<SpecimenImageUpdateItem, Partial<SpecimenImageUpdateItem>>(
        `${apiUrl}/${postData.id}`,
        postData,
        userName!,
        pziConfig
      );

      return data(result);
    }

    case 'delete': {
      const postData: Partial<SpecimenImageUpdateItem> = Object.fromEntries(formData);
      postData.image = undefined;

      const result = await apiDelete<SpecimenImageUpdateItem, Partial<SpecimenImageUpdateItem>>(
        `${apiUrl}/${postData.id}`,
        postData,
        userName!,
        pziConfig
      );

      return data(result);
    }

    default: {
      throw new Error('Unsupported action');
    }
  }
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

  const [selectedItem, setSelectedItem] = useState<SpecimenImageItem | undefined>(undefined);
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
        navigate(`/records/specimens/${outletContext.specimenId}/images${location.search}`);
        break;
      }
      case 'insert': {
        navigate(`/records/specimens/${outletContext.specimenId}/images/${fetcher.data.changeResult?.id}${location.search}`);
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
        specimenId: 0,
        label: '',
        description: '',
      } as SpecimenImageItem);
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
      <fetcher.Form method="POST" className="flex flex-col h-full" encType="multipart/form-data">
        <FormValidationContext.Provider value={fetcher.data?.validationErrors || {}}>
          <fieldset
            disabled={editDisabled}
            className="flex flex-wrap gap-2 p-2 bg-secondary">
            <SpecimenHeaderDetail specimen={outletContext.specimenInfo!} />
          </fieldset>

          <div className="flex">
            <SpecimenNavigation
              speciesId={outletContext.specimenInfo!.speciesId}
              specimenId={outletContext.specimenId}
              activePage="images" />

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

          <div className="p-2">
            {mode === 'edit' && (
              <div className="flex mb-4 justify-center">
                <img src={`/api/specimen-image/${selectedItem.id}`}
                  alt={selectedItem.label}
                  className="max-h-64 max-w-full" />
              </div>
            )}
          </div>

          <fieldset
            className="grid grid-cols-1 gap-2 p-2"
            disabled={editDisabled}>
            <TextField
              name="label"
              defaultValue={selectedItem.label}
              className="flex-1">
              <Label>Název</Label>
              <Input type="text" autoFocus={true} />
              <FieldError />
            </TextField>

            <TextField
              name="description"
              defaultValue={selectedItem.description}
              className="col-span-1">
              <Label>Popis</Label>
              <TextArea />
              <FieldError />
            </TextField>

            {mode === 'insert' && (
              <div>
                <Label>Obrázek</Label>
                <Input type="file" accept="image/*" name="image" className="h-9 w-full" />
              </div>
            )}

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
                    navigate(`/records/specimens/${outletContext.specimenId}/images${location.search}`);
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
              return `/records/specimens/${outletContext.specimenId}/images/${itm.id}${location.search}`
            }} />
        </FormValidationContext.Provider>
      </fetcher.Form>
    </Card>
  );
}
