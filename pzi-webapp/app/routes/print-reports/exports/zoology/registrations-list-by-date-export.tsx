import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate } from "~/utils/date-utils";

export type RegistrationDto = {
  id: number;
  accessionNumber: number;
  registrationNumber: string,
  euPermit?: string;
  zims?: string;
  registeredDate: string;
  registeredTo?: string;
  speciesNameLat?: string;
  speciesNameCz?: string;
  outDate?: string;
  outReason?: string;
  outLocation?: string;
}

export type ExportDataRow = RegistrationDto[];

export function toExportBlocks(dataRow: ExportDataRow, minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana-001"
    }
  });

  for (const registration of dataRow) {
    blockData.push({
      blockName: 'text',
      data: {
        "PrirustCislo": registration.accessionNumber,
        "registrace": registration.registrationNumber || "",
        "RegKdy": formatToCzechDate(registration.registeredDate),
        "RegKomu": registration.registeredTo || "", 
        "EUpermit": registration.euPermit || "",
        "ARKS": registration.zims || "",
        "Nazev_LAT": registration.speciesNameLat || "",
        "Nazev_CZ": registration.speciesNameCz || "",
        "Ubytek_Datum": formatToCzechDate(registration.outDate || ""),
        "Ubytek": registration.outReason || "",
        "Ubytek_Misto": registration.outLocation || ""
      }
    });
  }

  blockData.push({
    blockName: 'END',
    data: {}
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!minDate || !maxDate) {
    throw new Error('Missing required parameters: minDate, maxDateg');
  }

  const requestBody = {
    minDate: minDate.toString(),
    maxDate: maxDate.toString()
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/RegistrationExportByDate`,
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

    if (!parsedResponse.item) {
      throw new Response("No data found for the specified parameters", {
        status: 404,
      });
    }

    const exportData: ExportDataRow = parsedResponse.item;
    const dataBlocks = toExportBlocks(exportData, minDate, maxDate);
    const templateBlocks = await prepareTemplateBlocks('evidence__registr.xlsx', 'registr');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    
    const fileName = `gw_registr_d_${minDate}_${maxDate}.xlsx`;

    return new Response(await wb.xlsx.writeBuffer(), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.log(error);
    console.error('Error generating Excel file:', error);
    throw new Response('Error generating Excel file', { status: 500 });
  }
}