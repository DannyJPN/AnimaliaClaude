import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type MovementInfoDto = {
  accessionNumber: number;
  speciesNameCz?: string;
  speciesNameLat?: string;
  classNameLat?: string;
  classNameCz?: string;
  cryptogram?: string;
  regionName?: string;
  price?: number;
  quantity: number;
  movementDate?: string;
  password?: string;
  movementType?: string;
  totalMovementCount?: number;
  totalMovementPrice?: number;
  movementTypeCount?: number;
  movementTypePrice?: number;
  movementOrder?: number;
};

export type ResponseDto = {
  movementsByType: Record<string, MovementInfoDto[]>;
};

export type ExportDataRow = MovementInfoDto[];

export function toExportBlocks(
  movementsByType: Record<string, MovementInfoDto[]>,
  minDate: string,
  maxDate: string
): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      SHEET_NAME: 'Strana-001'
    }
  });

  const allMovements = Object.values(movementsByType).flat();
  const first = allMovements[0];

  blockData.push({
    blockName: 'titulStart',
    data: {
      MinDatumCZ: formatToCzechDate(minDate),
      MaxDatumCZ: formatToCzechDate(maxDate)
    }
  });

  const sortedEntries = Object.entries(movementsByType).sort(([, a], [, b]) => {
    const aOrder = a[0]?.movementOrder ?? 9999;
    const bOrder = b[0]?.movementOrder ?? 9999;
    return aOrder - bOrder;
  });
  
  const groupFooterRows: number[] = [];

  for (const [movementType, movements] of sortedEntries) {
    const firstMovement = movements[0];

    blockData.push({
      blockName: 'tab1Start',
      data: {
        PohybZpusob: movementType
      }
    });

    const movementBlockStartIndex = blockData.length;

    for (const movement of movements) {

      blockData.push({
        blockName: 'tab2',
        data: {
          PrirustCislo: movement.accessionNumber ?? "",
          Species_CZ: movement.speciesNameCz ?? "",
          Species_Lat: movement.speciesNameLat ?? "",
          Class_lat: movement.classNameLat ?? "",
          Class_cz: movement.classNameCz ?? "",
          Kryptogram: movement.cryptogram ?? "",
          Rajon: movement.regionName ?? "",
          Cena: movement.price ? movement.price : 0,
          Pocet: movement.quantity ?? 0,
          Datum: formatToCzechDate(movement.movementDate ?? ""),
          Heslo: movement.password ?? ""
        }
      });
    }

    blockData.push({
      blockName: 'tab1End',
      data: {
        PohybZpusob: movementType

      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        const startRow = blockLastRow - movements.length - 3;
        const endRow = blockLastRow - 3;

        ws.getCell(`C${blockLastRow - 1}`).value = { formula: `SUM(C${startRow}:C${endRow})` };
        ws.getCell(`D${blockLastRow - 1}`).value = { formula: `SUM(D${startRow}:D${endRow})` };
        groupFooterRows.push(blockLastRow - 1);
      }
    });
  }

  blockData.push({
    blockName: 'titulEnd',
    data: {

    },
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

  blockData.push({
    blockName: 'end',
    data: {}
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!minDate || !maxDate) {
    throw new Error('Missing required parameters: minDate, maxDate');
  }

  const requestBody = {
    minDate,
    maxDate
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/EconomyMovementTransactions`,
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<ResponseDto>(apiResponse);

    if (!parsedResponse.item || !parsedResponse.item.movementsByType || Object.keys(parsedResponse.item.movementsByType).length === 0) {
      throw new Response("No data found for the specified parameters", {
        status: 404,
      });
    }

    const exportData = parsedResponse.item.movementsByType;
    const dataBlocks = toExportBlocks(exportData, minDate, maxDate);
    const templateBlocks = await prepareTemplateBlocks('ekonom__suma1_class.xlsx', 'suma1_class');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const dateFromFormatted = minDate.replace(/\//g, "");
    const dateToFormatted = maxDate.replace(/\//g, "");
    const fileName = `w_ucetpohybu_kpr_${dateFromFormatted}_${dateToFormatted}_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating Excel file:', error);
    throw new Response('Error generating Excel file', { status: 500 });
  }
}
