import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type RegistrationDto = {
  id: number;
  accessionNumber: number;
  registrationNumber: string,
  zims?: string;
  speciesNameLat?: string;
  speciesNameCz?: string;
  outDate?: string;
  outReason?: string;
  outLocation?: string;
  euPermit?: string;
}

export type ExportDataRow = RegistrationDto[];

export function toExportBlocks(dataRow: ExportDataRow, minReg: string, maxReg: string): BlockData[] {
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
        "registrace": registration.euPermit || "",
        "RegKdy": "",
        "RegKomu": "", 
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
  const minReg = url.searchParams.get("minReg") || "";
  const maxReg = url.searchParams.get("maxReg") || "";

  const requestBody = {
    minReg: minReg,
    maxReg: maxReg
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/RegistrationExportByEuPermit`,
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
    const dataBlocks = toExportBlocks(exportData, minReg, maxReg);
    const templateBlocks = await prepareTemplateBlocks('evidence__registr.xlsx', 'registr');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    
    const minRefString = minReg ? `_${minReg}` : '';
    const maxRefString = maxReg ? `_${maxReg}` : '';
    const fileName = `w_eupermit${minRefString}${maxRefString}_${getXlsFileTimestamp()}.xlsx`;

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