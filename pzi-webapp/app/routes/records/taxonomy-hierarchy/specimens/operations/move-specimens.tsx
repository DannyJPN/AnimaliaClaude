import { useQuery } from "@tanstack/react-query";
import { parse } from "qs";
import { useEffect, useState } from "react";
import { ActionFunctionArgs, data, useFetcher, useLocation, useNavigate, useOutletContext, useParams } from "react-router";
import { z } from "zod";
import { apiCall, convertErrorCodes, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";
import { useDebounceValue } from "~/components/hooks/use-debounce-value";
import { Button } from "~/components/ui/button";
import { ComboboxItem, JollyComboBox } from "~/components/ui/combobox";
import { DialogContent, DialogOverlay } from "~/components/ui/dialog";
import { fetchJson } from "~/lib/fetch";
import { SelectItemType } from "~/shared/models";

const FormSchema = z.object({
  specimenIds: z.coerce.number().array(),
  speciesId: z.coerce.number()
});

export async function action({ request }: ActionFunctionArgs) {
  const userName = await getUserName(request);
  const bodyText = await request.text();
  const requestData = FormSchema.parse(parse(bodyText));

  const apiRequest = {
    ids: requestData.specimenIds,
    targetId: requestData.speciesId,
    modifiedBy: userName
  };

  const response = await apiCall(
    'api/Specimens/Move',
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
