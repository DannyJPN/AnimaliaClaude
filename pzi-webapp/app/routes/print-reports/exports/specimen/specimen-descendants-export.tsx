import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { getXlsFileTimestamp } from "~/utils/date-utils";

type Partner = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  zims?: string;
  name?: string;
  birthDate?: string;
  birthPlace?: string;
};

type Child = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  zims?: string;
  name?: string;
  birthDate?: string;
  birthPlace?: string;
};

type DescendantsWithPartner = {
  partner?: Partner;
  descendants: Child[];
};

type Specimen = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  zims?: string;
  name?: string;
  birthDate?: string;
  birthPlace?: string;
};

type ExportDataRow = {
  specimen: Specimen;
  descendantsWithPartners: DescendantsWithPartner[];
};

export function toExportBlocks(dataRow: ExportDataRow): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Potomci"
    }
  });

  var parent1male = dataRow.specimen.genderTypeCode?.startsWith('M') || false;

  blockData.push({
    blockName: 'title',
    data: {
      'PARENT1': parent1male
        ? 'Otec'
        : 'Matka',
      'PARENT2': parent1male
        ? 'Matka'
        : 'Otec'
    }
  });

  blockData.push({
    blockName: 'parent1_row',
    data: {
      'PARENT1_MAIN_ROW': `${dataRow.specimen.accessionNumber || ''}-${dataRow.specimen.genderTypeCode || ''}-${dataRow.specimen.name || ''}`,
      'PARENT1_SUB_ROW': `${dataRow.specimen.birthDate || ''}-${dataRow.specimen.birthPlace || ''}`
    }
  });

  for (const row of dataRow.descendantsWithPartners) {
    const partner = row.partner;

    blockData.push({
      blockName: 'parent2_row',
      data: {
        'PARENT2_MAIN_ROW': !partner
          ? 'neznámy'
          : `${partner.accessionNumber || ''}-${partner.genderTypeCode || ''}-${partner.name || ''}`,
        'PARENT2_SUB_ROW': !partner
          ? '-'
          : `${partner.birthDate || ''}-${partner.birthPlace || ''}`
      }
    });

    for (const descendant of row.descendants) {
      blockData.push({
        blockName: 'descendant_row',
        data: {
          'DESCENDANT_MAIN_ROW': `${descendant.accessionNumber || ''}-${descendant.genderTypeCode || ''}-${descendant.name || ''}`,
          'DESCENDANT_SUB_ROW': `${descendant.birthDate || ''}-${descendant.birthPlace || ''}`
        }
      });
    }
  }


  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const specimenId = url.searchParams.get("specimenId") || null;

  if (!specimenId) {
    throw new Error("Specimen ID is required");
  }

  const requestBody = {
    specimenId: parseInt(specimenId)
  };

  const apiResponse = await apiCall(
    `api/PrintExports/SpecimenDescendants`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<ExportDataRow>(apiResponse);
  const exportData = parsedResponse.item!;

  // Use a template for descendants report
  const templateBlocks = await prepareTemplateBlocks('specimen__descendants.xlsx', 'descendants');

  const blocks = toExportBlocks(exportData);
  const [wb] = await renderPrintExport(templateBlocks, blocks);
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=specimen_descendants_${specimenId}_${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      'Cache-Control': 'no-cache',
    },
  });
}
