import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import {
  BlockData,
  prepareTemplateBlocks,
  renderPrintExport
} from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export interface MovementSummaryItemDto {
    movementType: string;
    quantity: number;
    price: number;
}

export interface MovementSummaryGroupDto {
    items: MovementSummaryItemDto[];
    totalQuantity: number;
    totalPrice: number;
}

export interface MovementSummaryDto {
    increments: MovementSummaryGroupDto;
    decrements: MovementSummaryGroupDto;
    difference?: MovementSummaryItemDto; 
}

export interface MovementDTO {
    species_CZ: string;
    prirustCislo: string;
    pocet: number;
    cena: number;
    kryptogram: string;
    datum: string;
    heslo: string;
}

export interface MovementGroupDTO {
    pohybZpusob: string;
    pohybZpusobPocetCelkem: number;
    pohybZpusobCenaCelkem: number;
    movements: MovementDTO[];
}

export interface ClassMovementsDTO {
    taxonomyClassName: string;
    minDatum: string;
    maxDatum: string;
    pohybPocetCelkem: number;
    pohybCenaCelkem: number;
    groups: MovementGroupDTO[];
}

export interface EconomyOfMovementSummaryResponse {
    classMovements: ClassMovementsDTO[];
    fundamentalHerd: MovementSummaryDto;
}


export function toExportBlocks(
  response: EconomyOfMovementSummaryResponse,
): BlockData[] {
  const blocks: BlockData[] = [];

  const fundamentalHerd = response.fundamentalHerd;
  blocks.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "zákl.stádo" }
  });

  blocks.push({
    blockName: "titul", 
    data: {
      MinDatumCZ: formatToCzechDate(response.classMovements[0]?.minDatum || ""),
      MaxDatumCZ: formatToCzechDate(response.classMovements[0]?.maxDatum || ""),
    }
  });

  blocks.push({ blockName: "prirustky_titul", data: {} }); 

  for (const item of fundamentalHerd.increments.items) {
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
      const startRow = blockLastRow - fundamentalHerd.increments.items.length - 1;
      const endRow = blockLastRow - 2;

      ws.getCell(`B${blockLastRow - 1}`).value = { formula: `SUM(B${startRow}:B${endRow})` };
      ws.getCell(`D${blockLastRow - 1}`).value = { formula: `SUM(D${startRow}:D${endRow})` };
    }
  });

  blocks.push({ blockName: "ubytky_titul", data: {} }); 

  for (const item of fundamentalHerd.decrements.items) {
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
      const startRow = blockLastRow - fundamentalHerd.decrements.items.length - 1;
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
      const incrementFooterRow = decrementFooterRow - fundamentalHerd.decrements.items.length - 2;

      ws.getCell(`B${summaryRow1}`).value = { formula: `B${incrementFooterRow - 2}` };
      ws.getCell(`D${summaryRow1}`).value = { formula: `D${incrementFooterRow - 2}` };
      ws.getCell(`B${summaryRow2}`).value = { formula: `B${decrementFooterRow - 1}` };
      ws.getCell(`D${summaryRow2}`).value = { formula: `D${decrementFooterRow - 1}` };
      ws.getCell(`B${summaryRow3}`).value = { formula: `B${summaryRow1}-B${summaryRow2}` };
      ws.getCell(`D${summaryRow3}`).value = { formula: `D${summaryRow1}-D${summaryRow2}` };
    }
  });

  if (response.classMovements.length > 0) {
    for (const summary of response.classMovements) {
      blocks.push({
        blockName: "NEW_SHEET",
        data: { SHEET_NAME: summary.taxonomyClassName }
      });

      blocks.push({
        blockName: "titulStart",
        data: {
          MinDatumCZ: formatToCzechDate(summary.minDatum),
          MaxDatumCZ: formatToCzechDate(summary.maxDatum),
        }
      });


      // collect footer total rows to build PohybCelkem as SUM of explicit total cells
      const groupFooterRows: number[] = [];
      for (const group of summary.groups) {
        blocks.push({
          blockName: "tab1Start",
          data: {
              PohybZpusob: group.pohybZpusob,
          }
        });
        for (const detail of group.movements) {
          blocks.push({
            blockName: "tab2",
            data: {
              Species_CZ: detail.species_CZ,
              PrirustCislo: detail.prirustCislo?.toString(),
              Pocet: detail.pocet,
              Cena: detail.cena,
              Kryptogram: detail.kryptogram,
              Datum: formatToCzechDate(detail.datum),
              Heslo: detail.heslo
            }
          });
        }
        blocks.push({
          blockName: "tab1End",
          data: {
              PohybZpusob: group.pohybZpusob,
          },
          applyBlockUpdates: ({ ws, blockLastRow }) => {
            const startRow = blockLastRow - group.movements.length - 3;
            const endRow = blockLastRow - 3;
            ws.getCell(`C${blockLastRow - 1}`).value = { formula: `SUM(C${startRow}:C${endRow})` };
            ws.getCell(`D${blockLastRow - 1}`).value = { formula: `SUM(D${startRow}:D${endRow})` };
            groupFooterRows.push(blockLastRow - 1);
          }
        });


      }

      blocks.push({
        blockName: "titulEnd",
        data: {},
        applyBlockUpdates: ({ ws, blockLastRow }) => {
          if (groupFooterRows.length > 0) {
            const cRefs = groupFooterRows.map(r => `C${r}`).join(',');
            const dRefs = groupFooterRows.map(r => `D${r}`).join(',');
            ws.getCell(`C${blockLastRow}`).value = { formula: `SUM(${cRefs})` };
            ws.getCell(`D${blockLastRow}`).value = { formula: `SUM(${dRefs})` };
          } else {
            ws.getCell(`C${blockLastRow}`).value = 0;
            ws.getCell(`D${blockLastRow}`).value = 0;
          }
        }
      });


    }
  }


  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!minDate || !maxDate) {
    throw new Response("Missing required parameters: minDate, maxDate", {
      status: 400
    });
  }

  const requestBody = { minDate, maxDate };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/EconomyMovementSummary`,
      "POST",
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<EconomyOfMovementSummaryResponse>(apiResponse);

    if (!parsedResponse.item) {
      throw new Response("No data found for the specified parameters", { status: 404 });
    }

    const dataBlocks = toExportBlocks(parsedResponse.item);
    const templateBlocks = await prepareTemplateBlocks("ekonom__suma1_class.xlsx", "suma1_class");
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const dateFromFormatted = minDate.replace(/\//g, "");
    const dateToFormatted = maxDate.replace(/\//g, "");
    const fileName = `w_ucetnisestava_${dateFromFormatted}_${dateToFormatted}_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename=${fileName}`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Error generating Excel file:", {
      requestBody,
      error,
      minDate,
      maxDate
    });

    throw new Response("Error generating Excel file", { status: 500 });
  }
}


