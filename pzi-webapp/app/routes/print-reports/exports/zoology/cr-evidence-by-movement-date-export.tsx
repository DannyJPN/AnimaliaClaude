/* Sestavy / Zoologie - CR evidence - podle data pohybu */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

// Define the data structure based on the API response - backend returns flat array of movements
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
  partnerName?: string;
  note?: string;
  invert?: string;
};

export function toExportBlocks(movements: SpecimenMovementDto[], mode: string, minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];
  
  // Map mode codes to Czech display names (same as in frontend Select component)
  const modeDisplayNames: Record<string, string> = {
    'crprotection': 'ČR ochrana',
    'eufauna': 'EU fauna',
    'eufaunareduced': 'EU fauna red.'
  };
  
  const modeDisplayName = modeDisplayNames[mode] || mode;
  
  blockData.push({
    blockName: 'header',
    data: {
      "Mode": modeDisplayName,
      "MinDatumCZ": formatToCzechDate(minDate),
      "MaxDatumCZ": formatToCzechDate(maxDate)
    }
  });
  
  for (const movement of movements) {
    const isIncrement = movement.direction === '+';
    blockData.push({
      blockName: isIncrement ? 'pohyb_p' : 'pohyb_u',
      data: {
        "Datum": movement.date ? formatToCzechDate(movement.date) : "",
        "Nazev_CZ": movement.nameCz || "",
        "Nazev_LAT": movement.nameLat || "",
        "Pohlavi": movement.gender || "",
        "PrirustCislo": movement.accessionNumber?.toString() || "",
        "Chip": movement.chip || "",
        "KrouzekCislo": movement.ringNumber || "",
        "CRevidence": movement.czechRegistrationNumber || "",
        "Pohyb_Zpusob": movement.movementType || "",
        "smer": movement.direction || "",
        "Heslo": movement.partnerName || "",
        "Poznamka": movement.note || "",
        "Invert": movement.invert || ""
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
  const mode = searchParams.get("mode") || "crprotection"; // Default to crprotection
  
  if (!minDate || !maxDate) {
    throw new Response("MinDate and MaxDate are required parameters", { status: 400 });
  }
  
  const requestBody = {
    minDate,
    maxDate,
    mode: mode // Use the mode parameter from URL
  };
  
  try {
    const apiResponse = await apiCall(
      'api/PrintExports/CREvidenceByMovementDate',
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    if (apiResponse.status === 404) {
      return new Response('Žádná data nebyla nalezena pro zadané období.', { 
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        }, 
      });
    }
    
    const parsedResponse = await processResponse<SpecimenMovementDto[]>(apiResponse);
    
    if (!parsedResponse.success) {
      throw new Error('Nastala chyba při zpracování dat');
    }
    
    // Get the data from the API response - backend now returns a flat array
    const movements = parsedResponse.item || [];
  
    const dataBlocks = toExportBlocks(movements, mode, minDate, maxDate);
    
    // Using the "CRpohyb" sheet as specified in the RUN file
    const templateBlocks = await prepareTemplateBlocks('evidence__CRpohyb.xlsx', 'CRpohyb');
    
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    
    const xlsxBuffer = await wb.xlsx.writeBuffer();
    const filename = `w_crevidence_${mode}_${getXlsFileTimestamp()}`;
  
    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `inline;filename=${filename}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error generating CR Evidence report:", error);
    if (error instanceof Response) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Response(error.message, { status: 500 });
    }
    throw new Response("An unknown error occurred", { status: 500 });
  }
}
