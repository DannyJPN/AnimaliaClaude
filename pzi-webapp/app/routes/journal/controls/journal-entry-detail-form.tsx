import { CalendarDate } from "@internationalized/date";
import { JOURNAL_ACTION_TYPE_EUTHANASIA, JOURNAL_ACTION_TYPE_MARKING, JOURNAL_ACTION_TYPE_SEX, JOURNAL_ACTION_TYPE_WEIGHT, JOURNAL_ENTRY_TYPES, JournalActionTypeCodes, JournalBaseDataResult, JournalEntryAttribute, JournalEntrySpecimen, JournalEntryType, SpeciesItem, SpecimenOption } from "../models";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "~/lib/fetch";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { JollyDatePicker } from "~/components/ui/datepicker";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { FieldError, Label } from "~/components/ui/field";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { FormValidationContext } from "react-aria-components";

export type JournalEntryDetailFormProps = {
  baseData: JournalBaseDataResult | undefined,
  entryDate: CalendarDate,
  entryType: JournalEntryType,
  actionTypeCode: string | undefined,
  districtId: number | undefined,
  speciesId: number | undefined,
  note: string,
  attributes: JournalEntryAttribute[],
  specimens: JournalEntrySpecimen[],
  formModified: boolean,
  authorName: string | undefined,
  createdAt: string | undefined,
  formErrors: Record<string, string[]> | undefined,
  setEntryDate: (v: CalendarDate) => void,
  setEntryType: (v: JournalEntryType) => void,
  setActionTypeCode: (v: JournalActionTypeCodes | undefined) => void,
  setDistrictId: (v: number | undefined) => void,
  setSpeciesId: (v: number | undefined) => void,
  setNote: (v: string) => void,
  setAttributes: (v: JournalEntryAttribute[]) => void,
  setSpecimens: (v: JournalEntrySpecimen[]) => void,
  setFormModified: (v: boolean) => void
};

