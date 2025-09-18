import { PziConfig } from "~/.server/pzi-config";
import { JOURNAL_ACTION_TYPE_EUTHANASIA, JOURNAL_ACTION_TYPE_MARKING, JOURNAL_ACTION_TYPE_SEX, JOURNAL_ACTION_TYPE_WEIGHT, JournalActionTypeCodes, JournalEntryAttribute, JournalEntryUpdateRequest } from "./models";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";

export function normalizeAttributesAndSpecimens(partialEntry: {
  actionTypeCode: JournalActionTypeCodes,
  attributes?: JournalEntryAttribute[],
  specimens?: {
    specimenId: number,
    note?: string,
    attributes?: JournalEntryAttribute[],
  }[]
}): {
  attributes: JournalEntryAttribute[],
  specimens: {
    specimenId: number,
    note?: string,
    attributes?: JournalEntryAttribute[],
  }[]
} {

  switch (partialEntry.actionTypeCode) {
    case JOURNAL_ACTION_TYPE_SEX: {
      return {
        attributes: [],
        specimens: (partialEntry.specimens || []).map((s) => {
          return {
            specimenId: s.specimenId,
            note: s.note ? s.note : undefined,
            attributes: (s.attributes || [])
              .filter(({ attributeTypeCode }) => attributeTypeCode === 'GENDER')
          };
        })
      };
    }

    case JOURNAL_ACTION_TYPE_WEIGHT: {
      return {
        attributes: [],
        specimens: (partialEntry.specimens || []).map((s) => {
          return {
            specimenId: s.specimenId,
            note: s.note ? s.note : undefined,
            attributes: (s.attributes || [])
              .filter(({ attributeTypeCode }) => attributeTypeCode === 'WEIGHT')
          };
        })
      };
    }

    case JOURNAL_ACTION_TYPE_MARKING: {
      return {
        attributes: [],
        specimens: (partialEntry.specimens || []).map((s) => {
          return {
            specimenId: s.specimenId,
            note: s.note ? s.note : undefined,
            attributes: (s.attributes || [])
              .filter(({ attributeTypeCode }) => attributeTypeCode === 'CHIP_CODE')
          };
        })
      };
    }

    case JOURNAL_ACTION_TYPE_EUTHANASIA: {
      return {
        attributes: [],
        specimens: (partialEntry.specimens || []).map((s) => {
          return {
            specimenId: s.specimenId,
            note: s.note ? s.note : undefined,
            attributes: (s.attributes || [])
              .filter(({ attributeTypeCode }) => attributeTypeCode === 'EUTHANASIA_REASON')
          };
        })
      };
    }

    default: {
      return {
        attributes: [],
        specimens: (partialEntry.specimens || []).map((s) => {
          return {
            specimenId: s.specimenId,
            note: s.note ? s.note : undefined,
            attributes: []
          };
        })
      };
    }
  }
}

export async function submitEntryUpdate(
  action: 'DELETE' | 'SEND_TO_REVIEW' | 'CLOSE' | 'SOLVE' | 'EDIT',
  entry: JournalEntryUpdateRequest,
  userName: string,
  pziConfig: PziConfig
) {
  if (action === 'DELETE') {
    const deleteRequest = {
      modifiedBy: userName
    };

    const response = await apiCall(
      `api/JournalEntries/${entry.id}`,
      'DELETE',
      JSON.stringify(deleteRequest),
      pziConfig
    );

    const parsedResponse = await processResponse<{ id: number }>(response);

    return {
      success: parsedResponse.success,
      changeResult: parsedResponse.item,
      validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
      validationErrors: convertErrorCodes(parsedResponse.validationErrors)
    };
  }

  if (entry.formModified) {
    const normalizedData = normalizeAttributesAndSpecimens(entry);

    const updateApiRequest = {
      ...entry,
      ...normalizedData,
      modifiedBy: userName,
      note: entry.note ? entry.note : undefined
    };

    const response = await apiCall(
      `api/JournalEntries/${entry.id}`,
      'POST',
      JSON.stringify(updateApiRequest),
      pziConfig
    );

    const parsedResponse = await processResponse<{ id: number }>(response);

    if (!parsedResponse.success || action === 'EDIT') {
      return {
        success: parsedResponse.success,
        changeResult: parsedResponse.item,
        validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
        validationErrors: convertErrorCodes(parsedResponse.validationErrors)
      };
    }
  }

  const apiRequest = {
    modifiedBy: userName
  };

  let response: Response;

  switch (action) {
    case 'SEND_TO_REVIEW': {
      response = await apiCall(
        `api/JournalEntries/${entry.id}/ToDocumentation`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    case 'CLOSE': {
      response = await apiCall(
        `api/JournalEntries/${entry.id}/ToDone`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    case 'SOLVE': {
      response = await apiCall(
        `api/JournalEntries/${entry.id}/ToProcessed`,
        'POST',
        JSON.stringify(apiRequest),
        pziConfig
      );

      break;
    }

    default: {
      return {
        success: true,
        changeResult: { id: entry.id },
        validationWarnings: {},
        validationErrors: {}
      };
    }
  }

  const parsedResponse = await processResponse<{ id: number }>(response);

  return {
    success: parsedResponse.success,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  };
}
