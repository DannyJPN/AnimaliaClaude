import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type ExportDataRow = {
    decision?: string;
    species: SpeciesDto[];
};

export type SpeciesDto = {
    decision?: string;
    nameCz?: string;
    nameLat?: string;
    cites?: string;
    classis?: string;
    specimens: SpecimenDto[];
};

export type SpecimenDto = {
    accessionNumber?: number;
    genderTypeCode?: string;
    inDate?: string;
    inReasonDisplayName?: string;
    inLocationName?: string;
    birthDate?: string;
    registeredDate?: string;
    studBookName?: string;
    chip?: string;
    ringNumber?: string;
    zims?: string;
    regionName?: string;
    ubication?: string;
};

export function toExportBlocks(dataRows: ExportDataRow[]): BlockData[] {
    const blocks: BlockData[] = [];
    let sheetNumber = 0;

    for (const row of dataRows) {

        const count = dataRows.length;
        const i = count - sheetNumber;
        sheetNumber++;

        blocks.push({
            blockName: 'NEW_SHEET',
            data: {
                "SHEET_NAME": `Strana-${i.toString().padStart(3, '0')}`
            }
        });

        blocks.push({
            blockName: 'header',
            data: {
                "rozhodnuti": row.decision || ""
            }
        });

        for (const species of row.species) {

            blocks.push({
                blockName: 'titul',
                data: {
                    "Nazev_CZ": species.nameCz || "",
                    "Nazev_LAT": species.nameLat || "",
                    "CITES": species.cites || "",
                    "Classis": species.classis || ""
                }
            });

            for (const spec of species.specimens) {
                blocks.push({
                    blockName: 'text',
                    data: {
                        "PrirustCislo": spec.accessionNumber || "",
                        "PrirustMisto": spec.accessionNumber || "",
                        "Pohlavi": spec.genderTypeCode || "",
                        "PrirustekDatum": formatToCzechDate(spec.inDate) || "",
                        "PrirustekMisto": spec.inLocationName || "",
                        "Prirustek": spec.inReasonDisplayName || "",
                        "NarozeniDatum": formatToCzechDate(spec.birthDate) || "",
                        "PlemKnihaJmeno": spec.studBookName || "",
                        "Chip": spec.chip || "",
                        "KrouzekCislo": spec.ringNumber || "",
                        "ZIMS": spec.zims || "",
                        "RajonC": spec.regionName || "",
                        "Ubikace": spec.ubication || ""
                    }
                });
            } 
        }

        blocks.push({
            blockName: 'END',
            data: {}
        });
    }

    return blocks;
}

export async function loader({ request }: LoaderFunctionArgs) {
    await requireLoggedInUser(request);

    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "";

    const requestBody = {
      mode: mode
    };

    const apiResponse = await apiCall(
      "api/PrintExports/InZooBulkByDecision", 
      'POST',
      JSON.stringify(requestBody),
      pziConfig);
    
    const parsed = await processResponse<ExportDataRow[]>(apiResponse);
    const exportData = parsed.item || [];

    const dataBlocks = toExportBlocks(exportData);
    const templateBlocks = await prepareTemplateBlocks('evidence__zijici_hrozh.xlsx', 'zijici_hrozh');
    const [workbook] = await renderPrintExport(templateBlocks, dataBlocks);
    const buffer = await workbook.xlsx.writeBuffer();

     const filenameSuffix = `-${mode}-${getXlsFileTimestamp()}`;

    return new Response(buffer, {
        status: 200,
        headers: {
            "Content-Disposition": `inline;filename=in-zoo-rozhodnuti${filenameSuffix}.xlsx`,
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
    });
}
