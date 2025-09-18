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
    isRegistrationRequirement?: boolean;
    price?: number;
    cites?: string;

    specimens: {
      id: number;
      speciesId?: number;
      accessionNumber?: number;
      genderTypeCode?: string;
      zims?: string;
      studBookName?: string;
      name?: string;
      notch?: string;
      chip?: string;
      ringNumber?: string;
      registeredDate?: string;
      registrationNumber?: string;
      birthDate?: string;
      inDate?: string;
      inReasonCode?: string;
      inReasonDisplayName?: string;
      inLocationName?: string;
      outDate?: string;
      outReasonCode?: string;
      outReasonDisplayName?: string;
      outLocationName?: string;
      price?: number;
      regionName?: string;
    }[];
  };

  export function toExportBlocks(dataRows: ExportDataRow[]): BlockData[] {
    const blockData: BlockData[] = [];

    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        "SHEET_NAME": "Strana-001"
      }
    });

    blockData.push({
      blockName: 'header',
      data: {}
    });

    // If we have data rows, process them
    if (dataRows && dataRows.length > 0) {
      for (const dataRow of dataRows) {
        blockData.push({
          blockName: 'titul',
          data: {
            "Nazev_LAT": dataRow.nameLat || "",
            "Nazev_CZ": dataRow.nameCz || "",
            "RegPovinnost": dataRow.isRegistrationRequirement ? "Ano" : "",
            "Cena": dataRow.price || 0,
            "CITES": dataRow.cites || "",
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
              "ZIMS": subRow.zims ? parseInt(subRow.zims) : "",
              "Chip": subRow.chip || "",
              "Vrub": subRow.notch || "",
              "KrouzekCislo": subRow.ringNumber || "",
              "Jmeno": subRow.name || "",
              "Registrace": subRow.registrationNumber || "",
              "Cena": subRow.price || 0,
              "RajonC": subRow.regionName || "",
            }
          });
        }

        blockData.push({
          blockName: "END",
          data: {}
        });
      }
    } else {
      // Handle empty data case with a template structure
      blockData.push({
        blockName: 'titul',
        data: {
          "Nazev_LAT": "",
          "Nazev_CZ": "",
          "RegPovinnost": "",
          "Cena": 0,
          "CITES": "",
        }
      });
      
      blockData.push({
        blockName: 'text',
        data: {
          "PrirustCislo": "",
          "Pohlavi": "",
          "PrirustekDatum": "",
          "Prirustek": "",
          "PrirustekMisto": "",
          "NarozeniDatum": "",
          "PlemKnihaJmeno": "",
          "ARKS": "",
          "Chip": "",
          "Vrub": "",
          "KrouzekCislo": "",
          "Jmeno": "",
          "Registrace": "",
          "Cena": 0,
          "RajonC": "",
        }
      });
    }

    return blockData;
  }

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const classId = params.classId ?? "";

  const requestBody = {
    classId: classId,
  };

  const apiResponse = await apiCall(
    "api/PrintExports/InZooBulkNotInState",
    "POST",
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow[]>(apiResponse);

  const exportData: ExportDataRow[] = parsedResponse.item || [];

  const dataBlocks = toExportBlocks(exportData);

  const templateBlocks = await prepareTemplateBlocks('evidence__zijici_h.xlsx', 'zijici_h');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const filenameSuffix = `-${getXlsFileTimestamp()}`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=in-zoo-no-state${filenameSuffix}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
