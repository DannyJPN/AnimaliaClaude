import { LoaderFunctionArgs } from "react-router";
import { exportToXls } from "~/.server/export-xls";
import { apiCall } from "~/.server/api-actions";
import { DOCUMENT_MOVEMENTS_TABLE_ID, documentMovementColumnDef, documentMovementColumnDefVisibility } from "../controls";
import { DocumentMovement } from "../models";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const contractId = Number(params.contractId);

  if (isNaN(contractId)) {
    throw new Response("Invalid contract ID", { status: 400 });
  }
  
  const response = await apiCall(
    `api/Contracts/${contractId}/movements`,
    'POST',
    JSON.stringify({})
  );

  if (!response.ok) {
    throw new Response("Failed to fetch movements", { status: response.status });
  }

  const movementsResult = await response.json();
  const typedResult = movementsResult as { items: DocumentMovement[] };

  return exportToXls(
    request,
    typedResult.items,
    documentMovementColumnDef,
    documentMovementColumnDefVisibility,
    DOCUMENT_MOVEMENTS_TABLE_ID,
    "export-smlouvy-pohyby"
  );
}
