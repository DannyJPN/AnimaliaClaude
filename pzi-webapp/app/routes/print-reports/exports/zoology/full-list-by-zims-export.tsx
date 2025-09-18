import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";

type SpecimenDto = {
  accessionNumber?: number;
  zims?: string;
  nameLat?: string;
  nameCz?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const minZims = url.searchParams.get("minZims") || "";
  const maxZims = url.searchParams.get("maxZims") || "";

  const apiResponse = await apiCall(
    'api/PrintExports/SpecimensByZimsRange',
    'POST',
    JSON.stringify({
      minZims,
      maxZims
    }),
    pziConfig
  );

  const parsedResponse = await processResponse<SpecimenDto[]>(apiResponse);
  const templateBlocks = await prepareTemplateBlocks('evidence__arks.xlsx', 'ARKS');

  const dataBlocks: BlockData[] = [];

  for (const specimen of (parsedResponse.item || [])) {
    dataBlocks.push({
      blockName: "text",
      data: {
        PrirustCislo: specimen.accessionNumber?.toString() || "",
        ARKS: specimen.zims || "",
        Nazev_LAT: specimen.nameLat || "",
        Nazev_CZ: specimen.nameCz || ""
      }
    });
  }

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const fileName = `gw_arks_${minZims}_${maxZims}`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
