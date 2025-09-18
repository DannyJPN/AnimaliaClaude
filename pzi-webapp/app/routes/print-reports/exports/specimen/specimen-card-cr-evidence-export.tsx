import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number,
  species:{
    nameCz?: string,
    nameLat?: string,
  }
  chip?: string,
  ringNumber?: string,
  birthDate?: string,
  birthPlace?: string,
  accessionNumber?: number,
  genderTypeCode?: string,
  father?: {
    id: number,
    zims?: string,
    accessionNumber?: number,
    czechRegistrationNumber?: string,
  },
  mother?: {
    id: number,
    zims?: string,
    accessionNumber?: number,
    czechRegistrationNumber?: string,
  },
}

export function toExportBlocks(dataRow: ExportDataRow): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": `Strana-1`
    }
  });

  blockData.push({
    blockName: 'jedinec',
    data: {
      "Nazev_LAT": dataRow.species.nameLat || "",
      "Nazev_CZ": dataRow.species.nameCz || "",
      "PrirustCislo": dataRow.accessionNumber || "",
      "Pohlavi": dataRow.genderTypeCode || "",
      "Chip": dataRow.chip || "",
      "KrouzekCislo": dataRow.ringNumber || "",
      "NarozeniDatum": formatToCzechDate(dataRow.birthDate),
      "NarozeniMisto": dataRow.birthPlace || "",
      "Otec_PC": dataRow.father?.accessionNumber || "",
      "Matka_PC": dataRow.mother?.accessionNumber || "",
      "Otec_CR": dataRow.father?.czechRegistrationNumber || "",
      "Matka_CR": dataRow.mother?.czechRegistrationNumber || "",
    }
  });

  blockData.push({
    blockName: 'podpis',
    data: {}
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const specimenId = url.searchParams.get("specimenId") || null;


  const requestBody = {
    specimenId: specimenId ? parseInt(specimenId) : null,
  };

  const apiResponse = await apiCall(
    `api/PrintExports/SpecimenCardCrEvidence`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);
  const exportDataRow = parsedResponse.item!;
  
  // Get template blocks once - we'll reuse for each sheet
  const templateBlocks = await prepareTemplateBlocks('evidence__jedineccre.xlsx', 'jedineccre');
  
  const allBlocks = toExportBlocks(exportDataRow);

  const [wb] = await renderPrintExport(templateBlocks, allBlocks);
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=specimencard_${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      'Cache-Control': 'no-cache',
    },
  });
}
