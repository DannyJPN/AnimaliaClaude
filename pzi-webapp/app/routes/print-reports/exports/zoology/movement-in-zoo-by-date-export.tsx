/* ZA-42 Sestavy / Zoologie - Pohyb v zoo podle data */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";



export type SpecimenDto = {
  id: number;
  accessionNumber?: number;
  gender?: string;
  speciesNameLat?: string;
  speciesNameCz?: string;
}

// Define the data structure for the export - matches API's MovementInZooByDateMovementDto
export type ExportDataRow = {
  id: number;
  date: string;
  locationId?: number;
  locationName?: string;
  incrementReason?: string;
  decrementReason?: string;
  contractNumber?: string;
  note?: string;
  specimen: SpecimenDto;
  currentRegion?: string;
  previousRegion?: string;
}

export function toExportBlocks(movements: ExportDataRow[], minDateCZ: string, maxDateCZ: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "Strana-001" }
  });

  blockData.push({
    blockName: "title",
    data: {
      MinDatumCZ: minDateCZ,
      MaxDatumCZ: maxDateCZ
    }
  });

  for (const movement of movements) {
    blockData.push({
      blockName: "umisteni",
      data: {
        "Datum": formatToCzechDate(movement.date),
        "Nazev_CZ": movement.specimen.speciesNameCz || "",
        "Nazev_LAT": movement.specimen.speciesNameLat || "",
        "Pohlavi": movement.specimen.gender || "",
        "PrirustCislo": movement.specimen.accessionNumber || "",
        "Rajon": movement.currentRegion || "",
        "RajonPrev": movement.previousRegion || "",
        "Poznamka": movement.note || ""
      }
    });
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";
  
  const requestBody = {
    minDate: minDate,
    maxDate: maxDate
  };
  
  const apiResponse = await apiCall(
    'api/PrintExports/MovementInZooByDate',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const movements = parsedResponse.item || [];

  const minDateCZ = formatToCzechDate(minDate);
  const maxDateCZ = formatToCzechDate(maxDate);
  const dataBlocks = toExportBlocks(movements, minDateCZ, maxDateCZ);
  
  const templateBlocks = await prepareTemplateBlocks('pohybvzoo__pohyb_datum.xlsx', 'pohyb_datum');
  
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const fileName = `w_pohybvzoo_datum_${getXlsFileTimestamp()}.xlsx`;
  
  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
