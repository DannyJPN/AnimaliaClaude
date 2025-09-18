/* Sestavy / Zoologie - Pohyb podle partneru */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate } from "~/utils/date-utils";

export type MovementDto = {
  id: number;
  date: string;
  speciesNameCz?: string;
  speciesNameLat?: string;
  gender?: string;
  accessionNumber?: number;
  incrementReason?: string; // Důvod přírůstku
  decrementReason?: string; // Důvod úbytku
  contractNumber?: string;
  partnerName?: string; // Heslo
  note?: string;
}

export type PartnerMovementDto = {
  partnerId: number;
  movements: MovementDto[];
}

export function toExportBlocks(partnerMovement: PartnerMovementDto, minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "Strana-001" }
  });

  
  // Pohyby jsou již seřazeny z backendu
  for (const movement of partnerMovement.movements) {
      // Určení směru pohybu (+/-) podle přítomnosti incrementReason nebo decrementReason
      let movementType = "";
      let movementReason = "";
      let blockType = "";
      
      // Když existuje důvod přírůstku, je to plus, jinak mínus
      if (movement.incrementReason) {
        movementType = "+";
        blockType = "pohyb_p";
        movementReason = movement.incrementReason;
      } else {
        movementType = "-";
        blockType = "pohyb_u";
        movementReason = movement.decrementReason || "";
      }
      
      blockData.push({
        blockName: blockType,
        data: {
          "Datum": formatToCzechDate(movement.date),
          "Nazev_CZ": movement.speciesNameCz || "",
          "Nazev_LAT": movement.speciesNameLat || "",
          "Pohlavi": movement.gender || "",
          "PrirustCislo": movement.accessionNumber || "",
          "CisloSmlouvy": movement.contractNumber || "",
          "Pohyb_Zpusob": movementReason,
          "smer": movementType,
          "Heslo": movement.partnerName || "", // Heslo je název partnera
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
  const partnerId = searchParams.get("partnerId") || "";
  
  const requestBody = {
    minDate: minDate,
    maxDate: maxDate,
    partnerId: parseInt(partnerId, 10)
  };
  
  const apiResponse = await apiCall(
    'api/PrintExports/MovementInZooByPartner',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<PartnerMovementDto>(apiResponse);
  const partnerMovement = parsedResponse.item || { partnerId: 0, movements: [] };

  const dataBlocks = toExportBlocks(partnerMovement, minDate, maxDate);
  
  const templateBlocks = await prepareTemplateBlocks('evidence__inventura__partner.xlsx', 'inventura');
  
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const dateFromFormatted = minDate.replace(/\//g, "");
  const dateToFormatted = maxDate.replace(/\//g, "");
  const fileName = `w_pohybvzoo_partner_${dateFromFormatted}_${dateToFormatted}.xlsx`;
  
  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

