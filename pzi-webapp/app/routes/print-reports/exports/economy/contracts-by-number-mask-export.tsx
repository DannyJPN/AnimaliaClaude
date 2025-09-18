import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type MovementDto = {
  date?: string;
  speciesNameCz?: string;
  speciesNameLat?: string;
  genderTypeCode?: string;
  accessionNumber?: number;
  quantity?: number;
  price?: number;
  incrementReason?: string;
  decrementReason?: string;
};

export type ContractDto = {
  id: number;
  number?: string;
  date?: string;
  partnerKeyword?: string;
  movementReason?: string;
  movements: MovementDto[];
};

export type ExportDataRow = ContractDto[];

export function toExportBlocks(dataRows: ContractDto[], minDate: string, maxDate: string): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({
    blockName: "NEW_SHEET",
    data: {
      SHEET_NAME: "smlouvy"
    }
  });

  blocks.push({
    blockName: "titul",
    data: {
      MinDatumCZ: formatToCzechDate(minDate),
      MaxDatumCZ: formatToCzechDate(maxDate)
    }
  });

  blocks.push({
    blockName: "zahlavi",
    data: {}
  });

  for (const contract of dataRows) {
    blocks.push({
      blockName: "smlouva",
      data: {
        Cislo: contract.number || "",
        Datum: formatToCzechDate(contract.date || ""),
        Heslo: contract.partnerKeyword || "",
        Pohyb: contract.movementReason || "",
      }
    });

    for (const mv of contract.movements) {
      const isIncrement = !!mv.incrementReason;
      const blockName = isIncrement ? "pohyb_p" : "pohyb_u";
      const prirustek = mv.incrementReason ?? "";
      const ubytek = mv.decrementReason ?? "";
      blocks.push({
        blockName,
        data: {
          Datum: formatToCzechDate(mv.date || ""),
          Nazev_CZ: mv.speciesNameCz || "",
          Nazev_LAT: mv.speciesNameLat || "",
          Pohlavi: mv.genderTypeCode || "",
          PrirustCislo: mv.accessionNumber || "",
          PocetR: mv.quantity || 0,
          Cena: mv.price || 0,
          Prirustek: prirustek,
          Ubytek: ubytek
        }
      });
    }
  }

  blocks.push({ blockName: "end", data: {} });
  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const mask = url.searchParams.get("mask") || "";
  const minDate = url.searchParams.get("minDate") || "";
  const maxDate = url.searchParams.get("maxDate") || "";

  if (!mask) {
    throw new Response("Missing required parameter: mask", { status: 400 });
  }

  const requestBody = { mask } as any;

  const apiResponse = await apiCall(
    `api/PrintExports/ContractsOverview`,
    "POST",
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  const exportData = parsedResponse.item || [];

  const blocks = toExportBlocks(exportData, minDate, maxDate);
  const templateBlocks = await prepareTemplateBlocks("smlouvy__smlouvy.xlsx", "smlouvy");
  const [wb] = await renderPrintExport(templateBlocks, blocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  const timestamp = getXlsFileTimestamp();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=smlouvy_cislo_${mask}_${timestamp}.xlsx`,
      "Cache-Control": "no-cache"
    }
  });
}
