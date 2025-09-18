import { parse } from "qs";
import { ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";

const FormSchema = z.object({
  speciesId: z.coerce.number(),
  date: z.string().optional(),
  actionTypeCode: z.string().optional(),
  note: z.string().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const userName = await getUserName(request);
  const bodyText = await request.text();
  const requestData = FormSchema.parse(parse(bodyText));

  const apiRequest = {
    ...requestData,
    modifiedBy: userName
  };

  const response = await apiCall(
    'api/species/massspecimenrecords',
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