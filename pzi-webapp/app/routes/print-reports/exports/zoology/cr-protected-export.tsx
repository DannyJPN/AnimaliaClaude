/* Sestavy / Zoologie - Zvláště chráněné druhy ČR */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";

export type SpeciesInfoDto = {
  nameLat: string;
  nameCz: string;
  protectionRefNumber: string;
};

export function toExportBlocks(items: SpeciesInfoDto[]): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "protection_cr" }
  });

  blocks.push({ blockName: "titul", data: {} });
  blocks.push({ blockName: "ochrana_titul", data: {} });

  let order = 1;
  for (const item of items) {

    blocks.push({
      blockName: "ochrana_radek",
      data: {
        NazevLat: item.nameLat || '',
        NazevCz: item.nameCz || '',
        CrOchrana: item.protectionRefNumber || '',
        Poradi: order
      }
    });

    order++;
  }

  blocks.push({ blockName: "END", data: {} });

  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  
  const searchParams = new URL(request.url).searchParams;
  const protectionType = searchParams.get("protectionType") || "crprotection";

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

    const parsedResponse = await processResponse<SpeciesInfoDto[]>(apiResponse);
    
    if (!parsedResponse.success || !parsedResponse.item || parsedResponse.item.length === 0) {
      return new Response("Žádná data k exportu", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
    
    const items = parsedResponse.item;
    
    const dataBlocks = toExportBlocks(items);
    const templateBlocks = await prepareTemplateBlocks("eu_divergence.xlsx", "protection_cr");
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();
    
    const fileName = `cr-protected-species.xlsx`;

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
