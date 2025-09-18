import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import exceljs from "exceljs";
import { getXlsFileTimestamp } from "~/utils/date-utils";

type Specimen = {
  id: number;
  accessionNumber?: number;
  genderTypeCode?: string;
  zims?: string;
  name?: string;
  birthDate?: string;
  birthPlace?: string;
  alreadyIncluded: boolean;
  father?: Specimen;
  mother?: Specimen;
};

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
    `api/PrintExports/SpecimenGenealogyTree`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<Specimen>(apiResponse);
  const rootSpecimen = parsedResponse.item!;

  const wb = new exceljs.Workbook();
  const ws = wb.addWorksheet("rodokmen");

  const renderingStack: Specimen[] = [];
  const levelStack: number[] = [];

  let current: Specimen | undefined = rootSpecimen;
  let level = 1;
  let rowIndex = 0;


  while (current || renderingStack.length > 0) {

    while (current) {
      renderingStack.push(current);
      levelStack.push(level);

      current = current.father;
      level += 1;
    }

    current = renderingStack.pop();
    level = levelStack.pop()!;

    rowIndex += 1;

    if (current) {
      const cell = ws.getCell(rowIndex, level);
      cell.value = `${current.alreadyIncluded ? '* ' : ''}${current.accessionNumber || ''}-${current.genderTypeCode || ''}-${current.name || ''} / ${current.birthDate || ''}-${current.birthPlace || ''}`;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
    }

    current = current?.mother;
    level += 1;
  }

  ws.columns.forEach((col) => {
    col.width = 40;
  });

  const xlsxBuffer = await wb.xlsx.writeBuffer();

  return new Response(xlsxBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=rodokmen-${specimenId}_${getXlsFileTimestamp()}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      'Cache-Control': 'no-cache',
    },
  });
}
