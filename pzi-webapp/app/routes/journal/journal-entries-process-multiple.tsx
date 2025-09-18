import { CalendarDate, parseDate } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActionFunctionArgs, data, LoaderFunctionArgs, SubmitTarget, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName, getUserPermissions, requireLoggedInUser } from "~/.server/user-session";
import { Button } from "~/components/ui/button";
import { fetchJson } from "~/lib/fetch";
import { JournalEntryDetailForm } from "./controls/journal-entry-detail-form";
import { JournalActionTypeCodes, JournalApiApproveEntry, JournalBaseDataResult, JournalEntry, JournalEntryAttribute, JournalEntrySpecimen, JournalEntryType, JournalEntryUpdateRequest, PagedResult } from "./models";
import { normalizeAttributesAndSpecimens } from "./helpers";
import React from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userName = await getUserName(request);
  const searchParams = new URL(request.url).searchParams;
  const itemIds = searchParams.getAll('ids');

  if (itemIds.length === 0) {
    return data({
      items: [] as JournalEntry[],
      canEdit: false,
      canClose: false,
      canApprove: false,
      canSolve: false
    });
  }

  const response = await apiCall(
    'api/JournalEntries/EntriesForUser',
    'POST',
    JSON.stringify({
      userName,
      paging: {
        pageIndex: 1,
        pageSize: 1000
      },
      filtering: [
        {
          filterId: 'id',
          values: itemIds
        }
      ]
    }),
    pziConfig
  );

  const result = await processResponse<PagedResult<JournalEntry>>(response);

  const items = result.item?.items || [];

  const canEdit = items.every((item) => (item.allowedActions || []).includes("EDIT"));
  const canApprove = items.every((item) => (item.allowedActions || []).includes("SEND_TO_REVIEW"));
  const canClose = items.every((item) => (item.allowedActions || []).includes("CLOSE"));
  const canSolve = items.every((item) => (item.allowedActions || []).includes("SOLVE"));

  return data({
    items: items,
    canEdit,
    canClose,
    canApprove,
    canSolve
  });
}

type EntryFormData = {
  formModified: boolean,
  entryDate: CalendarDate,
  entryType: JournalEntryType,
  actionTypeCode: JournalActionTypeCodes | undefined,
  districtId: number | undefined,
  speciesId: number | undefined,
  note: string,
  attributes: JournalEntryAttribute[],
  specimens: JournalEntrySpecimen[],
  authorName: string | undefined,
  createdAt: string | undefined,
};

export async function action({ request }: ActionFunctionArgs) {
  await requireLoggedInUser(request);
  const userName = await getUserName(request);

  const actionRequest = await request.json() as {
    action: string,
    entries: JournalApiApproveEntry[]
  };

  const apiRequest = {
    action: actionRequest.action,
    modifiedBy: userName,
    items: actionRequest.entries.map((e) => {
      const normalizedData = normalizeAttributesAndSpecimens(e);

      return {
        ...e,
        ...normalizedData,
      };
    })
  }

  const response = await apiCall(
    "api/JournalEntries/ProcessApproval",
    'POST',
    JSON.stringify(apiRequest),
    pziConfig
  );

  const parsedResponse = await processResponse<{ id: number }[]>(response);

  const itemValidationErrors = Object.keys(parsedResponse.validationErrors || {})
    .filter((key) => key.startsWith("Items["))
    .reduce((acc, key) => {
      const [id, rest] = key.replace('Items[', '').split("].");

      if (!acc[id]) {
        acc[id] = {};
      }

      acc[id][rest] = (parsedResponse.validationErrors || {})[key];

      return acc;
    }, {} as Record<string, Record<string, { code: string, message: string }[]>>);

  const itemValidationErrorsConverted = Object.keys(itemValidationErrors)
    .reduce((acc, key) => {
      acc[key] = convertErrorCodes(itemValidationErrors[key]);
      return acc;
    }, {} as Record<string, Record<string, string[]> | undefined>);

  return data({
    success: parsedResponse.success,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors),
    itemValidationErrors: itemValidationErrorsConverted
  });
}

function toEntryFormDataDictionary(entries: JournalEntry[]): Record<number, EntryFormData> {
  return entries.reduce((acc, entry) => {
    acc[entry.id] = {
      formModified: false,
      entryDate: parseDate(entry.entryDate.replaceAll('/', '-')),
      entryType: entry.entryType,
      actionTypeCode: entry.actionTypeCode,
      districtId: entry.organizationLevelId,
      speciesId: entry.speciesId,
      note: entry.note || '',
      attributes: entry.attributes || [],
      specimens: entry.specimens || [],
      authorName: entry.authorName,
      createdAt: entry.createdAt
    };

    return acc;
  }, {} as Record<number, EntryFormData>);
}

export default function JournalEntruesProcessMultiple() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const actionData = useActionData<typeof action>();

  const baseDataQuery = useQuery({
    queryKey: ['journal-base-data'],
    queryFn: async () => {
      const result = await fetchJson<JournalBaseDataResult>(
        '/journal/journal-base-data',
        {
          method: 'POST'
        }
      );

      return result;
    }
  });

  const [entriesData, setEntriesData] = useState(toEntryFormDataDictionary(loaderData.items));

  const entryIds = useMemo(() => {
    return loaderData.items.map((e) => e.id);
  }, [loaderData.items]);

  const doSubmit = (actionType: string) => {
    const entries: JournalApiApproveEntry[] = Object.entries(entriesData)
      .map((v) => {
        return {
          id: Number(v[0])!,
          attributes: v[1].attributes,
          specimens: v[1].specimens,
          entryType: v[1].entryType,
          organizationLevelId: v[1].districtId!,
          speciesId: v[1].speciesId!,
          entryDate: v[1].entryDate.toString().replaceAll('-', '/'),
          actionTypeCode: v[1].actionTypeCode!,
          note: v[1].note,
          isUpdated: v[1].formModified
        };
      });

    const submitItem = {
      entries: entries,
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
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="@container">
        <div className="min-h-[72px] w-full content-center flex-wrap p-2 bg-secondary">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">Hromadné zpracování</h2>
          </div>
        </div>
      </div>

      <div className="p-2 gap-2">
        {entryIds.map((entryId) => {
          return (
            <JournalEntryDetailForm
              key={entryId}
              setEntryDate={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    entryDate: v
                  }
                }));
              }}
              setEntryType={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    entryType: v
                  }
                }));
              }}
              setActionTypeCode={(v: JournalActionTypeCodes | undefined) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    actionTypeCode: v
                  }
                }));
              }}
              setDistrictId={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    districtId: v
                  }
                }));
              }}
              setSpeciesId={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    speciesId: v
                  }
                }));
              }}
              setNote={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    note: v
                  }
                }));
              }}
              setAttributes={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    attributes: v
                  }
                }));
              }}
              setSpecimens={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    specimens: v
                  }
                }));
              }}
              setFormModified={(v) => {
                setEntriesData((prev) => ({
                  ...prev,
                  [entryId]: {
                    ...prev[entryId],
                    formModified: v
                  }
                }));
              }}
              baseData={baseDataQuery.data}
              {...entriesData[entryId]}
              formErrors={actionData?.itemValidationErrors[entryId]}
            />
          );
        })}
      </div>

      <div className="w-full flex justify-center mt-6 px-4 pb-4 gap-2">
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
            navigate(`/journal/journal-entries`);
          }}>
          Zrušit
        </Button>
      </div>
    </div>
  );
};
