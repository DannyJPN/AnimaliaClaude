/* Sestavy / Ekonomika: Krmné dny */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type SpeciesDto = {
  id: number;
  nameCz?: string;
  nameLat?: string;
  specimens: SpecimenDto[];
}

export type SpecimenDto = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  feedingDays: number;
  lastIncrementReason?: string;
  lastDecrementReason?: string;
  zims?: string;
  lastMovementDate?: string;
  studBookNumber?: string;
  studBookName?: string;
}

export type ExportDataRow = SpeciesDto;

export function toExportBlocks(dataRow: ExportDataRow, minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana-001"
    }
  });

  blockData.push({
    blockName: 'tab1',
    data: {
      "Nazev_CZ": dataRow.nameCz || "",
      "MinDatumCZ": formatToCzechDate(minDate),
      "MaxDatumCZ": formatToCzechDate(maxDate)
    }
  });

  let totalFeedingDays = 0;
  for (const specimen of dataRow.specimens) {
    totalFeedingDays += specimen.feedingDays;

    blockData.push({
      blockName: 'tab2',
      data: {
        "PrirustCislo": specimen.accessionNumber || "",
        "PlemKnihaJmeno": specimen.studBookName || "",
        "Pohlavi": specimen.genderTypeCode || "",
        "lastPr": specimen.lastIncrementReason || "",
        "lastUb": specimen.lastDecrementReason || "",
        "lastDatum": specimen.lastMovementDate || "",
        "krmneDny": specimen.feedingDays || 0,
        "ARKS": specimen.zims || "",
      }
    });
  }

  blockData.push({
    blockName: 'celkem',
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      ws.getCell(`H${blockLastRow}`).value = {
        formula: `SUM(H2:H${blockLastRow - 1})`
      };
    }
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const speciesId = url.searchParams.get("speciesId") || "";
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!speciesId || !minDate || !maxDate) {
    throw new Error('Missing required parameters: speciesId, minDate, maxDate');
  }

  const requestBody = {
    speciesId: parseInt(speciesId),
    minDate,
    maxDate
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/FeedingDays`,
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
    const templateBlocks = await prepareTemplateBlocks('ekonom.xlsx', 'krmneDny');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    
    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const fileName = `krmne_dny_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    throw new Response('Error generating Excel file', { status: 500 });
  }
}
