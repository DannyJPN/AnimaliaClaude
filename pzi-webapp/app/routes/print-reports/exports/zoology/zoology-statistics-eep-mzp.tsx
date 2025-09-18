// ZA-68 - Sestavy / Zoologie - Statistika ke dni s mez.programy (P3)

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export interface ClassStatistics {
  nameCz?: string;
  nameLat?: string;
  totalSpeciesCount: number;
  totalMaleCount: number;
  totalFemaleCount: number;
  totalUnknownCount: number;
  citesMzpSpeciesCount: number;
  citesMzpSpecimensCount: number;
  euMzpSpeciesCount: number;
  euMzpSpecimensCount: number;
  rdbSpeciesCount: number;
  rdbSpecimensCount: number;
  crSpeciesCount: number;
  crSpecimensCount: number;
  eepSpeciesCount: number;
  eepSpecimensCount: number;
  isbSpeciesCount: number;
  isbSpecimensCount: number;
  esbSpeciesCount: number;
  esbSpecimensCount: number;
}

export interface SpecimenStatistics {
  id: number;
  speciesNameLat?: string;
  speciesNameCz?: string;
  speciesId: number;
  accessionNumber?: number;
  inDate?: string;
  birthDate?: string;
}

export interface ZoologyStatisticsResponse {
  classStatistics: ClassStatistics[];
  specimenStatistics: SpecimenStatistics[];
}

function toExportBlocks(response: ZoologyStatisticsResponse, asOfDate: string) {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'title',
    data: {
      'KeDniCZ': formatToCzechDate(asOfDate)
    }
  });

  for (const cls of response.classStatistics) {
    blockData.push({
      blockName: "trida",
      data: {
        'Nazev_CZ': cls.nameCz || '',
        'Nazev_LAT': cls.nameLat || '',
        'spec': cls.totalSpeciesCount,
        'male': cls.totalMaleCount,
        'female': cls.totalFemaleCount,
        'odd': cls.totalUnknownCount,
        'CITESd': cls.citesMzpSpeciesCount,
        'CITESj': cls.citesMzpSpecimensCount,
        'EUd': cls.euMzpSpeciesCount,
        'EUj': cls.euMzpSpecimensCount,
        'RDBd': cls.rdbSpeciesCount,
        'RDBj': cls.rdbSpecimensCount,
        'CRochranad': cls.crSpeciesCount,
        'CRochranaj': cls.crSpecimensCount,
        'EEPd': cls.eepSpeciesCount,
        'EEPj': cls.eepSpecimensCount,
        'ISBd': cls.isbSpeciesCount,
        'ISBj': cls.isbSpecimensCount,
        'ESBd': cls.esbSpeciesCount,
        'ESBj': cls.esbSpecimensCount
      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        ws.getCell(`F${blockLastRow}`).value = {
          formula: `SUM(C${blockLastRow}:E${blockLastRow})`
        };
      }
    });
  }

  blockData.push({
    blockName: 'foot',
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].map((col) => {
        ws.getCell(`${col}${blockLastRow}`).value = {
          formula: `SUM(${col}${blockLastRow - 1 - response.classStatistics.length}:${col}${blockLastRow - 1})`
        };
      });
    }
  });

  blockData.push({
    blockName: "title2",
    data: {}
  });

  for (const specimenStat of response.specimenStatistics) {
    blockData.push({
      blockName: "kmet",
      data: {
        'Nazev_CZ': specimenStat.speciesNameCz || '',
        'Nazev_LAT': specimenStat.speciesNameLat || '',
        'PrirustCislo': specimenStat.accessionNumber || '',
        'Prirustek_datum': specimenStat.inDate || '',
        'NarozeniDatum': specimenStat.birthDate || ''
      }
    });
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const searchParams = new URL(request.url).searchParams;
  const date = searchParams.get("date") || "";

  if (!date) {
    throw new Response('Date parameter is required', { status: 400 });
  }

  const requestBody = {
    asOfDate: date
  };

  const apiResponse = await apiCall(
    'api/PrintExports/ZoologyStatisticsEep',
    'POST',
    JSON.stringify(requestBody),
    pziConfig,
    AbortSignal.timeout(300000)
  );

  const parsedResponse = await processResponse<ZoologyStatisticsResponse>(apiResponse);
  const responseData = parsedResponse.item || {} as ZoologyStatisticsResponse;

  const dataBlocks = toExportBlocks(responseData, date);

  const templateBlocks = await prepareTemplateBlocks('statistika__statistika_eep_mzp.xlsx', 'statistika_eep_mzp');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=statistika-eep-mzp-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
