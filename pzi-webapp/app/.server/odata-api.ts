import { logger } from "./logger";
import { pziConfig } from "./pzi-config";

export type FetchODataListResult<T> = {
  items: T[],
  totalCount: number
};

export type FetchODataListError = {
  statusCode: number | undefined,
  errorText: string | undefined,
  innerError: Error | undefined
};

export function filterByStatusesClause(statuses: string[]) {
  return statuses.length > 0 && statuses.length !== 4
    ? `zooStatus in (${statuses.map((s) => `'${s}'`).join(',')})`
    : undefined;
}

export async function fetchODataList<TItem>(
  odataEntityQuery: string,
  config = pziConfig
): Promise<[FetchODataListError | undefined, FetchODataListResult<TItem> | undefined]> {
  const requestUrl = `${config.PZI_API_HOST_URL}/odata/${odataEntityQuery}`;

  let response: Response;

  try {
    logger.debug('odata call', {
      requestUrl
    });

    response = await fetch(requestUrl, {
      headers: {
        "X-API-Key": config.PZI_API_KEY
      }
    });

    logger.debug('odata response', {
      response: {
        url: response.url,
        ok: response?.ok,
        status: response?.status,
        statusText: response?.statusText
      }
    });

  } catch (err) {
    logger.error('OData call error', err);

    return [
      {
        statusCode: undefined,
        errorText: undefined,
        innerError: err as Error
      },
      undefined
    ];
  }

  if (!response.ok) {
    const errorText = await response.text();

    logger.error('OData call error', new Error(errorText));

    return [
      {
        statusCode: response.status,
        errorText,
        innerError: undefined
      },
      undefined
    ];
  }

  const jsonResult = await response.json();

  return [
    undefined,
    {
      totalCount: jsonResult["@odata.count"],
      items: jsonResult["value"] as TItem[]
    }
  ];
}
