/* ZA-37 -> Sestavy / Programy: Druhy - Druh v majetku */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

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
    rearing?: string,
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
    placementName?: string,
    placementNote?: string
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
        "Odchov": subRow.rearing || "",
        "Jmeno": subRow.name || "",
        "RajonC": subRow.placementName || "",
        "Ubikace": subRow.placementNote || "",
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

  const apiResponse = await apiCall(
    `api/PrintExports/SpeciesInZoo/${speciesId}`,
    'GET',
    undefined,
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  const exportData: ExportDataRow = parsedResponse.item!;

  const dataBlocks = toExportBlocks(exportData);

  const templateBlocks = await prepareTemplateBlocks('evidence.xlsx', 'zijici');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=speciesinzoo-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
