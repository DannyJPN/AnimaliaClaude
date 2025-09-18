import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type FundingProgramDto = {
  name: string;
  species: SpeciesDto[];
}

export type SpeciesDto = {
  id: number;
  nameCz?: string;
  nameLat?: string;
  protectionAreas?: string;
  specimens: SpecimenDto[];
}

export type SpecimenDto = {
  id: number;
  accessionNumber?: number;
  gender?: string;
  chip?: string;
  ringNumber?: string;
  feedingDays: number;
  history?: string;
  quantity: number;
}

export type ExportDataRow = FundingProgramDto[];

export function toExportBlocks(data: ExportDataRow, dateFrom: string, dateTo: string): BlockData[] {
  const blockData: BlockData[] = [];

  for (const fundingProgram of data) {

    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": fundingProgram.name
      }
    });

    blockData.push({
      blockName: 'header',
      data: {
        "MinDatumCZ": formatToCzechDate(dateFrom),
        "MaxDatumCZ": formatToCzechDate(dateTo)
      }
    });
    
    for (const species of fundingProgram.species) {

      blockData.push({
        blockName: 'titul',
        data: {
          "Nazev_CZ": species.nameCz || "",
          "Nazev_LAT": species.nameLat || "",
          "Ochrana": species.protectionAreas || ""
        }
      });

      for (const specimen of species.specimens) {
        blockData.push({
          blockName: 'text',
          data: {
            "PrirustCislo": specimen.accessionNumber || "",
            "Pohlavi": specimen.gender || "",
            "krmneDny": specimen.feedingDays || 0,
            "historie": specimen.history || "",
            "pocet": specimen.quantity || 0
          },
          applyBlockUpdates: ({ ws, blockLastRow }) => {
            ws.getCell(`F${blockLastRow}`).value = {
              formula: `IF(ISNUMBER(D${blockLastRow}),IF(ISNUMBER(E${blockLastRow}),D${blockLastRow}*E${blockLastRow},""),"")`
            };
          }
        });
      }
    }

    blockData.push({
      blockName: 'celkem',
      data: {},
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        ws.getCell(`F${blockLastRow}`).value = {
          formula: `SUM(F2:F${blockLastRow - 1})`
        };
      }
    });
  }
  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";

  if (!dateFrom || !dateTo) {
    throw new Error('Missing required parameters');
  }

  const requestBody = {
    dateFrom,
    dateTo
  };

  const apiResponse = await apiCall(
    `api/PrintExports/FeedingDaysForFunding`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  if (!parsedResponse.item || parsedResponse.item.length === 0) {
    return new Response("No data found for the specified date range", {
      status: 404,
    });
  }

  const exportData: ExportDataRow = parsedResponse.item;

  const dataBlocks = toExportBlocks(exportData, dateFrom, dateTo);
  const templateBlocks = await prepareTemplateBlocks('dotace_krmne_dny.xlsx', 'dotace_krmne_dny');
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=dotace-krmne-dny-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
