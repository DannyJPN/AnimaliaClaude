/* Sestavy / Druhy: Zabavené druhy ke dni */
import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number;
  nameCz?: string;
  nameLat?: string;
  species: {
    id: number;
    nameCz?: string;
    nameLat?: string;
    cites?: string;
    rdbCode?: string;
    euCode?: string;
    protectionType?: string;
    isEep: boolean;
    isEsb: boolean;
    isIsb: boolean;
    maleCount: number;
    femaleCount: number;
    unknownGenderCount: number;
  }[];
}

export function toExportBlocks(rowData: ExportDataRow[], date: string): BlockData[] {
  const blockData: BlockData[] = [];
  const tridaLastRows: number[] = [];

  const now = new Date();
  const today = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana_001"
    }
  });

  blockData.push({
    blockName: 'titul',
    data: {
      "MinDatumCZ": formatToCzechDate(date),
      "MaxDatumCZ": formatToCzechDate(today)
    }
  });

  for (const taxonomyClass of rowData) {
    const speciesCount = taxonomyClass.species.length;

    blockData.push({
      blockName: 'trida',
      data: {
        "Trida_CZ": taxonomyClass.nameCz || "",
        "Trida_LAT": taxonomyClass.nameLat || ""
      }
    });

    const speciesBlocksForThisClass: BlockData[] = [];

    for (const species of taxonomyClass.species) {
      speciesBlocksForThisClass.push({
        blockName: 'druh',
        data: {
          "Druh_CZ": species.nameCz || "",
          "Druh_LAT": species.nameLat || "",
          "CITES": species.cites || "",
          "EU": species.euCode || "",
          "RDB": species.rdbCode || "",
          "CRochrana": species.protectionType || "",
          "EEP": species.isEep ? "ANO" : "",
          "ESB": species.isEsb ? "ANO" : "",
          "ISB": species.isIsb ? "ANO" : "",
          "male": species.maleCount,
          "female": species.femaleCount,
          "odd": species.unknownGenderCount
        },
        applyBlockUpdates: ({ ws, blockLastRow }) => {
          ws.getCell(`M${blockLastRow}`).value = { formula: `SUM(J${blockLastRow}:L${blockLastRow})` };
        }
      });
    }
    blockData.push(...speciesBlocksForThisClass);

    blockData.push({
      blockName: 'tridaCelkem',
      data: {},
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        const startRowForSums = blockLastRow - speciesCount;
        const endRowForSums = blockLastRow - 1;

        ws.getCell(`J${blockLastRow}`).value = { formula: `SUM(J${startRowForSums}:J${endRowForSums})` };
        ws.getCell(`K${blockLastRow}`).value = { formula: `SUM(K${startRowForSums}:K${endRowForSums})` };
        ws.getCell(`L${blockLastRow}`).value = { formula: `SUM(L${startRowForSums}:L${endRowForSums})` };
        ws.getCell(`M${blockLastRow}`).value = { formula: `SUM(J${blockLastRow}:L${blockLastRow})` };
        tridaLastRows.push(blockLastRow);
      }
    });

    blockData.push({
      blockName: 'a',
      data: {}
    });
  }

  if (rowData.length > 0) {
    blockData.push({
      blockName: 'total',
      data: {},
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        if (tridaLastRows.length > 0) {
          const kSumFormula = tridaLastRows.map(row => `J${row}`).join(',');
          const lSumFormula = tridaLastRows.map(row => `K${row}`).join(',');
          const mSumFormula = tridaLastRows.map(row => `L${row}`).join(',');

          ws.getCell(`J${blockLastRow}`).value = { formula: `SUM(${kSumFormula})` };
          ws.getCell(`K${blockLastRow}`).value = { formula: `SUM(${lSumFormula})` };
          ws.getCell(`L${blockLastRow}`).value = { formula: `SUM(${mSumFormula})` };
          ws.getCell(`M${blockLastRow}`).value = { formula: `SUM(J${blockLastRow}:L${blockLastRow})` };
        }
      }
    });
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";

  if (!date) {
    return new Response("Date parameter is required", {
      status: 400,
    });
  }

  const requestBody = JSON.stringify({
    date: date,
    isVertebrate: true,
  });

  const apiResponse = await apiCall(
    'api/PrintExports/SeizedSpecies',
    'POST',
    requestBody,
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const exportData: ExportDataRow[] = parsedResponse.item!;

  const dataBlocks = toExportBlocks(exportData, date);
  const templateBlocks = await prepareTemplateBlocks('statistika__zabaveno_all.xlsx', 'zabaveno_all');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const filenameSuffix = "-ver";

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=seized-species${filenameSuffix}-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
