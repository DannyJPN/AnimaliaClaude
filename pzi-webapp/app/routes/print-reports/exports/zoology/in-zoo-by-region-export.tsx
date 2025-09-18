

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";


type OrgLevelDTO = {
  id: number;
  name?: string;
  sectionName?: string;
  species: SpeciesDto[];
};

type SpeciesDto = {
  id: number;
  nameCz?: string;
  nameLat?: string;
  CITES?: string;
  priceTotal?: number;
  specimens: SpecimenDto[];
};

type SpecimenDto = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  studBookName?: string;
  registeredDate?: string;
  birthDate?: string;
  inDate?: string;
  inReasonCode?: string;
  inReasonDisplayName?: string;
  inLocationName?: string;
  price?: number;
  speciesId: number;
  outDate?: string;
  name?: string;
  chip?: string;
  notch?: string;
  ringNumber?: string;
  isHybrid?: boolean;
  zims?: string;
  studBookNumber?: string;
};

export function toExportBlocks(dataRows: OrgLevelDTO[]): BlockData[] {
  const blockData: BlockData[] = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const dataRow = dataRows[i];

    if (!dataRow.name && !dataRow.sectionName) {
      continue;
    }
    
    const sheetName = `${dataRow.name || ''}${dataRow.name && dataRow.sectionName ? '-' : ''}${dataRow.sectionName || ''}`;
    
    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": sheetName || "Rajon-Usek"
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
      blockName: 'header',
      data: {}
    });

    if (dataRow.species) {
      for (const species of dataRow.species) {

        blockData.push({
          blockName: 'titul',
          data: {
            "Nazev_CZ": species.nameCz || "",
            "Nazev_LAT": species.nameLat || "",
            "CITES": species.CITES || ""
          },
          applyBlockUpdates: ({ ws, blockLastRow }) => {
            const specimenCount = species.specimens?.length || 0;
            if (specimenCount > 0) {
              ws.getCell(`J${blockLastRow}`).value = {
                formula: `SUM(J${blockLastRow + 1}:J${blockLastRow + specimenCount})`
              };
            }
          }
        });
        

        if (species.specimens) {
          for (const specimen of species.specimens) {

            blockData.push({
              blockName: 'text',
              data: {
                "PrirustCislo": specimen.accessionNumber?.toString() || "",
                "Pohlavi": specimen.genderTypeCode || "",
                "PrirustekDatum": formatToCzechDate(specimen.inDate),
                "Prirustek": specimen.inReasonDisplayName || "",
                "PrirustekMisto": specimen.inLocationName || "",
                "NarozeniDatum": formatToCzechDate(specimen.birthDate),
                "PlemKnihaJmeno": specimen.studBookName || "",
                "Chip": specimen.chip || "",
                "Vrub": specimen.notch || "",
                "KrouzekCislo": specimen.ringNumber || "",
                "Jmeno": specimen.name || "",
                "Cena": specimen.price || 0,
                "Registrace": formatToCzechDate(specimen.registeredDate)
              }
            });
          }
        }
      }
    }
  }


  blockData.push({
    blockName: "END",
    data: {}
  });

  return blockData;
}


export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const vertebrateType = url.searchParams.get('type');

  const apiResponse = await apiCall(
    'api/PrintExports/InZooByRegion',
    'POST',
    JSON.stringify({ type: vertebrateType }),
    pziConfig
  );

  const parsedResponse = await processResponse<OrgLevelDTO[]>(apiResponse);
  
  const orgLevels = parsedResponse.item!;
  
  if (!orgLevels || orgLevels.length === 0) {
    throw new Response("No data found", { status: 404 });
  }

  const dataBlocks = toExportBlocks(orgLevels);
  const templateBlocks = await prepareTemplateBlocks('evidence__zijici_u.xlsx', 'zijici_u');
  
  const [workbook] = await renderPrintExport(templateBlocks, dataBlocks);
  const buffer = await workbook.xlsx.writeBuffer();
  
  const fileName = `in_zoo_by_region_${vertebrateType}_${getXlsFileTimestamp()}.xlsx`;
  
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    }
  });
};
