/* ZA-70  Sestavy / Zoologie - Statistika ke dni podle radu (P1) */
import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type TaxonomyOrderDto = {
  name: string;
  latinName: string;
  maleCount: number;
  femaleCount: number;
  unknownCount: number;
  speciesCount: number;
};

export type TaxonomyClassDto = {
  name: string;
  latinName: string;
  orders: TaxonomyOrderDto[];
};

export function toExportBlocks(classes: TaxonomyClassDto[], date: string): BlockData[] {

  const blockData: BlockData[] = [];

  for (const taxonomyClass of classes) {

    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": taxonomyClass.latinName
      }
    });

    blockData.push({
      blockName: 'title',
      data: {
        "KeDniCZ": formatToCzechDate(date),
        "classCZ": taxonomyClass.name,
        "classLAT": taxonomyClass.latinName
      }
    });

    for (const order of taxonomyClass.orders) {
      blockData.push({
        blockName: 'rad',
        data: {
          "ordoCZ": order.name,
          "ordoLAT": order.latinName,
          "spec": order.speciesCount,
          "male": order.maleCount,
          "female": order.femaleCount,
          "odd": order.unknownCount
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
        ws.getCell(`B${blockLastRow}`).value = {
          formula: `SUM(B${blockLastRow - 1 - taxonomyClass.orders.length}:B${blockLastRow - 1})`
        };

        ws.getCell(`C${blockLastRow}`).value = {
          formula: `SUM(C${blockLastRow - 1 - taxonomyClass.orders.length}:C${blockLastRow - 1})`
        };

        ws.getCell(`D${blockLastRow}`).value = {
          formula: `SUM(D${blockLastRow - 1 - taxonomyClass.orders.length}:D${blockLastRow - 1})`
        };

        ws.getCell(`E${blockLastRow}`).value = {
          formula: `SUM(E${blockLastRow - 1 - taxonomyClass.orders.length}:E${blockLastRow - 1})`
        };

        ws.getCell(`F${blockLastRow}`).value = {
          formula: `SUM(F${blockLastRow - 1 - taxonomyClass.orders.length}:F${blockLastRow - 1})`
        };
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
    return new Response("Date parameter is required", { status: 400 });
  }

  const requestBody = {
    date: date
  };

  const apiResponse = await apiCall(
    'api/PrintExports/StatisticsByOrder',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<TaxonomyClassDto[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const blocks = toExportBlocks(exportData, date);

  const templateBlocks = await prepareTemplateBlocks('statistika_rady.xlsx', 'statistika');

  const [wb] = await renderPrintExport(templateBlocks, blocks);
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=statistika-rady-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
