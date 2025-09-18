/* ZA-64 - Sestavy / Zoologie - CR rozhodnuti - podle data pohybu */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  decision?: string;
  movements: SpecimenMovementDto[];
};

export type SpecimenMovementDto = {
  date?: string;
  nameCz?: string;
  nameLat?: string;
  gender?: string;
  accessionNumber?: number;
  chip?: string;
  ringNumber?: string;
  czechRegistrationNumber?: string;
  movementType?: string;
  direction?: string;
  note?: string;
  invert?: string;
  keyword?: string;
};

export function toExportBlocks(decisions: ExportDataRow[], mode: string, minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];
  
  blockData.push({
    blockName: 'header',
    data: {
      "Mode": mode === 'decisioncr' ? 'ZCHD' : 'odchylný postup',
      "MinDatumCZ": formatToCzechDate(minDate),
      "MaxDatumCZ": formatToCzechDate(maxDate)
    }
  });
  
  for (const decision of decisions) {

    blockData.push({
      blockName: 'decision',
      data: {
        "rozhodnuti": decision.decision || ""
      }
    });
    
    for (const movement of decision.movements) {
      const isIncrement = movement.direction === '+';
      blockData.push({
        blockName: isIncrement ? 'pohyb_p' : 'pohyb_u',
        data: {
          "Datum": formatToCzechDate(movement.date),
          "Nazev_CZ": movement.nameCz || "",
          "Nazev_LAT": movement.nameLat || "",
          "Pohlavi": movement.gender || "",
          "PrirustCislo": movement.accessionNumber || "",
          "Chip": movement.chip || "",
          "KrouzekCislo": movement.ringNumber || "",
          "CRevidence": movement.czechRegistrationNumber || "",
          "Pohyb_Zpusob": movement.movementType || "",
          "smer": movement.direction || "",
          "Heslo": movement.keyword || "",
          "Poznamka": movement.note || "",
          "Invert": movement.invert || ""
        }
      });
    }
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";
  const mode = searchParams.get("mode") || "";
  
  const requestBody = {
    minDate,
    maxDate,
    mode: mode
  };
  
  const apiResponse = await apiCall(
    'api/PrintExports/CRDecisionByMovementDate',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData, mode, minDate, maxDate);
  
  const templateBlocks = await prepareTemplateBlocks('evidence__CRrozhodnuti.xlsx', 'CRrozhodnuti');
  
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  
  const xlsxBuffer = await wb.xlsx.writeBuffer();
  const filePrefix = mode === 'decisioncr' ? 'w_CRVyjimkaCj' : 'w_EUfaunaCj';
  const fileName = `${filePrefix}_${getXlsFileTimestamp()}.xlsx`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      'Cache-Control': 'no-cache'
    },
  });
}
