import { CalendarDate, parseDate } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import React, { useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, data, SubmitTarget, useActionData, useNavigate, useNavigation, useOutletContext, useSubmit } from "react-router";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName, requireLoggedInUser } from "~/.server/user-session";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { JollyDatePicker } from "~/components/ui/datepicker";
import { DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { FieldError, Label } from "~/components/ui/field";
import { Input, TextArea, TextField } from "~/components/ui/textfield";
import { fetchJson } from "~/lib/fetch";
import { normalizeAttributesAndSpecimens } from "./helpers";
import { JOURNAL_ACTION_TYPE_EUTHANASIA, JOURNAL_ACTION_TYPE_MARKING, JOURNAL_ACTION_TYPE_SEX, JOURNAL_ACTION_TYPE_WEIGHT, JOURNAL_ENTRY_TYPES, JournalDetailOutletContext, JournalEntryAttribute, JournalEntryInsertRequest, JournalEntrySpecimen, JournalEntryType, SpeciesItem, SpecimenOption } from "./models";

export async function action({ request }: ActionFunctionArgs) {
  await requireLoggedInUser(request);
  const userName = await getUserName(request);

  const insertRequest = await request.json() as { entry: JournalEntryInsertRequest };

  const normalizedData = normalizeAttributesAndSpecimens(insertRequest.entry);

  const apiRequest = {
    ...insertRequest.entry,
    ...normalizedData,
    authorName: userName,
    modifiedBy: userName,
    note: insertRequest.entry.note ? insertRequest.entry.note : undefined
  };

  const response = await apiCall(
    'api/JournalEntries',
    'POST',
    JSON.stringify(apiRequest),
    pziConfig
  );

  const parsedResponse = await processResponse<{ id: number }>(response);

  return data({
    success: parsedResponse.success,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  });
}

export default function JournalEntriesNew() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const outletData = useOutletContext<JournalDetailOutletContext>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  const [entryDate, setEntryDate] = useState<CalendarDate>(parseDate(new Date().toISOString().split('T')[0]));
  const [entryType, setEntryType] = useState<JournalEntryType>('Bio');
  const [actionTypeCode, setActionTypeCode] = useState<string | undefined>(undefined);
  const [districtId, setDistrictId] = useState<number | undefined>(undefined);
  const [speciesId, setSpeciesId] = useState<number | undefined>(undefined);
  const [note, setNote] = useState<string>('');

  const speciesQueryData = useQuery({
    queryKey: ['journal-form-species', districtId],
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

  const [attributes, setAttributes] = useState<JournalEntryAttribute[]>([]);
  const [specimens, setSpecimens] = useState<JournalEntrySpecimen[]>([]);

  const avaliableEntryActions = (entryType === 'Bio'
    ? outletData.baseData?.bioActionTypesInsert
    : entryType === 'Movement'
      ? outletData.baseData?.movementActionTypesInsert
      : []) || [];

  const availableDistricts = outletData.baseData?.districtsInsert || [];
  const availableSpecies = speciesQueryData.isLoading
    ? []
    : speciesQueryData.data || [];

  const availableSpecimensQueryData = useQuery({
    queryKey: ['journal-form-specimens', districtId, speciesId],
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

  const availableSpecimens = (availableSpecimensQueryData.data || [])
    .filter((so) => !specimens.some(({ specimenId }) => specimenId === so.id));

  React.useEffect(() => {
    if (actionData?.success) {
      navigate(`/journal/journal-entries${location.search}`, { replace: true });
    }
  }, [actionData?.success]);

  return (
    <DialogOverlay
      isOpen={true}
      onOpenChange={() => navigate(`/journal/journal-entries${location.search}`, { replace: true })}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nový záznam</DialogTitle>
        </DialogHeader>

        <FormValidationContext.Provider value={actionData?.validationErrors || {}}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:grid-cols-3">
            <JollyComboBox
              name="entryType"
              label="Typ záznamu"
              items={JOURNAL_ENTRY_TYPES}
              selectedKey={entryType}
              onSelectionChange={(key) => {
                if (key && key !== entryType) {
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
                  setActionTypeCode(key as string);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem id={item.code} key={item.code}>{item.displayName}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              name="organizationLevelId"
              label="Rajon"
              defaultItems={availableDistricts}
              selectedKey={districtId}
              onSelectionChange={(key) => {
                if (key && key !== districtId) {
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
                  setSpeciesId(key as number);
                  setSpecimens([]);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem id={item.id} key={item.id}>{`${item.nameLat}${item.nameCz ? ` (${item.nameCz})` : ''}`}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              name="note"
              value={note}
              onChange={setNote}>
              <Label>Poznámka (hlavní)</Label>
              <TextArea />
              <FieldError />
            </TextField>

            {/* NOTE: Additional attributes can ge here when they are defined */}
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

        <div className="w-full flex justify-center mt-6 px-4">
          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full max-w-[600px] justify-center">
            <Button
              type="submit"
              className="w-full md:w-auto"
              isDisabled={isNavigating}
              onClick={() => {
                const submitItem = {
                  entry: {
                    attributes,
                    specimens,
                    entryType,
                    organizationLevelId: districtId,
                    speciesId,
                    entryDate: entryDate.toString().replaceAll('-', '/'),
                    actionTypeCode,
                    note
                  }
                };

                submit(
                  submitItem as unknown as SubmitTarget,
                  { encType: "application/json", method: 'POST' }
                );
              }}>
              Uložit
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onPress={() => {
                navigate(`/journal/journal-entries${location.search}`, { replace: true });
              }}>
              Zrušit
            </Button>
          </div>
        </div>

      </DialogContent>
    </DialogOverlay>
  );
}
