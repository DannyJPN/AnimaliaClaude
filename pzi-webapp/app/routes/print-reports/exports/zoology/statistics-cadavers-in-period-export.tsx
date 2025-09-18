/* Sestavy / Zoologie: Statistika kadáveru v období */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type CadaverDetailDto = {
  speciesLatinName: string;
  speciesCzechName: string;
  speciesId: number;
  exemplarId: number;
  cadaverDate: string;
  location: string;
  cadaverNote: string;
  accessionNumber: string;
  gender: string;
  deathDate: string;
  deathType: string;
  deathNote: string;
};


export function toExportBlocks(cadavers: CadaverDetailDto[], dateFrom: string, dateTo: string, mode: string = 'kadaverTab'): BlockData[] {
  const blockData: BlockData[] = [];
  
  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana_001"
    }
  });
 
  blockData.push({
    blockName: 'header',
    data: {
      ...(mode === 'kadaver' ? {
        "MinDatumCZ": formatToCzechDate(dateFrom),
        "MaxDatumCZ": formatToCzechDate(dateTo)
      } : {})
    }
  });
  
  let prevSpeciesId = -1;
  
  for (const cadaver of cadavers) {

    if (mode === 'kadaver' && cadaver.speciesId !== prevSpeciesId) {
      prevSpeciesId = cadaver.speciesId;
      blockData.push({
        blockName: 'titul',
        data: {
          "Nazev_LAT": cadaver.speciesLatinName || '',
          "Nazev_CZ": cadaver.speciesCzechName || ''
        }
      });
    }
    
    blockData.push({
      blockName: 'kadaver',
      data: {
        ...(mode !== 'kadaver' ? {
          "Nazev_LAT": cadaver.speciesLatinName || '',
          "Nazev_CZ": cadaver.speciesCzechName || ''
        } : {}),
        "PrirustCislo": cadaver.accessionNumber || '',
        "Pohlavi": cadaver.gender || '',
        "KadaverDatum": formatToCzechDate(cadaver.cadaverDate),
        "Misto": cadaver.location || '',
        "PoznamkaKadaver": cadaver.cadaverNote || '',
        "UhynDatum": formatToCzechDate(cadaver.deathDate),
        "Ubytek": cadaver.deathType || '',
        "PoznamkaPohyb": cadaver.deathNote || ''
      }
    });
  }
  
  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const mode = searchParams.get('mode') || 'kadaverTab';
  const speciesId = searchParams.get('speciesId');
  const locationId = searchParams.get('locationId');

  if (!dateFrom || !dateTo) {
    return new Response("Missing dateFrom or dateTo parameter", { status: 400 });
  }

  const requestBody: any = {
    dateFrom: dateFrom,
    dateTo: dateTo,
    speciesId: speciesId ? parseInt(speciesId, 10) : null,
    locationId: locationId || null
  };
  
  const apiResponse = await apiCall(
    'api/PrintExports/StatistikaCadaversInPeriod',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<CadaverDetailDto[]>(apiResponse);
  const data = parsedResponse.item || [];

  if (!data || data.length === 0) {
    return new Response("No cadaver data found for the specified period", { status: 404 });
  }

  const blocks = toExportBlocks(data, dateFrom, dateTo, mode);

  const templateBlocks = await prepareTemplateBlocks('prehledy.xlsx', mode);
  
  let modeSuffix = '';
  if (speciesId) modeSuffix = '_D';
  else if (locationId) modeSuffix = '_A';
  
  
  const dateFromFormatted = dateFrom.replace(/\//g, "");
  const dateToFormatted = dateTo.replace(/\//g, "");
  const fileName = `w_${mode}${modeSuffix}_${dateFromFormatted}_${dateToFormatted}_${getXlsFileTimestamp()}.xlsx`;

  const excel = await renderPrintExport(templateBlocks, blocks);
  
  const buffer = await excel[0].xlsx.writeBuffer();
  
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${fileName}`
    }
  });
}
