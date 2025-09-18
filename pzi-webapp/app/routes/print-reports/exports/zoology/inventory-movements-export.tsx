/* Sestavy / Programy: Inventura pohyb za dané období - pohyby v období */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  specimenId: number;
  date: string;
  locationId?: number;
  locationName?: string;
  incrementReason?: string;
  decrementReason?: string;
  contractNumber?: string;
  note?: string;
  accessionNumber?: number;
  gender?: string;
  speciesNameLat?: string;
  speciesNameCz?: string;
  keyword?: string;
}

export function toExportBlocks(dataRows: ExportDataRow[]): BlockData[] {
  const blockData: BlockData[] = [];
  
  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana-001"
    }
  });
  
  for (const movement of dataRows) {
    const movementType = movement.incrementReason ? "+" : "-";
    const movementReason = movement.incrementReason || movement.decrementReason || "";
    const blockType = movement.incrementReason ? "pohyb_p" : "pohyb_u";

    blockData.push({
      blockName: blockType,
      data: {
        "Datum": formatToCzechDate(movement.date),
        "Nazev_CZ": movement.speciesNameCz || "",
        "Nazev_LAT": movement.speciesNameLat || "",
        "Pohlavi": movement.gender || "",
        "PrirustCislo": movement.accessionNumber || "",
        "Pohyb_Zpusob": movementReason,
        "smer": movementType,
        "CisloSmlouvy": movement.contractNumber || "",
        "Heslo": movement.keyword || "",
        "Poznamka": movement.note || ""
      }
    });
  }

  blockData.push({
    blockName: "END",
    data: {}
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";
  const stateInfluence = searchParams.get("stateInfluence") || "s_vlivem"; // Default to 's_vlivem' (with influence)
  
  const requestBody = {
    minDate: minDate,
    maxDate: maxDate,
    stateInfluence: stateInfluence
  };
  
  const apiResponse = await apiCall(
    "api/PrintExports/InventoryMovements",
    "POST",
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData);
  
  const templateBlocks = await prepareTemplateBlocks('evidence__inventura.xlsx', 'inventura');
  
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  
  const xlsxBuffer = await wb.xlsx.writeBuffer();
  const filename = `${stateInfluence === "withinfluence" ? "w_pohyby_v_obdobi_s_vlivem" : "w_pohyby_v_obdobi_bez_vlivu"}_${getXlsFileTimestamp()}`;
  
  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${filename}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
