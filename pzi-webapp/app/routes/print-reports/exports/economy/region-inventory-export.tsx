/* Sestavy / Ekonomika: Inventura rajonu */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type RegionDto = {
  code: string;
  regionName: string;
  sectionName: string;
  classes: ClassDto[];
};

export type ClassDto = {
  id: number;
  nameCz: string;
  nameLat: string;
  species: SpeciesDto[];
};

export type SpeciesDto = {
  id: number;
  nameCz: string;
  nameLat: string;
  livingM?: number;
  livingF?: number;
  livingU?: number;
  sumPrice: number;
};

export type ExportDataRow = RegionDto;

export function toExportBlocks(dataRows: ExportDataRow[], date: string): BlockData[] {
  const blockData: BlockData[] = [];

  let totalClassRows = 0;

  for (const classData of dataRows) {
    for (const data of classData.classes) {
      totalClassRows += data.species.length;
      totalClassRows += 3;
    }
  }

  for (const dataRow of dataRows.length > 0 ? [dataRows[0]] : []) {
    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        SHEET_NAME: dataRow.regionName || "",
      },
    });

    blockData.push({
      blockName: 'rajon',
      data: {
        Kod: dataRow.code || "",
        Rajon: dataRow.regionName || "",
        Usek: dataRow.sectionName || "",
      },
    });

    blockData.push({
      blockName: 'titul',
      data: {
        KeDni: formatToCzechDate(date),
      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        const row = blockLastRow - 1;

        ['D', 'E', 'F', 'G'].map((col) => {
          ws.getCell(`${col}${row}`).value = {
            formula: `SUM(${col}${blockLastRow}:${col}${blockLastRow + totalClassRows})/2`
          }
        });

        ws.getCell(`C${row}`).value = {
          formula: `CONCATENATE(TEXT(IF(E${row}="",0,E${row}),"??0"),",",TEXT(IF(F${row}="",0,F${row}),"??0"),",",TEXT(IF(G${row}="",0,G${row}),"??0"))`,
        };
      },
    });

    for (const classItem of dataRow.classes) {
      blockData.push({
        blockName: 'trida',
        data: {
          Trida_CZ: classItem.nameCz || "",
          Trida_LAT: classItem.nameLat || ""
        },
        applyBlockUpdates: ({ ws, blockLastRow }) => {
          const row = blockLastRow - 1;
          const speciesCount = classItem.species.length;

          ['D', 'E', 'F', 'G'].map((col) => {
            ws.getCell(`${col}${row}`).value = {
              formula: `SUM(${col}${blockLastRow}:${col}${blockLastRow + speciesCount})`
            }
          });

          ws.getCell(`C${row}`).value = {
            formula: `CONCATENATE(TEXT(IF(E${row}="",0,E${row}),"??0"),",",TEXT(IF(F${row}="",0,F${row}),"??0"),",",TEXT(IF(G${row}="",0,G${row}),"??0"))`,
          };
        },
      });

      for (const species of classItem.species) {
        blockData.push({
          blockName: 'text',
          data: {
            Druh_CZ: species.nameCz || "",
            Druh_LAT: species.nameLat || "",
            LivingM: species.livingM ?? 0,
            LivingF: species.livingF ?? 0,
            LivingU: species.livingU ?? 0,
            SumPrice: species.sumPrice ?? 0,
          },
          applyBlockUpdates: ({ ws, blockLastRow }) => {
            ws.getCell(`C${blockLastRow}`).value = {
              formula: `CONCATENATE(TEXT(IF(E${blockLastRow}="",0,E${blockLastRow}),"??0"),",",TEXT(IF(F${blockLastRow}="",0,F${blockLastRow}),"??0"),",",TEXT(IF(G${blockLastRow}="",0,G${blockLastRow}),"??0"))`
            };
          }

        });
      }
    }
  }

  blockData.push({ blockName: 'end', data: {} });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const orgLevelId = url.searchParams.get("orgLevelId") || "";
  const date = url.searchParams.get("date") || "";
  const isVertebrateParam = url.searchParams.get("isVertebrate");

  // Check for required parameters
  if (!orgLevelId || !date || isVertebrateParam === null) {
    return new Response("OrgLevelId, Date, and isVertebrate parameters are required", { status: 400 });
  }

  const requestBody = {
    orgLevelId: parseInt(orgLevelId),
    date,
    mode: "region",
    isVertebrate: isVertebrateParam === 'true',
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/RegionInventory`,
      "POST",
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
    const exportData: ExportDataRow[] = parsedResponse.item || [];

    const dataBlocks = toExportBlocks(exportData, date);
    const templateBlocks = await prepareTemplateBlocks(
      "evidence__stavKeDni_rajon_novy.xlsx",
      "stavKeDni_rajon"
    );

    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    const xlsxBuffer = await wb.xlsx.writeBuffer();
    const fileName = `stavKeDni-rajon_${getXlsFileTimestamp()}`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `inline;filename=${fileName}.xlsx`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Response("Error generating Excel file", { status: 500 });
  }
}
