import { useFetcher } from "react-router";
import { action as createMassSpecimenRecords } from '../operations/create-mass-specimen-records';
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { FormValidationContext } from "react-aria-components";

export function CreateMassSpecimenRecords(props: {
  currentParentId: number
  onClose: () => void
}) {
  const submitFetcher = useFetcher<typeof createMassSpecimenRecords>();

  const actionTypesQuery = useQuery({
    queryKey: ['records-species-record-action-types'],
    queryFn: async () => {
      const result = await fetchJson<SelectItemType<string, string>[]>(
        '/api/record-action-types',
        {
          method: 'GET'
        }
      );

      return result;
    }
  });

  useEffect(() => {
    if (submitFetcher.data?.success) {
      props.onClose();
    }
  }, [submitFetcher.state, submitFetcher.data]);

  return (
    <DialogOverlay
      isOpen={true}
      onOpenChange={props.onClose}>

      <DialogContent
        side="right" className="w-full sm:max-w-[75%] overflow-scroll">
        <submitFetcher.Form
          method="post"
          action="/records/species/operations/create-mass-specimen-records"
          className="grid grid-cols-4 gap-2">

          <FormValidationContext.Provider value={submitFetcher.data?.validationErrors || {}}>
            <input type="hidden" value={props.currentParentId} name="speciesId" />

            <TextField
              name="date"
              className="col-span-2">
              <Label>Datum</Label>
              <Input type="text" />
              <FieldError />
            </TextField>

            <JollyComboBox
              name="actionTypeCode"
              label="Výkon"
              defaultItems={actionTypesQuery.data}
              allowsEmptyCollection
              isLoading={false}
              className="col-span-2">
              {(item) => <ComboboxItem key={item.key} >{item.text}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="note"
              className="col-span-4">
              <Label>Poznámka</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <div className="flex gap-2 mt-4 col-span-4">
              <Button
                type="submit"
                size="sm"
                isDisabled={submitFetcher.state !== 'idle'}>
                Uložit
              </Button>
            </div>
          </FormValidationContext.Provider>
        </submitFetcher.Form>
      </DialogContent>
    </DialogOverlay>
  );
}
