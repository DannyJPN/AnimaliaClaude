import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { fetchODataList } from "~/.server/odata-api";
import { CONTRACT_ACTIONS_TABLE_ID, contractActionsColumnDef, contractActionsColumnDefVisibility } from "../controls";
import { ContractAction } from "../models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const contractId = Number(params.contractId);

  if (isNaN(contractId)) {
    throw new Response('Invalid contract ID', { status: 400 });
  }

  const queryClause = [
    `contractactions?$count=true&$filter=contractId eq ${contractId}&$expand=contract,actionType,actionInitiator&$orderby=date`
  ];

  const [fetchError, listResult] = await fetchODataList<ContractAction>(
    queryClause.join("&")
  );

  return exportToXls(
    request,
    listResult!.items,
    contractActionsColumnDef,
    contractActionsColumnDefVisibility,
    CONTRACT_ACTIONS_TABLE_ID,
    "export-smlouvy-ukony"
  );
}