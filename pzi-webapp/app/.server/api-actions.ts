import { ChangeActionResult } from "~/shared/models";
import { pziConfig } from "./pzi-config";
import { logger } from "./logger";

export type ApiCallResult<TItem> = {
  success: boolean,
  item?: TItem,
  validationWarnings?: Record<string, { code: string, message: string }[]>,
  validationErrors?: Record<string, { code: string, message: string }[]>
};

export async function apiCall(
  apiEndpoint: string,
  method: string = 'GET',
  body: BodyInit | undefined = undefined,
  config = pziConfig,
  abortSignal: AbortSignal | null | undefined = undefined
) {
  const requestUrl = `${config.PZI_API_HOST_URL}/${apiEndpoint}`;

  logger.debug('Api call', {
    requestUrl
  });

  const response = await fetch(requestUrl, {
    method,
    body,
    headers: {
      "X-API-Key": config.PZI_API_KEY,
      "Content-Type": 'application/json'
    },
    signal: abortSignal
  });

  logger.debug('API response', {
    response: {
      url: response.url,
      ok: response?.ok,
      status: response?.status,
      statusText: response?.statusText
    }
  });

  return response;
}

export async function processResponse<TItem,>(
  response: Response
): Promise<ApiCallResult<TItem>> {

  if (response.ok) {
    const responseData = await response.json() as {
      item?: TItem,
      warnings?: Record<string, { code: string, message: string }[]>
    };

    return {
      success: true,
      item: responseData.item,
      validationWarnings: responseData.warnings && Object.keys(responseData.warnings).length > 0
        ? responseData.warnings
        : undefined,
      validationErrors: undefined
    };
  }

  switch (response.status) {
    case 400: {
      const badRequestData = await response.json();

      return {
        success: false,
        item: undefined,
        validationWarnings: undefined,
        validationErrors: badRequestData['errors']
          ? badRequestData['errors']
          : undefined
      };
    }

    default: {
      const errorText = await response.text();

      throw new Error(`ApiError ${response.status} - ${errorText}`);
    }
  }
}

export function translateCode(code: string) {
  switch (code) {
    case 'ERR_TOO_LONG': {
      return 'Hodnota přesahuje povoleny počet znaků';
    }

    case 'ERR_EMPTY': {
      return 'Hodnota je povinná';
    }

    case 'ERR_MUTUALLY_EXCLUSIVE': {
      return 'Vyplňte jen jednu položku.'
    }

    case 'ERR_INVALID_VALUE': {
      return 'Neplatna hodnota.'
    }

    default: {
      return code;
    }
  }
}

export function convertErrorCodes(errors: Record<string, { code: string, message: string }[]> | undefined): Record<string, string[]> | undefined {
  if (!errors) {
    return undefined;
  }

  return Object.entries(errors).reduce((acc, [key, data]) => {
    const normalizedKey = key?.length > 0
      ? `${key[0].toLocaleLowerCase()}${key.slice(1)}`
      : key;

    acc[normalizedKey] = data.map(({ code }) => translateCode(code));

    return acc;
  }, {} as Record<string, string[]>);
}

export async function apiInsert<TItem, TFormData>(
  apiEndpoint: string,
  formData: TFormData,
  currentUser: string,
  config = pziConfig
): Promise<ChangeActionResult<TItem, TFormData>> {
  const dataWithAudit = {
    ...formData,
    modifiedBy: currentUser
  };

  const apiCallBody = JSON.stringify(dataWithAudit);

  const response = await apiCall(
    apiEndpoint,
    'PUT',
    apiCallBody,
    config
  );

  const parsedResponse = await processResponse<TItem>(response);

  return {
    action: 'insert',
    success: parsedResponse.success,
    formValues: formData,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  };
}

export async function apiEdit<TItem, TFormData>(
  apiEndpoint: string,
  formData: TFormData,
  currentUser: string,
  config = pziConfig
): Promise<ChangeActionResult<TItem, TFormData>> {
  const dataWithAudit = {
    ...formData,
    modifiedBy: currentUser
  };

  const apiCallBody = JSON.stringify(dataWithAudit);

  const response = await apiCall(
    apiEndpoint,
    'POST',
    apiCallBody,
    config
  );

  const parsedResponse = await processResponse<TItem>(response);

  return {
    action: 'edit',
    success: parsedResponse.success,
    formValues: formData,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  };
}

export async function apiDelete<TItem, TFormData>(
  apiEndpoint: string,
  formData: TFormData,
  currentUser: string,
  config = pziConfig
): Promise<ChangeActionResult<TItem, TFormData>> {
  const dataWithAudit = {
    ...formData,
    modifiedBy: currentUser
  };

  const apiCallBody = JSON.stringify(dataWithAudit);

  const response = await apiCall(
    apiEndpoint,
    'DELETE',
    apiCallBody,
    config
  );

  const parsedResponse = await processResponse<TItem>(response);

  return {
    action: 'delete',
    success: parsedResponse.success,
    formValues: formData,
    changeResult: parsedResponse.item,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  };
}
