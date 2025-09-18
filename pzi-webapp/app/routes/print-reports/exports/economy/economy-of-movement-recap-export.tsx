import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type MovementSummaryItemDto = {
  movementType: string;
  quantity: number;
  price: number;
};

export type MovementSummarySectionDto = {
  items: MovementSummaryItemDto[];
  totalQuantity: number;
  totalPrice: number;
};

export type MovementSummaryDto = {
  increments: MovementSummarySectionDto;
  decrements: MovementSummarySectionDto;
  difference: MovementSummaryItemDto;
};

export function toExportBlocks(
  summary: MovementSummaryDto,
  minDate: string,
  maxDate: string
): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "Strana-001" }
  });

  blocks.push({
    blockName: "titul",
    data: {
      MinDatumCZ: formatToCzechDate(minDate),
      MaxDatumCZ: formatToCzechDate(maxDate)
    }
  });

  blocks.push({ blockName: "prirustky_titul", data: {} });

  for (const item of summary.increments.items) {
    blocks.push({
      blockName: "prirustky_radek",
      data: {
        PohybZpusob: item.movementType,
        Pocet: item.quantity ?? 0,
        Cena: item.price ?? 0
      }
    });
  }

  blocks.push({
    blockName: "prirustky_footer",
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      const startRow = blockLastRow - summary.increments.items.length - 1;
      const endRow = blockLastRow - 2;

      ws.getCell(`B${blockLastRow - 1}`).value = { formula: `SUM(B${startRow}:B${endRow})` };
      ws.getCell(`D${blockLastRow - 1}`).value = { formula: `SUM(D${startRow}:D${endRow})` };
    }
  });

  blocks.push({ blockName: "ubytky_titul", data: {} });

  for (const item of summary.decrements.items) {
    blocks.push({
      blockName: "ubytky_radek",
      data: {
        PohybZpusob: item.movementType,
        Pocet: item.quantity ?? 0,
        Cena: item.price ?? 0
      }
    });
  }

  blocks.push({
    blockName: "ubytky_footer",
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      const startRow = blockLastRow - summary.decrements.items.length - 1;
      const endRow = blockLastRow - 2;

      ws.getCell(`B${blockLastRow - 1}`).value = { formula: `SUM(B${startRow}:B${endRow})` };
      ws.getCell(`D${blockLastRow - 1}`).value = { formula: `SUM(D${startRow}:D${endRow})` };
    }
  });

  blocks.push({
    blockName: "summary",
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      const summaryRow1 = blockLastRow - 2;
      const summaryRow2 = blockLastRow - 1;
      const summaryRow3 = blockLastRow;

      const decrementFooterRow = summaryRow1 - 1;
      const incrementFooterRow = decrementFooterRow - summary.decrements.items.length - 2;

      ws.getCell(`B${summaryRow1}`).value = { formula: `B${incrementFooterRow - 2}` };
      ws.getCell(`D${summaryRow1}`).value = { formula: `D${incrementFooterRow - 2}` };
      ws.getCell(`B${summaryRow2}`).value = { formula: `B${decrementFooterRow - 1}` };
      ws.getCell(`D${summaryRow2}`).value = { formula: `D${decrementFooterRow - 1}` };
      ws.getCell(`B${summaryRow3}`).value = { formula: `B${summaryRow1}-B${summaryRow2}` };
      ws.getCell(`D${summaryRow3}`).value = { formula: `D${summaryRow1}-D${summaryRow2}` };
    }
  });

  blocks.push({ blockName: "foot", data: {} });
  blocks.push({ blockName: "end", data: {} });

  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!minDate || !maxDate) {
    throw new Error("Missing required parameters: minDate, maxDate");
  }

  const requestBody = { minDate, maxDate };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/EconomyMovementRecap`,
      "POST",
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<MovementSummaryDto>(apiResponse);

    if (!parsedResponse.item) {
      throw new Response("No data found for the specified parameters", { status: 404 });
    }

    const dataBlocks = toExportBlocks(parsedResponse.item, minDate, maxDate);
    const templateBlocks = await prepareTemplateBlocks("ekonom__suma1.xlsx", "suma1");
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const dateFromFormatted = minDate.replace(/\//g, "");
    const dateToFormatted = maxDate.replace(/\//g, "");
    const fileName = `w_ucetpohybu_r_${dateFromFormatted}_${dateToFormatted}_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename=${fileName}`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Response("Error generating Excel file", { status: 500 });
  }
}
