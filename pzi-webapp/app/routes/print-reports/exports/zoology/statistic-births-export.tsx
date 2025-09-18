/* Sestavy / Programy: Statistika narození */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

// Define the data structure based on the API response (matching backend ClassStatisticDto)
export type ExportDataRow = {
  nameCz: string;
  specimenCount: number;
  speciesCount: number;
}

export function toExportBlocks(dataRows: ExportDataRow[], minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana-001"
    }
  });

  blockData.push({
    blockName: 'titul',
    data: {
      "MinDatumCZ": formatToCzechDate(minDate),
      "MaxDatumCZ": formatToCzechDate(maxDate)
    }
  });

  for (const dataRow of dataRows) {
    blockData.push({
      blockName: 'trida',
      data: {
        "trida": dataRow.nameCz,
        "jedinec": dataRow.specimenCount,
        "druh": dataRow.speciesCount
      }
    });
  }

  blockData.push({
    blockName: "foot",
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      ws.getCell(`B${blockLastRow}`).value = {
        formula: `SUM(B${blockLastRow - 1 - dataRows.length}:B${blockLastRow - 1})`
      };

      ws.getCell(`C${blockLastRow}`).value = {
        formula: `SUM(C${blockLastRow - 1 - dataRows.length}:C${blockLastRow - 1})`
      };
    }
  });

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
    'api/PrintExports/StatisticBirths',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData, minDate, maxDate);

  const templateBlocks = await prepareTemplateBlocks('statistika__narozeni.xlsx', 'narozeni');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const dateFromFormatted = minDate.replace(/\//g, "");
  const dateToFormatted = maxDate.replace(/\//g, "");
  const fileName = `w_dNarozeni_${dateFromFormatted}_${dateToFormatted}-${getXlsFileTimestamp()}.xlsx`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
