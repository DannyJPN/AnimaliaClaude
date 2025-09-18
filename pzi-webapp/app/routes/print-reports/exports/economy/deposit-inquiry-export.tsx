import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

export type DepositMovementDto = {
  specimenId: number;
  movementDate?: string;
  gender?: string;
  accessionNumber?: number;
  speciesNameLat?: string;
  speciesNameCz?: string;
};

export type DepositDto = {
  partnerKeyword: string;
  partnerName?: string;
  partnerStreetAddress?: string;
  partnerPostalCode?: string;
  partnerCity?: string;
  partnerCountry?: string;
  depositsTo: DepositMovementDto[];
  depositsFrom: DepositMovementDto[];
};

export type ResponseDto = {
  deposits: DepositDto[];
};

export function toExportBlocks(
  deposits: DepositDto[],
  language: string
): BlockData[] {
  const blockData: BlockData[] = [];
  const today = new Date().toLocaleDateString('cs-CZ');

  for (const deposit of deposits) {
    // Sheet name block
    blockData.push({
      blockName: 'NEW_SHEET',
      data: {
        SHEET_NAME: /* deposit.partnerKeyword || deposit.partnerName ||  */'Partner'
      }
    });

    // Partner header block
    const headerData: any = {
      Nazev: deposit.partnerName || '',
      UliceCis: deposit.partnerStreetAddress || '',
      PSC: deposit.partnerPostalCode || '',
      Mesto: deposit.partnerCity || '',
      dnes: today
    };
    
    // Add country only for non-CZ version
    if (language !== 'cz') {
      headerData.Stat = deposit.partnerCountry || '';
    }
    
    blockData.push({
      blockName: 'depHead',
      data: headerData
    });

    // Deposits TO partner (deponace do)
    if (deposit.depositsTo.length > 0) {
      blockData.push({
        blockName: 'depText0',
        data: {}
      });

      deposit.depositsTo.forEach((movement) => {
        const blockData_item: any = {
          Datum: movement.movementDate ? formatToCzechDate(movement.movementDate) : '',
          Pohlavi: movement.gender || '',
          PrirustCislo: movement.accessionNumber || '',
          Nazev_LAT: movement.speciesNameLat || ''
        };
        
        // Add Czech name only for CZ version
        if (language === 'cz') {
          blockData_item.Nazev_CZ = movement.speciesNameCz || '';
        }
        
        blockData.push({
          blockName: 'deponace',
          data: blockData_item
        });
      });

      blockData.push({
        blockName: 'depText1',
        data: {}
      });
    }

    // Deposits FROM partner (deponace z)
    if (deposit.depositsFrom.length > 0) {
      blockData.push({
        blockName: 'depText2',
        data: {}
      });

      deposit.depositsFrom.forEach((movement) => {
        const blockData_item: any = {
          Datum: movement.movementDate ? formatToCzechDate(movement.movementDate) : '',
          Pohlavi: movement.gender || '',
          PrirustCislo: movement.accessionNumber || '',
          Nazev_LAT: movement.speciesNameLat || ''
        };
        
        // Add Czech name only for CZ version
        if (language === 'cz') {
          blockData_item.Nazev_CZ = movement.speciesNameCz || '';
        }
        
        blockData.push({
          blockName: 'deponace',
          data: blockData_item
        });
      });
    }

    // Partner footer block
    blockData.push({
      blockName: 'depBotton',
      data: {}
    });
  }

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const language = url.searchParams.get("language") || "cz";
  const partnerId = url.searchParams.get("partnerId");

  if (!language || (language !== "cz" && language !== "eng")) {
    throw new Error('Invalid language parameter. Must be "cz" or "eng".');
  }

  if (!partnerId) {
    throw new Error('PartnerId parameter is required.');
  }

  const requestBody = {
    partnerId: parseInt(partnerId)
  };

  try {
    const apiResponse = await apiCall(
      `api/PrintExports/DepositInquiry`,
      'POST',
      JSON.stringify(requestBody),
      pziConfig
    );

    const parsedResponse = await processResponse<ResponseDto>(apiResponse);

    if (!parsedResponse.item || !parsedResponse.item.deposits || parsedResponse.item.deposits.length === 0) {
      throw new Response("No deposit data found for the specified parameters", {
        status: 404,
      });
    }

    const exportData = parsedResponse.item.deposits;
    const dataBlocks = toExportBlocks(exportData, language);
    
    // Use the appropriate template based on language
    const templateName = `deponace2_${language}`;
    const sheetName = language;
    
    const templateBlocks = await prepareTemplateBlocks(`${templateName}.xlsx`, sheetName);
    const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

    const xlsxBuffer = await wb.xlsx.writeBuffer();

    const fileName = `w_dotazdeponace_${language}_${getXlsFileTimestamp()}.xlsx`;

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename=${fileName}`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error generating deposit inquiry Excel file:', error);
    throw new Response('Error generating deposit inquiry Excel file', { status: 500 });
  }
}
