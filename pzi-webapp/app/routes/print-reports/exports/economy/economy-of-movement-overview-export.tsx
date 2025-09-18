import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type MovementTypeDto = {
  code: string,
  name: string,
  movements: MovementInfoDto[]
};

export type MovementInfoDto = {
  accessionNumber: number;
  speciesNameCz?: string;
  cryptogram?: string;
  price?: number;
  quantity: number;
  movementDate?: string;
  keyword?: string;
};

export type ResponseDto = {
  movementsByType: MovementTypeDto[]
};

export function toExportBlocks(
  movementsByType: MovementTypeDto[],
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

  let totalDataRows = 0;

  for (const movementType of movementsByType) {
    blockData.push({
      blockName: 'tab1Start',
      data: {
        PohybZpusob: movementType.name
      }
    });

    totalDataRows += 1;

    for (const movement of movementType.movements) {
      if (movement.cryptogram === "BEZ") continue;

      blockData.push({
        blockName: 'tab2',
        data: {
          PrirustCislo: movement.accessionNumber ?? "",
          Species_CZ: movement.speciesNameCz ?? "",
          Kryptogram: movement.cryptogram ?? "",
          Cena: movement.price ?? 0,
          Pocet: movement.quantity ?? 0,
          Datum: formatToCzechDate(movement.movementDate ?? ""),
          Heslo: movement.keyword ?? ""
        }
      });
    }

    for (const movement of movementType.movements) {
      if (movement.cryptogram !== "BEZ") continue;

      blockData.push({
        blockName: 'tab2x',
        data: {
          PrirustCislo: movement.accessionNumber ?? "",
          Species_CZ: movement.speciesNameCz ?? "",
          Kryptogram: movement.cryptogram ?? "",
          Cena: movement.price ?? 0,
          Pocet: movement.quantity ?? 0,
          Datum: formatToCzechDate(movement.movementDate ?? ""),
          Heslo: movement.keyword ?? ""
        }
      });
    }

    totalDataRows += movementType.movements.length;

    blockData.push({
      blockName: 'tab1End',
      data: {
        PohybZpusob: movementType.name
      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        var startRow = blockLastRow - movementType.movements.length - 2;
        var endRow = blockLastRow - 2;

        ['C', 'D'].map((col) => {
          ws.getCell(`${col}${blockLastRow - 1}`).value = {
            formula: `SUM(${col}${startRow}:${col}${endRow})`
          };
        });
      }
    });

    totalDataRows += 3;
  }

  blockData.push({
    blockName: 'titulEnd',
    data: {},
    applyBlockUpdates: ({ ws, blockLastRow }) => {
      var startRow = blockLastRow - totalDataRows - 1;
      var endRow = blockLastRow - 1;

      ['C', 'D'].map((col) => {
        ws.getCell(`${col}${blockLastRow}`).value = {
          formula: `SUM(${col}${startRow}:${col}${endRow})/2`
        };
      });
    }
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
      `api/PrintExports/EconomyMovementOverview`,
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<ResponseDto>(apiResponse);

    const exportData = parsedResponse.item?.movementsByType || [];
    const dataBlocks = toExportBlocks(exportData, minDate, maxDate);
    const templateBlocks = await prepareTemplateBlocks('ekonom__suma1_class.xlsx', 'suma1_class');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const fileName = `w_ucetpohybu_p_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    throw new Response('Error generating Excel file', { status: 500 });
  }
}
