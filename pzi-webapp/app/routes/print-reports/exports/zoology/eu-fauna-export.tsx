/* Sestavy / Zoologie - EU fauna */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { getXlsFileTimestamp } from "~/utils/date-utils";

export interface EuFaunaSpeciesDto {
  nameLat?: string;
  nameCz?: string;
  protectionRefNumber?: string;
  order?: number;
}

export function toExportBlocks(species: EuFaunaSpeciesDto[]): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "eu_fauna" }
  });

  blocks.push({
    blockName: "titul",
    data: {}
  });

  blocks.push({
    blockName: "fauna_titul",
    data: {}
  });

  let order = 1;
  for (const item of species) {

    blocks.push({
      blockName: "fauna_radek",
      data: {
        NazevLat: item.nameLat || "",
        NazevCz: item.nameCz || "",
        EuFauna: item.protectionRefNumber || "",
        Poradi: order
      }
    });

    order++;
  }

  blocks.push({
    blockName: "END",
    data: {}
  });

  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const protectionType = searchParams.get("protectionType") || "eufauna";

  const requestBody = {
    protectionType: protectionType
  };

  try {
    const apiResponse = await apiCall(
      'api/PrintExports/ProtectedAndEuFaunaSpeciesList',
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<EuFaunaSpeciesDto[]>(apiResponse);
    
    if (!parsedResponse.success) {
      throw new Error('Nastala chyba při zpracování dat');
    }
    
    const items = parsedResponse.item || [];

    if (items.length === 0) {
      return new Response("Žádná data k exportu", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    const dataBlocks = toExportBlocks(items);
    const templateBlocks = await prepareTemplateBlocks("eu_divergence.xlsx", "eu_fauna");
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();
    const fileName = `eu-inzoo-${getXlsFileTimestamp()}.xlsx`;

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
