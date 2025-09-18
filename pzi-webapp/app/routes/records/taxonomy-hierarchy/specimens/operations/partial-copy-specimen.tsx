import { ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";

const FormSchema = z.object({
  specimenId: z.coerce.number()
});

export async function action({ request }: ActionFunctionArgs) {
  const userName = await getUserName(request);
  const formData = await request.formData();
  const specimenId = Number(formData.get('specimenId'));

  const requestData = FormSchema.parse({
    specimenId
  });

  const apiRequest = {
    SpecimenId: requestData.specimenId,
    ModifiedBy: userName
  };

  const response = await apiCall(
    'api/Specimens/CopyPartial',
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
