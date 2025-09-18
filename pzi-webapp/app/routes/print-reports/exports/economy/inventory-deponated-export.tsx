/* Sestavy / Ekonomika: Stav deponací ke dni */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type DeponationDto = {
  type: string;
  speciesNameCz?: string;
  speciesNameLat?: string;
  accessionNumber?: number;
  specimenId: number;
  gender?: string;
  arks?: string;
  price?: number;
  date?: string;
  quantity: number;
  location?: string;
  note?: string;
};

export type DeponationData = {
  dep_z?: DeponationDto[];
  dep_do?: DeponationDto[];
  dep_nar?: DeponationDto[];
};

export function toExportBlocks(data: DeponationData): BlockData[] {
  const blockData: BlockData[] = [];

  // Section definitions based on sheet keys and block names
  const sections = [
    {
      key: 'dep_z',
      head: 'depOdHead',
      row: 'deponOd',
      row_b: 'deponOd_b',
    },
    {
      key: 'dep_do',
      head: 'depDoHead',
      row: 'deponDo',
      row_b: 'deponDo_b',
    },
    {
      key: 'dep_nar',
      head: 'depNarHead',
      row: 'deponNar',
      row_b: 'deponNar_b',
    }
  ];

  // For each section, add its own sheet and blocks
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const items = data[section.key as keyof DeponationData] || [];

    if (items.length === 0) {
      continue;
    }

    // Add new sheet for this section using the section key directly
    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        SHEET_NAME: section.key,
      },
    });

    // Add section header
    blockData.push({
      blockName: section.head,
      data: {},
    });

    for (const item of items) {
      blockData.push({
        blockName: item.gender === 'U' ? section.row_b : section.row,
        data: {
          Datum: formatToCzechDate(item.date),
          Heslo: item.location || '',
          Nazev_CZ: item.speciesNameCz || '',
          Nazev_LAT: item.speciesNameLat || '',
          Pohlavi: item.gender || '',
          PrirustCislo: item.accessionNumber || '',
          ARKS: item.arks || '',
          Cena: item.price || 0,
          PocetR: item.quantity || 0,
          Poznamka: item.note || '',
          SumaCelkem: (item.price || 0) * (item.quantity || 0)
        },
        applyBlockUpdates: (({ ws, blockLastRow }) => {
          ws.getCell(`H${blockLastRow}`).value = {
            formula: `F${blockLastRow}*G${blockLastRow}`
          };
        })
      });
    }
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

  const requestBody = {
    date
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/InventoryDeponated`,
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<DeponationData>(apiResponse);

    const exportData: DeponationData = parsedResponse.item || {};
    const dataBlocks = toExportBlocks(exportData);
    const templateBlocks = await prepareTemplateBlocks('evidence__deponace.xlsx', 'deponace');
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();
    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="inventory-deponated-${getXlsFileTimestamp()}.xlsx"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response('Error generating Excel file', { status: 500 });
  }
}
