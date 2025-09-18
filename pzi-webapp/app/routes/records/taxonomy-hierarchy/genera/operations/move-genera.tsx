import { parse } from "qs";
import { ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";

const FormSchema = z.object({
  generaIds: z.coerce.number().array(),
  parentId: z.coerce.number()
});

export async function action({ request }: ActionFunctionArgs) {
  const userName = await getUserName(request);
  const bodyText = await request.text();
  const requestData = FormSchema.parse(parse(bodyText));

  const apiRequest = {
    ids: requestData.generaIds,
    targetId: requestData.parentId,
    modifiedBy: userName
  };

  const response = await apiCall(
    'api/taxonomygenera/Move',
    'POST',
    JSON.stringify(apiRequest),
    pziConfig
  );

  const parsedResponse = await processResponse<unknown>(response);

  return data({
    success: parsedResponse.success,
    validationWarnings: convertErrorCodes(parsedResponse.validationWarnings),
    validationErrors: convertErrorCodes(parsedResponse.validationErrors)
  });
}
