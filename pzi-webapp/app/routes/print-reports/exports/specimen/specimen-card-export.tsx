import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
  id: number,
  species:{
    nameCz?: string,
    nameLat?: string,
  }
  name?: string,
  zims?: string,
  registrationNumber?: string,
  studBookNumber?: string,
  studBookName?: string,
  chip?: string,
  notch?: string,
  ringNumber?: string,
  birthDate?: string,
  birthPlace?: string,
  birthMethod?: string,
  rearing?: string,
  inDate?: string,
  inReasonCode?: string,
  inReasonDisplayName?: string,
  inLocationName?: string,
  outDate?: string,
  outReasonCode?: string,
  outReasonDisplayName?: string,
  outLocationName?: string,
  accessionNumber?: number,
  genderTypeCode?: string,
  euPermit?: string,
  otherMarkings?: string,
  placement?: string,
  note?: string,
  quantityInZoo?: number,
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
  movements: {
    id: number,
    date: string,
    location?: string,
    incrementReason?: string,
    decrementReason?: string,
    quantity: number,
    note?: string
  }[],
  bioEntries: { // This functionality is uncertain; original data is always empty.
    date?: string,
    action?: string,
    note?: string
  }[]
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
    blockName: 'jedinec',
    data: {
      "Nazev_LAT": dataRow.species.nameLat || "",
      "Nazev_CZ": dataRow.species.nameCz || "",
      "Jmeno": dataRow.name || "",
      "ARKS": dataRow.zims || "",
      "Registrace": dataRow.registrationNumber || "",
      "PrirustCislo": dataRow.accessionNumber || "",
      "Pohlavi": dataRow.genderTypeCode || "",
      "EUpermit": dataRow.euPermit || "",
      "PlemKnihaJmeno": dataRow.studBookName || "",
      "PlemKnihaCislo": dataRow.studBookNumber || "",
      "Chip": dataRow.chip || "",
      "Vrub": dataRow.notch || "",
      "KrouzekCislo": dataRow.ringNumber || "",
      "JineZnaceni": dataRow.otherMarkings || "",
      "Umisteni": dataRow.placement || "",
      "NarozeniDatum": dataRow.birthDate || "",
      "NarozeniMisto": dataRow.birthPlace || "",
      "NarozeniZpusob": dataRow.birthMethod || "",
      "Odchov": dataRow.rearing || "",
      "Otec_PC": dataRow.father?.accessionNumber || "",
      "Matka_PC": dataRow.mother?.accessionNumber || "",
      "Otec_A": dataRow.father?.zims || "",
      "Matka_A": dataRow.mother?.zims || "",
      "Poznamka": dataRow.note || "",
    }
  });

  for (const subRow of dataRow.movements) {
    blockData.push({
      blockName: 'pohyb',
      data: {
        "Prirustek": subRow.incrementReason || "",
        "Ubytek": subRow.decrementReason || "",
        "Datum": subRow.date || "",
        "Heslo": subRow.location || "",
        "Pocet": subRow.quantity || 0,
        "Poznamka": subRow.note || ""
      }
    });
  }

  blockData.push({
    blockName: 'jedinec2',
    data: {
        "V_Zoo": dataRow.quantityInZoo || 0
    }
  });

  blockData.push({
      blockName: 'biolTitul',
      data: {}
  });

  for (const subRow of dataRow.bioEntries) {
      blockData.push({
          blockName: 'biolog',
          data: {
              "Datum": subRow.date || "",
              "Vykon": subRow.action || "",
              "Poznamka": subRow.note || ""
          }
      });
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
  const specimenId = url.searchParams.get("specimenId") || null;
  const speciesId = url.searchParams.get("speciesId") || null;
  const nameCz = url.searchParams.get("nameCz") || null;
  const nameLat = url.searchParams.get("nameLat") || null;
  const accessionNumberFrom = url.searchParams.get("accessionNumberFrom") || null;
  const accessionNumberTo = url.searchParams.get("accessionNumberTo") || null;

  const requestBody = {
    specimenId: specimenId ? parseInt(specimenId) : null,
    speciesId: speciesId ? parseInt(speciesId) : null,
    nameCz,
    nameLat,
    accessionNumberFrom: accessionNumberFrom ? parseInt(accessionNumberFrom) : null,
    accessionNumberTo: accessionNumberTo ? parseInt(accessionNumberTo) : null,
  };

  const apiResponse = await apiCall(
    `api/PrintExports/SpecimenCard`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);
  const exportDataRows = parsedResponse.item!;
  
  
  const templateBlocks = await prepareTemplateBlocks('evidence__jedinec.xlsx', 'jedinec');
  
  let allBlocks: BlockData[] = [];
  const totalSheets = exportDataRows.length;
  exportDataRows.reverse().forEach((row: ExportDataRow, index: number) => {
    const blocks = toExportBlocks(row);
    const sheetNumber = String(totalSheets - index).padStart(3, '0');
    blocks[0].data["SHEET_NAME"] = `Strana-${sheetNumber}`;
    allBlocks = [...allBlocks, ...blocks];
  });

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
