/* ZA-42 Sestavy / Zoologie - Pohyb v zoo podle druhu (P3) */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

// Types to match the backend DTOs
type SpeciesDto = {
  id: number;
  nameCz: string;
  nameLat: string;
  movements: MovementDto[];
};

type MovementDto = {
  id: number;
  date: string;
  note?: string | null;
  accessionNumber?: number | null;
  gender?: string | null;
  currentRegion: string;
  previousRegion?: string | null;
};

// Define helper function to convert data to export blocks format
export function toExportBlocks(species: SpeciesDto[], minDateCZ: string, maxDateCZ: string): BlockData[] {
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

  for (const speciesItem of species) {
    // Add species info in a separate druh block
    blockData.push({
      blockName: "druh",
      data: {
        "Nazev_CZ": speciesItem.nameCz || "",
        "Nazev_LAT": speciesItem.nameLat || ""
      }
    });
    
    // Then add all movements for this species
    for (const movement of speciesItem.movements) {
      blockData.push({
        blockName: "umisteni",
        data: {
          "Datum": formatToCzechDate(movement.date),
          "Pohlavi": movement.gender || "",
          "PrirustCislo": movement.accessionNumber || "",
          "Rajon": movement.currentRegion || "",
          "RajonPrev": movement.previousRegion || "",
          "Poznamka": movement.note || ""
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
  
  const requestBody = {
    minDate: minDate,
    maxDate: maxDate
  };
  
  const apiResponse = await apiCall(
    'api/PrintExports/MovementInZooBySpecies',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<SpeciesDto[]>(apiResponse);
  const species = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(species, minDate, maxDate);
  
  const templateBlocks = await prepareTemplateBlocks('pohybvzoo__pohyb_druh.xlsx', 'pohyb_druh');
  
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const dateFromFormatted = minDate.replace(/\//g, "");
  const dateToFormatted = maxDate.replace(/\//g, "");
  const timestamp = getXlsFileTimestamp();
  const fileName = `w_pohybvzoo_druh_${dateFromFormatted}_${dateToFormatted}_${timestamp}.xlsx`;
  
  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
