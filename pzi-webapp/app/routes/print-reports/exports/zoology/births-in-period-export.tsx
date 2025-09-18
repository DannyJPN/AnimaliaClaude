import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";

export type SpecimenItem = {
  accessionNumber?: number;
  genderTypeCode?: string;
  birthDate?: string;
  studBookName?: string;
  chip?: string;
  notch?: string;
  ringNumber?: string;
  registrationNumber?: string;
  name?: string;
  quantityInZoo?: number;
  price?: number;
  organizationLevelName?: string;
}

export type SpeciesItem = {
  nameCz?: string;
  nameLat?: string;
  citeTypeCode?: string;
  specimens: SpecimenItem[];
}

export function toExportBlocks(speciesItems: SpeciesItem[]): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: "NEW_SHEET",
    data: {
      SHEET_NAME: "Strana-001"
    }
  });

  blockData.push({
    blockName: 'header',
    data: {}
  });

  for (const species of speciesItems) {
    blockData.push({
      blockName: 'titul',
      data: {
        "Nazev_CZ": species.nameCz || "",
        "Nazev_LAT": species.nameLat || "",
        "CITES": species.citeTypeCode || ""
      }
    });

    for (const specimen of species.specimens || []) {
      blockData.push({
        blockName: 'text',
        data: {
          "PrirustCislo": specimen.accessionNumber || "",
          "Pohlavi": specimen.genderTypeCode || "",
          "NarozeniDatum": specimen.birthDate || "",
          "PlemKnihaJmeno": specimen.studBookName || "",
          "Chip": specimen.chip || "",
          "Vrub": specimen.notch || "",
          "KrouzekCislo": specimen.ringNumber || "",
          "Cena": specimen.price || "",
          "Jmeno": specimen.name || "",
          "Registrace": specimen.registrationNumber || "",
          "RajonC": specimen.organizationLevelName || "",
        }
      });
    }
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const searchParams = new URL(request.url).searchParams;

  const isVertebrata = searchParams.get("type") === 'vertebrate';
  const minDate = searchParams.get("minDate") || "";
  const maxDate = searchParams.get("maxDate") || "";

  const requestBody = {
    vertebrata: isVertebrata, // Pass vertebrata parameter to API
    dateFrom: minDate,
    dateTo: maxDate
  };

  const apiResponse = await apiCall(
    'api/PrintExports/SpecimensBornInTimeRange',
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<SpeciesItem[]>(apiResponse);
  const exportData = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData);

  const templateTabName = isVertebrata ? "narozeni_pra" : "narozeni_pra_b";

  const templateBlocks = await prepareTemplateBlocks('evidence__narozeni_obdobi.xlsx', templateTabName);

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const dateFromFormatted = minDate.replace(/\//g, "");
  const dateToFormatted = maxDate.replace(/\//g, "");
  const fileName = `w_narozeni_obdobi_${dateFromFormatted}_${dateToFormatted}.xlsx`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
