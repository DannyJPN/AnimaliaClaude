/* Sestavy / Ekonomika - Obálka Export */

import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { getXlsFileTimestamp } from "~/utils/date-utils";

type EnvelopeData = {
  senderName: string;
  senderStreet: string;
  senderCityPostal: string;
  recipientCompany: string;
  recipientName: string;
  recipientStreet: string;
  recipientPostalCode: string;
  recipientCity: string;
  recipientCountry: string;
};

function toExportBlocks(envelopeData: EnvelopeData): BlockData[] {
  const blockData: BlockData[] = [];

  blockData.push({
    blockName: 'NEW_SHEET',
    data: {
      "SHEET_NAME": "Obalka-O"
    }
  });

  // Block obalka_a - without PrijFirma
  blockData.push({
    blockName: 'obalka_a',
    data: {
      "OdesJmeno": envelopeData.senderName || "",
      "OdesUliceCis": envelopeData.senderStreet || "",
      "OdesPSCMesto": envelopeData.senderCityPostal || "",
      "PrijJmeno": envelopeData.recipientName || "",
      "PrijUliceCis": envelopeData.recipientStreet || "",
      "PrijPSC": envelopeData.recipientPostalCode || "",
      "PrijMesto": envelopeData.recipientCity || "",
      "PrijStat": envelopeData.recipientCountry || ""
    }
  });

  // Block obalka_b - with PrijFirma
  blockData.push({
    blockName: 'obalka_b',
    data: {
      "OdesJmeno": envelopeData.senderName || "",
      "OdesUliceCis": envelopeData.senderStreet || "",
      "OdesPSCMesto": envelopeData.senderCityPostal || "",
      "PrijFirma": envelopeData.recipientCompany || "",
      "PrijJmeno": envelopeData.recipientName || "",
      "PrijUliceCis": envelopeData.recipientStreet || "",
      "PrijPSC": envelopeData.recipientPostalCode || "",
      "PrijMesto": envelopeData.recipientCity || "",
      "PrijStat": envelopeData.recipientCountry || ""
    }
  });

  // Block obalka_c - with PrijFirma
  blockData.push({
    blockName: 'obalka_c',
    data: {
      "OdesJmeno": envelopeData.senderName || "",
      "OdesUliceCis": envelopeData.senderStreet || "",
      "OdesPSCMesto": envelopeData.senderCityPostal || "",
      "PrijFirma": envelopeData.recipientCompany || "",
      "PrijJmeno": envelopeData.recipientName || "",
      "PrijUliceCis": envelopeData.recipientStreet || "",
      "PrijPSC": envelopeData.recipientPostalCode || "",
      "PrijMesto": envelopeData.recipientCity || "",
      "PrijStat": envelopeData.recipientCountry || ""
    }
  });

  return blockData;
}

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId");
  const zooId = url.searchParams.get("zooId");

  if (!partnerId && !zooId) {
    return new Response("Either partnerId or zooId parameter is required", {
      status: 400,
    });
  }

  const requestBody = JSON.stringify({
    partnerId: partnerId ? parseInt(partnerId) : null,
    zooId: zooId,
  });

  const apiResponse = await apiCall(
    'api/PrintExports/CorrespondenceEnvelope',
    'POST',
    requestBody,
    pziConfig
  );

  const parsedResponse = await processResponse<EnvelopeData>(apiResponse);
  const exportData: EnvelopeData = parsedResponse.item!;

  const dataBlocks = toExportBlocks(exportData);
  const templateBlocks = await prepareTemplateBlocks('obalky__Obalka-O.xlsx', 'Obalka-O');

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const filenameSuffix = partnerId ? `-partner-${partnerId}` : `-zoo-${zooId}`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="obalka${filenameSuffix}.xlsx"`,
    },
  });
}
