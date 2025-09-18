import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { renderDocxPrintExport } from "~/.server/print-templates/docx-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

type SpecimenRegistrationResponse = {
  id: number,
  genderTypeCode: string,
  zims: string,
  chip: string,
  notch: string,
  ringNumber: string,
  otherMarking: string,
  registrationNumber: string,
  euPermit: string,
  birthDate: string,
  birthPlace: string,
  speciesId: number,
  speciesNameCz: string,
  speciesNameLat: string,
  citeType: string,
  euCode: string,
  fatherId: number
  fatherRegistrationNumber: string,
  fatherEuPermit: string,
  motherId: number,
  motherRegistrationNumber: string,
  motherEuPermit: string,
  citesImport: string,
  citesExport: string,
  acquisitionDate: string,
  incrementReason: string,
  partnerCountry: string,
  origin: string
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireLoggedInUser(request);

  const url = new URL(request.url);
  const specimenId = url.searchParams.get("specimenId") || null;

  if (specimenId === null) {
    return new Response("specimenId not specified", {
      status: 400
    });
  }

  const requestBody = {
    specimenId,
    formType: 'permit'
  };

  const apiResponse = await apiCall(
    `api/PrintExports/SpecimenRegisteredEUPermit`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<SpecimenRegistrationResponse>(apiResponse);
  const permitData = parsedResponse.item!;

  const parentsRegistration: string[] = [
    permitData.fatherRegistrationNumber ? `M - ${permitData.fatherRegistrationNumber}` : '',
    permitData.motherRegistrationNumber ? `F - ${permitData.motherRegistrationNumber}` : ''
  ];

  const data = {
    'g$user': pziConfig.GVAR_USER,
    'g$address': pziConfig.GVAR_ADDRESS,
    'g$admin': pziConfig.GVAR_ADMIN,
    'g$email': pziConfig.GVAR_EMAIL,
    'g$phone': pziConfig.GVAR_PHONE,
    'Pohlavi': permitData.genderTypeCode,
    'ARKS': permitData.zims,
    'DatumNarozeni': formatToCzechDate(permitData.birthDate),
    'MistoNarozeni': permitData.birthPlace,
    'Chip': permitData.chip ? `čip: ${permitData.chip}` : '',
    'Krouzek': permitData.ringNumber ? `kroužek: ${permitData.ringNumber}` : '',
    'RodiceReg': parentsRegistration.join(' '),
    'CITES_vyvoz': permitData.citesExport,
    'CITES_dovoz': permitData.citesImport,
    'MistoPuvodu': permitData.partnerCountry,
    'Nazev_LAT': permitData.speciesNameLat,
    'Nazev_CZ': permitData.speciesNameCz,
    'EUpermit': permitData.euPermit,
    'DatumZiskani': formatToCzechDate(permitData.acquisitionDate)
  };

  const exportBuffer = await renderDocxPrintExport("Registrace-2022.docx", data);

  return new Response(exportBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=Registrace-${specimenId}-${getXlsFileTimestamp()}.docx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      'Cache-Control': 'no-cache',
    },
  });
}
