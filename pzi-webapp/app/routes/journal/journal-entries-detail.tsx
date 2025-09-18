import { CalendarDate, parseDate } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import React, { useState } from "react";
import { FormValidationContext } from "react-aria-components";
import { ActionFunctionArgs, data, LoaderFunctionArgs, SubmitTarget, useActionData, useLoaderData, useNavigate, useNavigation, useOutletContext, useSubmit } from "react-router";
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
import { JOURNAL_ACTION_TYPE_EUTHANASIA, JOURNAL_ACTION_TYPE_MARKING, JOURNAL_ACTION_TYPE_SEX, JOURNAL_ACTION_TYPE_WEIGHT, JOURNAL_ENTRY_TYPES, JournalDetailOutletContext, JournalEntry, JournalEntryAttribute, JournalEntrySpecimen, JournalEntryType, JournalEntryUpdateRequest, PagedResult, SpeciesItem, SpecimenOption } from "./models";
import { EnumerationType } from "~/shared/models";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const entryId = params.id;
  const userName = await getUserName(request);

  const apiParams = {
    paging: {
      pageIndex: 1,
      pageSize: 1
    },
    sorting: [],
    filtering: [
      { filterId: 'id', values: [entryId] }
    ],
    userName
  };

  const response = await apiCall(
    'api/JournalEntries/EntriesForUser',
    "POST",
    JSON.stringify(apiParams),
    pziConfig
  );

  const results = await processResponse<PagedResult<JournalEntry>>(response);

  if (!results.item || results.item.items.length === 0) {
    throw new Response('', { status: 404 });
  }

  const item = results.item.items[0];

  const canEdit = (item.allowedActions || []).includes("EDIT");
  const canDelete = (item.allowedActions || []).includes("DELETE");

  const canApprove = (item.allowedActions || []).includes("SEND_TO_REVIEW");
  const canClose = (item.allowedActions || []).includes("CLOSE");
  const canSolve = (item.allowedActions || []).includes("SOLVE");

  const formReadOnly = !canEdit && !canApprove && !canClose && !canSolve;

  return data({
    item,
    canEdit,
    canDelete,
    canApprove,
    canClose,
    canSolve,
    formReadOnly
  });
};

