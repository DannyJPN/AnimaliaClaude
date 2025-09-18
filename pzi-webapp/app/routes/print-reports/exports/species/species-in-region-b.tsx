// should be used for inVertebrata, currently we will use zoology/species-in-region for both

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate } from "~/utils/date-utils";

export type ExportDataRow = {
    id: number,
    code?: string,
    name: string,
    sectionName?: string,
    species: {
        id: number,
        nameCz?: string,
        nameLat?: string,
        specimens: {
            id: number,
            accessionNumber?: number,
            genderTypeCode?: string,
            studBookName?: string,
            registeredDate?: string,
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

    var sheetNumber = 0;

    blockData.push({
        blockName: 'NEW_SHEET',
        data: {
            "SHEET_NAME": sheetNumber.toString()
        }
    });
    blockData.push({
        blockName: 'usek',
        data: {
            "Rajon": dataRow.name || "",
            "Kod": dataRow.code || "",
            "Usek": dataRow.sectionName || ""
        }
    });

    for (const speciesRow of dataRow.species) {


        blockData.push({
            blockName: "header",
            data: {}
        });

        blockData.push({
            blockName: 'titul',
            data: {
                "Nazev_CZ": speciesRow.nameCz || "",
                "Nazev_LAT": speciesRow.nameLat || ""
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
                    "Cena": subRow.price || 0,
                    "Registrace": formatToCzechDate(subRow.registeredDate)
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

    const regionId = params.regionId;

    const apiResponse = await apiCall(
        `api/PrintExports/SpeciesInRegionOwned/${regionId}`,
        'GET',
        undefined,
        pziConfig
    );

    const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

    const exportData: ExportDataRow = parsedResponse.item!;

    const dataBlocks = toExportBlocks(exportData);

    const templateBlocks = await prepareTemplateBlocks('evidence.xlsx', 'zijici_u_b');

    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    return new Response(xlsxBuffer, {
        status: 200,
        headers: {
            "Content-Disposition": `inline;filename=speciesinregion-owned.xlsx`,
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
}
