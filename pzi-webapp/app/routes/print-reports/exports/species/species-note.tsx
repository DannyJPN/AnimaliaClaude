import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";

export type ExportDataRow = {
  id: number,
  nameCz?: string,
  nameLat?: string,
    note?: string
}

export function toExportBlocks(dataRow: ExportDataRow): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Strana_001"
    }
  });

  blockData.push({
    blockName: 'titul',
    data: {
      "Nazev_LAT": dataRow.nameLat || "",
      "Nazev_CZ": dataRow.nameCz || "",
      "Poznamka": dataRow.note || ""
    }
  });

  blockData.push({
    blockName: "END",
    data: {}
  });
  
  return blockData;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const speciesId = params.speciesId;

  const apiResponse = await apiCall(
    `api/PrintExports/SpeciesNote/${speciesId}`,
    'GET',
    undefined,
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  const exportData: ExportDataRow = parsedResponse.item!;

  const dataBlocks = toExportBlocks(exportData);

  const templateBlocks = await prepareTemplateBlocks('evidence.xlsx', 'druhPozn');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=species-note.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