export function JournalEntryDetailForm(props: JournalEntryDetailFormProps) {
  const {
    baseData,
    formModified,
    entryDate,
    entryType,
    actionTypeCode,
    districtId,
    speciesId,
    note,
    attributes,
    specimens,
    formErrors,
    setEntryDate,
    setEntryType,
    setActionTypeCode,
    setDistrictId,
    setSpeciesId,
    setNote,
    setAttributes,
    setSpecimens,
    setFormModified
  } = props;

  const speciesQueryData = useQuery({
    queryKey: ['journal-form-edit-species', districtId],
    queryFn: async ({ signal }) => {
      if (districtId === undefined) {
        return [];
      }

      const result = await fetchJson<SpeciesItem[]>(
        '/journal/journal-species-by-district',
        {
          method: 'POST',
          body: JSON.stringify({
            districtId
          }),
          signal: signal
        }
      );

      return result;
    }
  });

  const availableSpecimensQueryData = useQuery({
    staleTime: 100,
    queryKey: ['journal-form-edit-specimens', districtId, speciesId],
    queryFn: async ({ signal }) => {
      if (speciesId === undefined || districtId === undefined) {
        return [];
      }

      const result = await fetchJson<SpecimenOption[]>(
        '/journal/journal-specimens',
        {
          method: 'POST',
          body: JSON.stringify({
            districtId,
            speciesId
          }),
          signal: signal
        }
      );

      return result;
    }
  });

  const avaliableEntryActions = (entryType === 'Bio'
    ? baseData?.bioActionTypesInsert
    : entryType === 'Movement'
      ? baseData?.movementActionTypesInsert
      : []) || [];

  const availableDistricts = baseData?.districtsEdit || [];

  const availableSpecies = speciesQueryData.isLoading
    ? []
    : speciesQueryData.data || [];

  const availableSpecimens = (availableSpecimensQueryData.data || [])
    .filter((so) => !specimens.some(({ specimenId }) => specimenId === so.id));

  return (
    <Card className="mb-2">
      <CardContent className="p-2">
        <FormValidationContext.Provider value={formErrors || {}}>


          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:grid-cols-4 mb-2">

            <JollyComboBox
              name="entryType"
              label="Typ záznamu"
              items={JOURNAL_ENTRY_TYPES}
              selectedKey={entryType}
              onSelectionChange={(key) => {
                if (key && key !== entryType) {
                  setFormModified(true);

                  setEntryType(key as JournalEntryType);
                  setActionTypeCode(undefined);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem key={item.key}>{item.text}</ComboboxItem>}
            </JollyComboBox>

            <JollyDatePicker
              name="entryDate"
              label="Datum záznamu"
              value={entryDate}
              onChange={(v) => {
                if (v) {
                  setFormModified(true);

                  setEntryDate(v);
                }
              }}
            />

            <JollyComboBox
              name="actionTypeCode"
              label="Akce"
              defaultItems={avaliableEntryActions}
              selectedKey={actionTypeCode}
              onSelectionChange={(key) => {
                if (key && key !== actionTypeCode) {
                  setFormModified(true);

                  setActionTypeCode(key as JournalActionTypeCodes);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem id={item.code} key={item.code}>{item.displayName}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="districtId"
              label="Rajon"
              defaultItems={availableDistricts}
              selectedKey={districtId}
              onSelectionChange={(key) => {
                if (key && key !== districtId) {
                  setFormModified(true);

                  setDistrictId(key as number);
                  setSpeciesId(undefined);
                  setSpecimens([]);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem id={item.id} key={item.id}>{item.name}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="speciesId"
              label="Druh"
              defaultItems={availableSpecies}
              selectedKey={speciesId}
              isDisabled={districtId === undefined}
              onSelectionChange={(key) => {
                if (key && key !== speciesId) {
                  setFormModified(true);

                  setSpeciesId(key as number);
                  setSpecimens([]);
                }
              }}
              isLoading={speciesQueryData.isLoading}>
              {(item) => <ComboboxItem id={item.id} key={item.id}>{`${item.nameLat}${item.nameCz ? ` (${item.nameCz})` : ''}`}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="note"
              value={note}
              onChange={(v) => {
                setFormModified(true);
                setNote(v);
              }}>
              <Label>Poznámka (hlavní)</Label>
              <TextArea />
              <FieldError />
            </TextField>

            <div>
              <div className="text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 group-data-[invalid]:text-destructive">
                Autor
              </div>
              <div className="flex w-full py-2 text-sm ring-offset-background">
                {props.authorName}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 group-data-[invalid]:text-destructive">
                Datum vytvoření
              </div>
              <div className="flex w-full py-2 text-sm ring-offset-background">
                {props.createdAt}
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="p-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold leading-none tracking-tight">
                  Exempláře
                </CardTitle>

                <DialogTrigger>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isDisabled={availableSpecimens.length === 0}>
                    <PlusIcon className="size-4 mr-2" />
                    Přidat
                  </Button>

                  <DialogOverlay>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      {({ close }) => (
                        <>
                          <DialogHeader>
                            <DialogTitle>Zvolte exempláře</DialogTitle>
                          </DialogHeader>

                          <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                            {availableSpecimens.map((specimen) => {
                              return (
                                <div key={specimen.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer grow mb-1">
                                  <div>
                                    <div className="font-medium">{specimen.accessionNumber}{specimen.genderTypeCode} • {specimen.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Zims: {specimen.zims} • Narozen: {specimen.birthDate}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600"
                                    onClick={() => {
                                      setFormModified(true);

                                      setSpecimens([
                                        ...specimens,
                                        {
                                          specimenId: specimen.id,
                                          specimenAccessionNumber: specimen.accessionNumber,
                                          specimenBirthDate: specimen.birthDate,
                                          specimenName: specimen.name,
                                          specimenZims: specimen.zims,
                                          specimenGenderTypeCode: specimen.genderTypeCode,
                                          note: undefined
                                        }
                                      ]);

                                      if (availableSpecimens.length === 1) {
                                        close();
                                      }
                                    }}>
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </DialogOverlay>

                </DialogTrigger>
              </div>
            </CardHeader>

            <CardContent className="p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {specimens.map((specimen, idx) => {
                const genderAttrValue = specimen.attributes?.find(({ attributeTypeCode }) => attributeTypeCode === 'GENDER')?.attributeValue || '';
                const weightAttrValue = specimen.attributes?.find(({ attributeTypeCode }) => attributeTypeCode === 'WEIGHT')?.attributeValue || '';
                const chipAttrValue = specimen.attributes?.find(({ attributeTypeCode }) => attributeTypeCode === 'CHIP_CODE')?.attributeValue || '';
                const euthanasiaAttrValue = specimen.attributes?.find(({ attributeTypeCode }) => attributeTypeCode === 'EUTHANASIA_REASON')?.attributeValue || '';

                return (
                  <div key={specimen.specimenId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer mb-1">

                    <div className="grow">
                      <div className="font-medium">{specimen.specimenAccessionNumber}{specimen.specimenGenderTypeCode} • {specimen.specimenName}</div>
                      <div className="text-sm text-muted-foreground">
                        Zims: {specimen.specimenZims} • Narozen: {specimen.specimenBirthDate}
                      </div>

                      <TextField
                        value={specimen.note || ''}
                        onChange={(v) => {
                          setFormModified(true);

                          const specimensUpdate = [
                            ...specimens
                          ];

                          specimensUpdate[idx] = {
                            ...specimen,
                            note: v
                          };

                          setSpecimens(specimensUpdate);
                        }}>
                        <Label>Poznámka</Label>
                        <TextArea />
                      </TextField>

                      {actionTypeCode === JOURNAL_ACTION_TYPE_SEX && (
                        <JollyComboBox
                          label="Pohlaví"
                          defaultItems={[{ id: 'M', value: 'M' }, { id: 'F', value: 'F' }]}
                          selectedKey={genderAttrValue}
                          isLoading={false}
                          onSelectionChange={(key) => {
                            setFormModified(true);

                            var updatedSpecimen: JournalEntrySpecimen = {
                              ...specimen,
                              attributes: [
                                ...(specimen.attributes || []).filter(({ attributeTypeCode }) => attributeTypeCode !== 'GENDER'),
                                { attributeTypeCode: 'GENDER', attributeValue: key as string }
                              ]
                            };

                            const specimensUpdate = [
                              ...specimens
                            ];

                            specimensUpdate[idx] = updatedSpecimen;

                            setSpecimens(specimensUpdate);
                          }}
                        >
                          {(item) => <ComboboxItem id={item.id} key={item.id} >{item.value}</ComboboxItem>}
                        </JollyComboBox>
                      )}

                      {actionTypeCode === JOURNAL_ACTION_TYPE_WEIGHT && (
                        <TextField
                          value={weightAttrValue}
                          onChange={(v) => {
                            setFormModified(true);

                            var updatedSpecimen: JournalEntrySpecimen = {
                              ...specimen,
                              attributes: [
                                ...(specimen.attributes || []).filter(({ attributeTypeCode }) => attributeTypeCode !== 'WEIGHT'),
                                { attributeTypeCode: 'WEIGHT', attributeValue: v }
                              ]
                            };

                            const specimensUpdate = [
                              ...specimens
                            ];

                            specimensUpdate[idx] = updatedSpecimen;

                            setSpecimens(specimensUpdate);
                          }}
                        >
                          <Label>Váha</Label>
                          <Input type="text" />
                          <FieldError />
                        </TextField>
                      )}

                      {actionTypeCode === JOURNAL_ACTION_TYPE_MARKING && (
                        <TextField
                          value={chipAttrValue}
                          onChange={(v) => {
                            setFormModified(true);

                            var updatedSpecimen: JournalEntrySpecimen = {
                              ...specimen,
                              attributes: [
                                ...(specimen.attributes || []).filter(({ attributeTypeCode }) => attributeTypeCode !== 'CHIP_CODE'),
                                { attributeTypeCode: 'CHIP_CODE', attributeValue: v }
                              ]
                            };

                            const specimensUpdate = [
                              ...specimens
                            ];

                            specimensUpdate[idx] = updatedSpecimen;

                            setSpecimens(specimensUpdate);
                          }}
                          className="w-24">
                          <Label>Čip</Label>
                          <Input type="text" />
                          <FieldError />
                        </TextField>
                      )}

                      {actionTypeCode === JOURNAL_ACTION_TYPE_EUTHANASIA && (
                        <JollyComboBox
                          label="Důvod"
                          defaultItems={[{ id: 'Management', value: 'Management' }, { id: 'Medicínsky', value: 'Medicínsky' }]}
                          selectedKey={euthanasiaAttrValue}
                          isLoading={false}
                          onSelectionChange={(key) => {
                            setFormModified(true);

                            var updatedSpecimen: JournalEntrySpecimen = {
                              ...specimen,
                              attributes: [
                                ...(specimen.attributes || []).filter(({ attributeTypeCode }) => attributeTypeCode !== 'EUTHANASIA_REASON'),
                                { attributeTypeCode: 'EUTHANASIA_REASON', attributeValue: key as string }
                              ]
                            };

                            const specimensUpdate = [
                              ...specimens
                            ];

                            specimensUpdate[idx] = updatedSpecimen;

                            setSpecimens(specimensUpdate);
                          }}
                        >
                          {(item) => <ComboboxItem id={item.id} key={item.id} >{item.value}</ComboboxItem>}
                        </JollyComboBox>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setFormModified(true);

                        setSpecimens(
                          specimens.filter((s) => s.specimenId !== specimen.specimenId)
                        );
                      }}>
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </FormValidationContext.Provider>
      </CardContent>
    </Card>
  );
}
