import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { BlockData, prepareTemplateBlocks, renderPrintExport } from "~/.server/print-templates/xls-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

type ApiCallResultRow = {
  movements: {
    zims?: string,
    birthDate?: string,
    birthPlace?: string,
    fatherZims?: string,
    motherZims?: string,
    genderTypeCode?: string,
    movementDate?: string,
    incrementDisplayName?: string,
    decrementDisplayName?: string,
    partnerDisplayName?: string,
    specimenName?: string,
    studBookName?: string,
    specimenMarking?: string
  }[],
  nameLat?: string,
  nameCz?: string
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  var url = new URL(request.url);

  const dateRange = url.searchParams.get("dateRange");
  const isVertebrate = url.searchParams.get("isVertebrate");

  const apiResponse = await apiCall(
    'api/PrintExports/ZoologySpecimensForArksInTimeRange',
    'POST',
    JSON.stringify({
      dateRange,
      isVertebrate: isVertebrate === 'true'
    }),
    pziConfig
  );

  const parsedResponse = await processResponse<ApiCallResultRow[]>(apiResponse);

  const templateBlocks = await prepareTemplateBlocks('sestavaARKS.xlsx', 'ARKS');

  const dataBlocks: BlockData[] = [];

  dataBlocks.push({
    blockName: "titul",
    data: {}
  });

  for (const species of (parsedResponse.item || [])) {
    dataBlocks.push({
      blockName: "druh",
      data: {
        Nazev_lat: species.nameLat || "",
        Nazev_cz: species.nameCz || ""
      }
    });

    for (const movement of species.movements) {
      dataBlocks.push({
        blockName: "record",
        data: {
          ARKS: movement.zims || "",
          NarozeniDatum: formatToCzechDate(movement.birthDate),
          NarozeniMisto: movement.birthPlace || "",
          otecARKS: movement.fatherZims || "",
          matkaARKS: movement.motherZims || "",
          Pohlavi: movement.genderTypeCode || "",
          Prirustek: movement.incrementDisplayName || "",
          Datum: formatToCzechDate(movement.movementDate),
          Heslo: movement.partnerDisplayName || "",
          Jmeno: movement.specimenName || "",
          PlemKnihaJmeno: movement.studBookName || "",
          znaceni: movement.specimenMarking || "",
          smer: movement.incrementDisplayName
            ? "+"
            : "-",
          Ubytek: movement.decrementDisplayName || ""
        }
      });
    }
  }

  const [wb] = await renderPrintExport(templateBlocks, dataBlocks);
  const xlsxBuffer = await wb.xlsx.writeBuffer();

  const fileName = `gw_ARKS_${getXlsFileTimestamp()}`;

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=${fileName}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-cache"
    },
  });
}