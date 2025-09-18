/* */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate } from "~/utils/date-utils";

export type ExportDataRow = {
    kod?: string,
    rajon: string,
    usek?: string,
    date?: string,
    classes: {
        id: number,
        trida_CZ?: string,
        trida_LAT?: string,
        species: {
            id: number,
            taxonomyClassId: number,
            druh_CZ?: string,
            druh_LAT?: string,
            livingM?: string,
            livingF?: string,
            livingU?: string,
            sumPrice?: number,
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
        blockName: 'rajon',
        data: {
            "Kod": dataRow.kod || "",
            "Rajon": dataRow.rajon || "",
            "Usek": dataRow.usek || ""
        }
    });
    blockData.push({
        blockName: 'titul',
        data: {
            "KeDni": formatToCzechDate(dataRow.date)
        }
    });

    for (const classRow of dataRow.classes) {
        blockData.push({
            blockName: 'trida',
            data: {
                "Trida_CZ": classRow.trida_CZ || "",
                "Trida_LAT": classRow.trida_LAT || "",
            }
        });

        for (const speciesRow of classRow.species) {
            blockData.push({
                blockName: 'text',
                data: {
                    "Druh_CZ": speciesRow.druh_CZ || "",
                    "Druh_LAT": speciesRow.druh_LAT || "",
                    "LivingM": speciesRow.livingM || "",
                    "LivingF": speciesRow.livingF || "",
                    "LivingU": speciesRow.livingU || "",
                    "SumPrice": speciesRow.sumPrice || 0
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

export async function loader({ request }: LoaderFunctionArgs) {
    await requireLoggedInUser(request);
    const searchParams = new URL(request.url).searchParams;
    const regionId = searchParams.get("regionid") ?? "";
    const todayDate = searchParams.get("date") ?? "";
    
    const apiResponse = await apiCall(
        `api/PrintExports/RegionInventory?regionId=${regionId}&date=${todayDate}`,
        'GET',
        undefined,
        pziConfig
    );

    const parsedResponse = await processResponse<ExportDataRow>(apiResponse);

    const exportData: ExportDataRow = parsedResponse.item!;

    const dataBlocks = toExportBlocks(exportData);

    const templateBlocks = await prepareTemplateBlocks('evidence.xlsx', 'stavKeDni_rajon');

    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    return new Response(xlsxBuffer, {
        status: 200,
        headers: {
            "Content-Disposition": `inline;filename=region-inventory.xlsx`,
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
}
