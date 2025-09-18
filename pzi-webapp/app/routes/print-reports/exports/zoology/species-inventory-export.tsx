/* Sestavy / Programy: Zoologie - Mezivýsledek stavu druhu ke dni */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

// Define the data structure
export type TaxonomyClassDto = {
  nameCz: string;
  nameLat: string;
  nameEn: string;
  species: {
    nameLat: string;
    nameCz: string;
    nameEn: string;
    cites?: string;
    rdb?: string;
    eu?: string;
    crochrana?: string;
    eep?: boolean;
    isb?: boolean;
    esb?: boolean;

    livingM: number;
    livingF: number;
    livingU: number;

    deponM: number;
    deponF: number;
    deponU: number;

    sumPrice: number;
  }[];
}

export function toExportBlocks(data: TaxonomyClassDto[], statusDate: string): BlockData[] {
  const blockData: BlockData[] = [];

  let totalClassRows = 0;

  for (const classData of data) {
    totalClassRows += classData.species.length;
    totalClassRows += 3;
  }

  blockData.push({
    blockName: 'titul',
    data: {
      "KeDni": formatToCzechDate(statusDate),
      "KeDniEn": statusDate
    },
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      ['M', 'N', 'O', 'P', 'Q', 'R', 'S'].map((col) => {
        ws.getCell(`${col}${blockLastRow - 1}`).value = {
          formula: `SUM(${col}${blockLastRow}:${col}${blockLastRow + totalClassRows})/2`
        }
      });

      ws.getCell(`K${blockLastRow - 1}`).value = {
        formula: `CONCATENATE(TEXT(IF(N${blockLastRow - 1}="",0,N${blockLastRow - 1}),"??0"),",",TEXT(IF(O${blockLastRow - 1}="",0,O${blockLastRow - 1}),"??0"),",",TEXT(IF(P${blockLastRow - 1}="",0,P${blockLastRow - 1}),"??0"))`
      }

      ws.getCell(`L${blockLastRow - 1}`).value = {
        formula: `CONCATENATE(TEXT(IF(Q${blockLastRow - 1}="",0,Q${blockLastRow - 1}),"??0"),",",TEXT(IF(R${blockLastRow - 1}="",0,R${blockLastRow - 1}),"??0"),",",TEXT(IF(S${blockLastRow - 1}="",0,S${blockLastRow - 1}),"??0"))`
      }
    }
  });

  for (const classData of data) {

    blockData.push({
      blockName: 'trida',
      data: {
        "Trida_CZ": classData.nameCz,
        "Trida_LAT": classData.nameLat,
        "Trida_EN": classData.nameEn
      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        ['M', 'N', 'O', 'P', 'Q', 'R', 'S'].map((col) => {
          ws.getCell(`${col}${blockLastRow - 1}`).value = {
            formula: `SUM(${col}${blockLastRow}:${col}${blockLastRow + classData.species.length})`
          }
        });

        ws.getCell(`K${blockLastRow - 1}`).value = {
          formula: `CONCATENATE(TEXT(IF(N${blockLastRow - 1}="",0,N${blockLastRow - 1}),"??0"),",",TEXT(IF(O${blockLastRow - 1}="",0,O${blockLastRow - 1}),"??0"),",",TEXT(IF(P${blockLastRow - 1}="",0,P${blockLastRow - 1}),"??0"))`
        }

        ws.getCell(`L${blockLastRow - 1}`).value = {
          formula: `CONCATENATE(TEXT(IF(Q${blockLastRow - 1}="",0,Q${blockLastRow - 1}),"??0"),",",TEXT(IF(R${blockLastRow - 1}="",0,R${blockLastRow - 1}),"??0"),",",TEXT(IF(S${blockLastRow - 1}="",0,S${blockLastRow - 1}),"??0"))`
        }
      }
    });

    for (const species of classData.species) {
      blockData.push({
        blockName: 'text',
        data: {
          "Druh_LAT": species.nameLat,
          "Druh_CZ": species.nameCz,
          "Druh_EN": species.nameEn,
          "CITES": species.cites || "",
          "RDB": species.rdb || "",
          "EU": species.eu || "",
          "CRochrana": species.crochrana || "",
          "EEP": species.eep ? "ANO" : "",
          "ISB": species.isb ? "ANO" : "",
          "ESB": species.esb ? "ANO" : "",

          // Living counts - convert to strings
          "LivingM": species.livingM || 0,
          "LivingF": species.livingF || 0,
          "LivingU": species.livingU || 0,

          // Deposition counts - convert to strings
          "DeponM": species.deponM || 0,
          "DeponF": species.deponF || 0,
          "DeponU": species.deponU || 0,

          // Price values - convert to strings
          "SumPrice": species.sumPrice || 0
        },
        applyBlockUpdates: ({ ws, blockLastRow }) => {
          ws.getCell(`K${blockLastRow}`).value = {
            formula: `CONCATENATE(TEXT(IF(N${blockLastRow}="",0,N${blockLastRow}),"??0"),",",TEXT(IF(O${blockLastRow}="",0,O${blockLastRow}),"??0"),",",TEXT(IF(P${blockLastRow}="",0,P${blockLastRow}),"??0"))`
          }

          ws.getCell(`L${blockLastRow}`).value = {
            formula: `CONCATENATE(TEXT(IF(Q${blockLastRow}="",0,Q${blockLastRow}),"??0"),",",TEXT(IF(R${blockLastRow}="",0,R${blockLastRow}),"??0"),",",TEXT(IF(S${blockLastRow}="",0,S${blockLastRow}),"??0"))`
          }
        }
      });
    }
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const searchParams = new URL(request.url).searchParams;
  const statusDate = searchParams.get("statusDate") || "";
  const isVertebrata = searchParams.get("type") === 'vertebrate';

  const requestBody = {
    statusDate: statusDate,
    vertebrata: isVertebrata,
  };

  const apiResponse = await apiCall(
    'api/PrintExports/SpeciesInventory',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<TaxonomyClassDto[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData, statusDate);

  const templateBlocks = await prepareTemplateBlocks('evidence__stavKeDni_en.xlsx', 'stavKeDni_en');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  const filename = `stav_druhu_ke_dni_${getXlsFileTimestamp()}`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${filename}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
