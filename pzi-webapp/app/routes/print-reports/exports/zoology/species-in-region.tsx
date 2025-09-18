import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number,
  name: string,
  sectionName?: string,
  species: {
    id: number,
    nameCz?: string,
    nameLat?: string,
    cites?: string,
    priceTotal: number,
    specimens: {
      id: number,
      accessionNumber?: number,
      genderTypeCode?: string,
      studBookName?: string,
      name?: string,
      notch?: string,
      chip?: string,
      ringNumber?: string,
      registeredDate?: string,
      registrationNumber?: string,
      birthDate?: string,
      inDate?: string,
      inReasonCode?: string,
      inReasonDisplayName?: string,
      inLocationName?: string,
      price?: number,
      speciesId: number
    }[]
  }[]

}

export function toExportBlocks(dataRow: ExportDataRow): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": dataRow.name
    }
  });
  blockData.push({
    blockName: 'usek',
    data: {
      "Rajon": dataRow.name || "",
      "Usek": dataRow.sectionName || ""
    }
  });

  blockData.push({
    blockName: "header",
    data: {}
  });

  for (const speciesRow of dataRow.species) {

    blockData.push({
      blockName: 'titul',
      data: {
        "Nazev_CZ": speciesRow.nameCz || "",
        "Nazev_LAT": speciesRow.nameLat || "",
        "CITES": speciesRow.cites ? "CITES:" + speciesRow.cites : "",
      },
      applyBlockUpdates: ({ ws, blockLastRow }) => {
        const startRow = blockLastRow + 1;
        const endRow = startRow + speciesRow.specimens.length - 1;
        ws.getCell(`J${blockLastRow}`).value = { formula: `SUM(J${startRow}:J${endRow})` };
      }
    });

    for (const subRow of speciesRow.specimens) {
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
          "Chip": subRow.chip || "",
          "Vrub": subRow.notch || "",
          "KrouzekCislo": subRow.ringNumber || "",
          "Jmeno": subRow.name || "",
          "Cena": subRow.price || 0,
          "Registrace": subRow.registrationNumber || "",
        }
      });
    }


  }

  blockData.push({
    blockName: "END",
    data: {}
  });

  return blockData;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);

  const isVertebrata = url.searchParams.get("type") === 'vertebrate';
  const mode = url.searchParams.get('mode');
  const regionId = url.searchParams.get('regionId');

  if (!regionId) {
    throw new Error('Region ID is required');
  }

  const requestBody = {
    organizationLevelId: parseInt(regionId),
    isVertebrata: isVertebrata
  };

  const apiResponse = await apiCall(
    "api/PrintExports/SpeciesInZooByOrgLevel",
    "POST",
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

  const exportData: ExportDataRow = parsedResponse.item!;
  const fileName = `v_majetku_${mode}_${isVertebrata ? 'vertebrata' : 'invertebrata'}_${getXlsFileTimestamp()}.xlsx`;

  const dataBlocks = toExportBlocks(exportData);
  const templateBlocks = await prepareTemplateBlocks('evidence__zijici_u.xlsx', 'zijici_u');
  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
