import { ActionFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { fetchODataList } from "~/.server/odata-api";
import { pziConfig } from "~/.server/pzi-config";
import { getUserName } from "~/.server/user-session";
import { EnumerationType } from "~/shared/models";
import { DistrictItemType, JournalBaseDataResult } from "./models";

export async function action({ request }: ActionFunctionArgs) {
  const userName = await getUserName(request);

  var forUserParams = JSON.stringify({
    userName
  });

  const districtsForUserResult = await apiCall(
    'api/JournalEntries/DistrictsForUser',
    'POST',
    forUserParams,
    pziConfig
  );

  const actionTypesForUserResult = await apiCall(
    'api/JournalEntries/ActionTypesForUser',
    'POST',
    forUserParams,
    pziConfig
  );

  const [_, allDistrictsResult] = await fetchODataList<DistrictItemType>(
    `OrganizationLevels?$filter=level eq 'district'&$orderby=name`
  );

  const actionTypesForUser = await processResponse<(EnumerationType & { showInInsert: boolean, journalEntryType: 'Bio' | 'Movement' })[]>(actionTypesForUserResult);
  const districtsForUser = await processResponse<DistrictItemType[]>(districtsForUserResult);

  const baseDataResult: JournalBaseDataResult = {
    bioActionTypesEdit: actionTypesForUser.item?.filter(e => e.journalEntryType === 'Bio') ?? [],
    bioActionTypesInsert: actionTypesForUser.item?.filter(e => e.journalEntryType === 'Bio' && e.showInInsert) ?? [],
    movementActionTypesInsert: actionTypesForUser.item?.filter(e => e.journalEntryType === 'Movement' && e.showInInsert) ?? [],
    movementActionTypesEdit: actionTypesForUser.item?.filter(e => e.journalEntryType === 'Movement') ?? [],
    districtsInsert: districtsForUser.item ?? [],
    districtsEdit: allDistrictsResult?.items ?? []
  };

  return Response.json(baseDataResult);
}