export async function action({ request }: ActionFunctionArgs) {
  await requireLoggedInUser(request);

  const userName = await getUserName(request);

  const actionRequest = await request.json() as {
    action: string,
    entry: JournalEntryUpdateRequest
  };

  if (actionRequest.action === 'DELETE') {
    const deleteRequest = {
      modifiedBy: userName
    };

    const response = await apiCall(
      `api/JournalEntries/${actionRequest.entry.id}`,
      'DELETE',
      JSON.stringify(deleteRequest),
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

  if (actionRequest.entry.formModified) {
    const normalizedData = normalizeAttributesAndSpecimens(actionRequest.entry);

    const updateApiRequest = {
      ...actionRequest.entry,
      ...normalizedData,
      modifiedBy: userName,
      note: actionRequest.entry.note ? actionRequest.entry.note : undefined
    };

    const response = await apiCall(
      `api/JournalEntries/${actionRequest.entry.id}`,
      'POST',
      JSON.stringify(updateApiRequest),
      pziConfig
    );

    const parsedResponse = await processResponse<{ id: number }>(response);

    if (!parsedResponse.success || actionRequest.action === 'EDIT') {
      return data({
        success: parsedResponse.success,
        changeResult: parsedResponse.item,
        validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
        validationErrors: convertErrorCodes(parsedResponse.validationErrors)
      });
    }
  }

  const apiRequest = {
    modifiedBy: userName
  };

  let response: Response;

  switch (actionRequest.action) {
    case 'SEND_TO_REVIEW': {
      response = await apiCall(
        `api/JournalEntries/${actionRequest.entry.id}/ToDocumentation`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    case 'CLOSE': {
      response = await apiCall(
        `api/JournalEntries/${actionRequest.entry.id}/ToDone`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    case 'SOLVE': {
      response = await apiCall(
        `api/JournalEntries/${actionRequest.entry.id}/ToProcessed`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    default: {
      return data({
        success: true,
        changeResult: { id: actionRequest.entry.id },
        validationWarnings: {},
        validationErrors: {}
      });
    }
  }

  const parsedResponse = await processResponse<{ id: number }>(response);

  return data({
    success: parsedResponse.success,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  });
}


export default function JournalEntryDetail() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const outletData = useOutletContext<JournalDetailOutletContext>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  const formReadOnly = loaderData.formReadOnly;

  const [formModified, setFormModified] = useState(false);

  const [entryDate, setEntryDate] = useState<CalendarDate>(parseDate(loaderData.item.entryDate.replaceAll('/', '-')));
  const [entryType, setEntryType] = useState<JournalEntryType>(loaderData.item.entryType);
  const [actionTypeCode, setActionTypeCode] = useState<string | undefined>(loaderData.item.actionTypeCode);
  const [districtId, setDistrictId] = useState<number | undefined>(loaderData.item.organizationLevelId);
  const [speciesId, setSpeciesId] = useState<number | undefined>(loaderData.item.speciesId);
  const [note, setNote] = useState<string>(loaderData.item.note || '');

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

  const [attributes, setAttributes] = useState<JournalEntryAttribute[]>(loaderData.item.attributes || []);
  const [specimens, setSpecimens] = useState<JournalEntrySpecimen[]>(loaderData.item.specimens || []);

  let avaliableEntryActions: EnumerationType[];

  if (formReadOnly) {
    avaliableEntryActions = [
      { code: loaderData.item.actionTypeCode, displayName: loaderData.item.actionTypeDisplayName }
    ];
  } else {
    avaliableEntryActions = (entryType === 'Bio'
      ? outletData.baseData?.bioActionTypesInsert
      : entryType === 'Movement'
        ? outletData.baseData?.movementActionTypesInsert
        : []) || [];
  }

  const availableDistricts = formReadOnly
    ? [{ id: loaderData.item.organizationLevelId, name: loaderData.item.organizationLevelName, level: 'district' }]
    : (outletData.baseData?.districtsInsert || []);

  const availableSpecies = speciesQueryData.isLoading
    ? []
    : speciesQueryData.data || [];

  const availableSpecimensQueryData = useQuery({
    queryKey: ['journal-form-edit-specimens', districtId, speciesId, formReadOnly],
    queryFn: async ({ signal }) => {
      if (formReadOnly) {
        return [];
      }

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

  const doSubmit = (actionType: string) => {
    const submitItem = {
      entry: {
        id: loaderData.item.id,
        attributes,
        specimens,
        entryType,
        organizationLevelId: districtId,
        speciesId,
        entryDate: entryDate.toString().replaceAll('-', '/'),
        actionTypeCode,
        note,
        formModified
      },
      action: actionType
    };

    submit(
      submitItem as unknown as SubmitTarget,
      { encType: "application/json", method: 'POST' }
    );
  }

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
          <DialogTitle>Detail záznamu</DialogTitle>
        </DialogHeader>

        <FormValidationContext.Provider value={actionData?.validationErrors || {}}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:grid-cols-3">

            <JollyComboBox
              label="Typ záznamu"
              isReadOnly={loaderData.formReadOnly}
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
              isReadOnly={loaderData.formReadOnly}
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
              label="Akce"
              isReadOnly={loaderData.formReadOnly}
              defaultItems={avaliableEntryActions}
              selectedKey={actionTypeCode}
              onSelectionChange={(key) => {
                if (key && key !== actionTypeCode) {
                  setFormModified(true);

                  setActionTypeCode(key as string);
                }
              }}
              isLoading={false}>
              {(item) => <ComboboxItem id={item.code} key={item.code}>{item.displayName}</ComboboxItem>}
            </JollyComboBox>

            <JollyComboBox
              label="Rajon"
              isReadOnly={loaderData.formReadOnly}
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
              label="Druh"
              isReadOnly={loaderData.formReadOnly}
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
              isLoading={false}>
              {(item) => <ComboboxItem id={item.id} key={item.id}>{`${item.nameLat}${item.nameCz ? ` (${item.nameCz})` : ''}`}</ComboboxItem>}
            </JollyComboBox>

            <TextField
              isReadOnly={loaderData.formReadOnly}
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
                {loaderData.item.authorName}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70 group-data-[invalid]:text-destructive">
                Datum vytvoření
              </div>
              <div className="flex w-full py-2 text-sm ring-offset-background">
                {loaderData.item.createdAt}
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
                  {!loaderData.formReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isDisabled={availableSpecimens.length === 0}>
                      <PlusIcon className="size-4 mr-2" />
                      Přidat
                    </Button>
                  )}

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
                        isReadOnly={loaderData.formReadOnly}
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
                          isReadOnly={loaderData.formReadOnly}
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
                          isReadOnly={loaderData.formReadOnly}
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
                          isReadOnly={loaderData.formReadOnly}
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
                          isReadOnly={loaderData.formReadOnly}
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

                    {!loaderData.formReadOnly && (
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
                    )}

                  </div>
                );
              })}
            </CardContent>
          </Card>

        </FormValidationContext.Provider>

        <div className="w-full flex justify-center mt-6 px-4">
          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full max-w-[600px] justify-center">
            {loaderData.canEdit && (
              <Button
                type="submit"
                className="w-full md:w-auto"
                isDisabled={isNavigating}
                onClick={() => {
                  doSubmit('EDIT');
                }}>
                Uložit
              </Button>
            )}

            {loaderData.canDelete && (
              <Button
                type="button"
                variant="destructive"
                className="w-full md:w-auto"
                isDisabled={isNavigating}
                onClick={() => {
                  doSubmit('DELETE');
                }}>
                Smazat
              </Button>
            )}

            {loaderData.canApprove && (
              <Button
                type="button"
                variant="secondary"
                className="w-full md:w-auto"
                isDisabled={isNavigating}
                onClick={() => {
                  doSubmit('SEND_TO_REVIEW');
                }}>
                Schválit
              </Button>
            )}

            {loaderData.canClose && (
              <Button
                type="button"
                variant="secondary"
                className="w-full md:w-auto"
                isDisabled={isNavigating}
                onClick={() => {
                  doSubmit('CLOSE');
                }}>
                Ukončit
              </Button>
            )}

            {loaderData.canSolve && (
              <Button
                type="button"
                variant="secondary"
                className="w-full md:w-auto"
                isDisabled={isNavigating}
                onClick={() => {
                  doSubmit('SOLVE');
                }}>
                Zpracovat
              </Button>
            )}

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
