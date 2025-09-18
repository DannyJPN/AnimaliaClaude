// Sestavy/Programy-Zoologie- Prehled druhu eu odchylka
import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";

export type EuDivergenceItemDto = {
  nameLat?: string;
  nameCz?: string;
  euFaunaRefNumber?: string;
  crExceptionRefNumber?: string;
  order?: number;
};

export function toExportBlocks(items: EuDivergenceItemDto[]): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({
    blockName: "NEW_SHEET",
    data: { SHEET_NAME: "divergence" }
  });

  blocks.push({ blockName: "titul", data: {} });
  blocks.push({ blockName: "odchylka_titul", data: {} });

  for (const item of items) {
    blocks.push({
      blockName: "odchylka_radek",
      data: {
        NazevLat: item.nameLat || '',
        NazevCz: item.nameCz || '',
        EuFauna: item.euFaunaRefNumber || '',
        CrVyjimka: item.crExceptionRefNumber || '',
        Poradi: item.order ?? ''
      }
    });
  }

  blocks.push({ blockName: "END", data: {} });

  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  try {
    const apiResponse = await apiCall(
      'api/PrintExports/ZoologySpeciesListEuDivergence',
      'POST',
      JSON.stringify({}),
      pziConfig
    );

    const parsedResponse = await processResponse<EuDivergenceItemDto[]>(apiResponse);

    if (!parsedResponse.item) {
      throw new Response("No data found", { status: 404 });
    }

    const itemsWithOrder = parsedResponse.item.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    const dataBlocks = toExportBlocks(itemsWithOrder);
    const templateBlocks = await prepareTemplateBlocks("eu_divergence.xlsx", "divergence");
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
    const xlsxBuffer = await wb.xlsx.writeBuffer();

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="eu-divergence.xls"`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Response("Error generating Excel file", { status: 500 });
  }
}
