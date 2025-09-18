import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type OrgLevelDto = {
  region?: string;
  section?: string;
  movements: MovementDto[];
};

export type MovementDto = {
  id: number;
  date: string;
  note?: string;
  accessionNumber?: string;
  gender?: string;
  speciesNameLat?: string;
  speciesNameCz?: string;
  region?: string;
  section?: string;
  regionPrev?: string;
  regionNext?: string;
};

export function toExportBlocks(regions: OrgLevelDto[], minDateCZ: string, maxDateCZ: string): BlockData[] {
  const blocks: BlockData[] = [];

  blocks.push({ blockName: "NEW_SHEET", data: { SHEET_NAME: "Strana-001" } });
  
  blocks.push({
    blockName: "title",
    data: {
      MinDatumCZ: minDateCZ,
      MaxDatumCZ: maxDateCZ
    }
  });

  for (const region of regions) {
    blocks.push({
      blockName: "rajon",
      data: {
        Rajon: region.region || "",
        Usek: region.section || "",
      },
    });

    for (const mv of region.movements) {
      blocks.push({
        blockName: "umisteni",
        data: {
          Datum: formatToCzechDate(mv.date),
          Nazev_CZ: mv.speciesNameCz || "",
          Nazev_LAT: mv.speciesNameLat || "",
          Pohlavi: mv.gender || "",
          PrirustCislo: mv.accessionNumber || "",
          RajonPrev: mv.regionPrev || "",
          RajonNext: mv.regionNext || "",
          Poznamka: mv.note || "",
        },
      });
    }
  }


  return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);
  const searchParams = new URL(request.url).searchParams;
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";

  const body = { minDate, maxDate };

  const apiResponse = await apiCall(
    'api/PrintExports/MovementInZooByRegion',
    'POST',
    JSON.stringify(body),
    pziConfig
  );
  const parsed = await processResponse<OrgLevelDto[]>(apiResponse);
  const regions = parsed.item || [];
  
  const minDateCZ = formatToCzechDate(minDate);
  const maxDateCZ = formatToCzechDate(maxDate);

  const blocks = toExportBlocks(regions, minDateCZ, maxDateCZ);
  const tplBlocks = await prepareTemplateBlocks("pohybvzoo__pohyb_rajon.xlsx", "pohyb_rajon");
  const [wb] = await renderPrintExport(tplBlocks, blocks);
  const buf = await wb.xlsx.writeBuffer();

  const timestamp = getXlsFileTimestamp();
  const filename = `pohyb_v_zoo_podle_rajonu_${timestamp}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${filename}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}