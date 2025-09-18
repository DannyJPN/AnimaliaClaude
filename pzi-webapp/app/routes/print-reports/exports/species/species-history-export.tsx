import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number,
  nameCz?: string,
  nameLat?: string,
  specimens: {
    id: number,
    accessionNumber?: number,
    genderTypeCode?: string,
    zims?: string,
    studBookNumber?: string,
    studBookName?: string,
    name?: string,
    notch?: string,
    chip?: string,
    ringNumber?: string,
    registeredDate?: string,
    birthDate?: string,
    fatherAccessionNumber?: number,
    motherAccessionNumber?: number,
    inDate?: string,
    inReasonCode?: string,
    inReasonDisplayName?: string,
    inLocationName?: string,
    outDate?: string,
    outReasonCode?: string,
    outReasonDisplayName?: string,
    outLocationName?: string,
    rearing?: string
  }[]
}

export function toExportBlocks(dataRow: ExportDataRow): BlockData[] {
  const blockData: BlockData[] = [];

    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": "Strana-001"
      }
    });

    blockData.push({
      blockName: 'titul',
      data: {
        "Nazev_LAT": dataRow.nameLat || "",
        "Nazev_CZ": dataRow.nameCz || ""
      }
    });

    for (const subRow of dataRow.specimens) {
      blockData.push({
        blockName: 'text',
        data: {
          "PrirustCislo": subRow.accessionNumber || "",
          "Pohlavi": subRow.genderTypeCode || "",
          "PrirustekDatum": formatToCzechDate(subRow.inDate),
          "Prirustek": subRow.inReasonDisplayName || "",
          "PrirustekMisto": subRow.inLocationName || "",
          "NarozeniDatum": formatToCzechDate(subRow.birthDate),
          "PlemKnihaJmeno": subRow.studBookName || "",
          "PlemKnihaCislo": subRow.studBookNumber || "",
          "ARKS": subRow.zims || "",
          "Otec_PC": subRow.fatherAccessionNumber || "",
          "Matka_PC": subRow.motherAccessionNumber || "",
          "UbytekDatum": formatToCzechDate(subRow.outDate),
          "Ubytek": subRow.outReasonDisplayName || "",
          "UbytekMisto": subRow.outLocationName || "",
          "Chip": subRow.chip || "",
          "Vrub": subRow.notch || "",
          "KrouzekCislo": subRow.ringNumber || "",
          "Jmeno": subRow.name || "",
          "Odchov": subRow.rearing||""
        }
      });
    }

    blockData.push({
      blockName: "END",
      data: {}
    });

  return blockData;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const speciesId = params.speciesId;
  const searchParams = new URL(request.url).searchParams;
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";
  
  const apiResponse = await apiCall(
    `api/PrintExports/SpeciesHistory/${speciesId}?fromDate=${fromDate}&toDate=${toDate}`,
    'GET',
    undefined,
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  const exportData: ExportDataRow = parsedResponse.item!;

  const dataBlocks = toExportBlocks(exportData);

  const templateBlocks = await prepareTemplateBlocks('evidence.xlsx', 'history');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=species-history.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
