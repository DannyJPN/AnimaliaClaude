/* Sestavy / Ekonomika: Krmné dny zabavených exemplářů */

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
  ochrana?: string;
  specimens: SpecimenDto[];
}

export type SpecimenDto = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  chip?: string;
  ringNumber?: string;
  incrementDate?: string;
  incrementPlace?: string;
  quantity: number;
  feedingDays: number;
  history: string;
}

export function toExportBlocks(dataRow: SpeciesDto[], minDate: string, maxDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'top',
    data: {
      MinDatumCZ: formatToCzechDate(minDate),
      MaxDatumCZ: formatToCzechDate(maxDate)
    }
  });

  for (const speciesItem of dataRow) {

    blockData.push({
      blockName: 'titul',
      data: {
        Nazev_CZ: speciesItem.nameCz || '',
        Nazev_LAT: speciesItem.nameLat || '',
        Ochrana: speciesItem.ochrana || ''
      }
    });

    for (const specimen of speciesItem.specimens) {
      blockData.push({
        blockName: 'text',
        data: {
          PrirustCislo: specimen.accessionNumber || '',
          Pohlavi: specimen.genderTypeCode || '',
          Chip: specimen.chip || '',
          KrouzekCislo: specimen.ringNumber || '',
          PrirustekDatum: formatToCzechDate(specimen.incrementDate),
          PrirustekMisto: specimen.incrementPlace || '',
          pocet: specimen.quantity || 0,
          krmneDny: specimen.feedingDays || 0,
          historie: specimen.history
        },
        applyBlockUpdates: ({ ws, blockLastRow }) => {
          ws.getCell(`J${blockLastRow}`).value = {
            formula: `IF(ISNUMBER(H${blockLastRow}),IF(ISNUMBER(I${blockLastRow}),H${blockLastRow}*I${blockLastRow},""),"")`
          };
        }
      });
    }
  }

  blockData.push({
    blockName: 'total',
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      ws.getCell(`J${blockLastRow}`).value = {
        formula: `SUM(J2:J${blockLastRow - 1})`
      };
    }
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);

  const isVertebrate = url.searchParams.get("isVertebrate") === 'true';
  const minDate = url.searchParams.get('minDate');
  const maxDate = url.searchParams.get('maxDate');

  if (!minDate || !maxDate) {
    throw new Response('Chybí povinné parametry', { status: 400 });
  }

  const requestBody = {
    vertebrata: isVertebrate,
    minDate,
    maxDate
  };

  const apiResponse = await apiCall(
    `api/PrintExports/FeedingDaysSeized`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<SpeciesDto[]>(apiResponse);

  const exportData: SpeciesDto[] = parsedResponse.item || [];

  const fileName = `zabaveno_krmne_dny_${isVertebrate ? 'vertebrate' : 'invertebrate'}_${getXlsFileTimestamp()}.xlsx`;

  const dataBlocks = toExportBlocks(exportData, minDate, maxDate);
  const templateBlocks = await prepareTemplateBlocks('statistika__zabaveno_krmne_dny.xlsx', 'zabaveno_krmne_dny');
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-cache'
    }
  });
}
