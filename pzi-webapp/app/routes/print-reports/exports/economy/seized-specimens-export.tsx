/* Sestavy / Ekonomika: Zabavené exempláře ke dni */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number;
  nameCz?: string;
  nameLat?: string;
  protection?: string;
  specimens?: {
    id: number;
    accessionNumber?: number;
    genderTypeCode?: string;
    studBookName?: string;
    chip?: string;
    ringNumber?: string;
    birthDate?: string;
    inDate?: string;
    inLocationName?: string;
    outDate?: string;
    outReasonCode?: string;
    outLocationName?: string;
    placementName?: string;
  }[];
};

export function toExportBlocks(data: ExportDataRow[], _date: string): BlockData[] {
  const blocks: BlockData[] = [
    { blockName: "NEW_SHEET", data: { SHEET_NAME: "Strana_001" } },
    { blockName: "header", data: {} },
  ];

  for (const s of data) {
      blocks.push({
        blockName: "titul",
        data: {
          Druh_CZ: s.nameCz ?? "",
          Druh_LAT: s.nameLat ?? "",
          Ochrana: s.protection ?? "",
        },
      });

      if (s.specimens) {
        for (const sp of s.specimens) {
          blocks.push({
            blockName: "text",
            data: {
              PrirustCislo: sp.accessionNumber || "",
              Pohlavi: sp.genderTypeCode ?? "",
              Prirustek_Datum: formatToCzechDate(sp.inDate),
              Prirustek_Misto: sp.inLocationName ?? "",
              NarozeniDatum: formatToCzechDate(sp.birthDate),
              PlemKnihaJmeno: sp.studBookName ?? "",
              Chip: sp.chip ?? "",
              KrouzekCislo: sp.ringNumber ?? "",
              Ubytek_Datum: formatToCzechDate(sp.outDate),
              Ubytek: sp.outReasonCode ?? "",
              Ubytek_Misto: sp.outLocationName ?? "",
              Umisteni: sp.placementName ?? "",
            },
          });
        }
      }
  }

  blocks.push({ blockName: "END", data: {} });
  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const isVertebrateParam = url.searchParams.get("isVertebrate");

  if (!date) {
    return new Response("Date parameter is required", { status: 400 });
  }

  const requestBody = JSON.stringify({
    date: date,
     isVertebrate: isVertebrateParam === 'true'
  });

  const apiResponse = await apiCall(
    "api/PrintExports/SeizedSpecimens",
    "POST",
    requestBody,
    pziConfig,
  );

  const parsed = await processResponse<ExportDataRow[]>(apiResponse);
  const exportData = parsed.item!;

  const dataBlocks = toExportBlocks(exportData, date);
  const templateBlocks = await prepareTemplateBlocks("statistika.xlsx", "zabaveno");
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  const buffer = await wb.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=seized-specimens-${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
