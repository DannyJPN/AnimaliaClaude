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
    regionName?: string
    ubication?: string,
    rearing?: string
  }[]
}

export function toExportBlocks(dataRows: ExportDataRow[]): BlockData[] {
  const blockData: BlockData[] = [];
  const totalSheets = dataRows.length;

  dataRows.forEach((dataRow, index) => {
    const sheetNumber = totalSheets - index;
    const sheetName = `Strana-${String(sheetNumber).padStart(3, '0')}`;

    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": sheetName
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
          "RajonC": subRow.regionName || "",
          "Ubikace": subRow.ubication || "",
        }
      });
    }

    blockData.push({
      blockName: "END",
      data: {}
    });
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const searchParams = new URL(request.url).searchParams;
  const classId = searchParams.get("classId");

  if (!classId) {
    throw new Response("classId is a required parameter", { status: 400 });
  }

  const requestBody = {
    classId: parseInt(classId, 10)
  };

  const apiResponse = await apiCall(
    `api/PrintExports/InZooStatus`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);

  const exportData: ExportDataRow[] = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData);

  const templateBlocks = await prepareTemplateBlocks('evidence__zijici.xlsx', 'zijici');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const fileName = `inzoostatus_${getXlsFileTimestamp()}.xlsx`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
