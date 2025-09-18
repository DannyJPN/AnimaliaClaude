import { LoaderFunctionArgs } from "react-router";
import { apiCall, processResponse } from "~/.server/api-actions";
import { renderDocxPrintExport } from "~/.server/print-templates/docx-template-exports";
import { pziConfig } from "~/.server/pzi-config";
import { requireLoggedInUser } from "~/.server/user-session";
import { formatToCzechDate, getXlsFileTimestamp } from "~/utils/date-utils";

type SpecimenRegisteredEuPermitResponse = {
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
  const origin = url.searchParams.get("origin") || null;

  if (specimenId === null) {
    return new Response("specimenId not specified", {
      status: 400
    });
  }

  const requestBody = {
    specimenId,
    formType: 'permit',
    origin: origin
  };

  const apiResponse = await apiCall(
    `api/PrintExports/SpecimenRegisteredEUPermit`,
    'POST',
    JSON.stringify(requestBody),
    pziConfig
  );

  const parsedResponse = await processResponse<SpecimenRegisteredEuPermitResponse>(apiResponse);
  const permitData = parsedResponse.item!;

  const parentsRegistration: string[] = [
    permitData.fatherRegistrationNumber ? `M - ${permitData.fatherRegistrationNumber}` : '',
    permitData.motherRegistrationNumber ? `F - ${permitData.motherRegistrationNumber}` : ''
  ];

  const parentsEU: string[] = [
    permitData.fatherEuPermit ? `M - ${permitData.fatherEuPermit}` : '',
    permitData.motherEuPermit ? `F - ${permitData.motherEuPermit}` : ''
  ];

  const data = {
    'g$user': pziConfig.GVAR_USER,
    'g$street': pziConfig.GVAR_STREET,
    'g$psc2': pziConfig.GVAR_PSC2,
    'g$city2': pziConfig.GVAR_CITY2,
    'g$admin': pziConfig.GVAR_ADMIN,
    'g$userNick': pziConfig.GVAR_USERNICK,
    'Pohlavi': permitData.genderTypeCode,
    'ARKS': permitData.zims,
    'DatumNarozeni': formatToCzechDate(permitData.birthDate),
    'MistoNarozeni': permitData.birthPlace  || '',
    'Chip': permitData.chip ? `čip: ${permitData.chip}` : '',
    'Krouzek': permitData.ringNumber ? `kroužek: ${permitData.ringNumber}` : '',
    'RodiceReg': parentsRegistration.join(' '),
    'RodiceEU': parentsEU.join(' '),
    'registrace': permitData.registrationNumber || '',
    'CITES': permitData.citeType || '',
    'Puvod': permitData.origin || '',
    'CITES_vyvoz': permitData.citesExport || '',
    'EU': permitData.euCode || '',
    'MistoPuvodu': permitData.partnerCountry || '',
    'Nazev_LAT': permitData.speciesNameLat || '',
    'Nazev_CZ': permitData.speciesNameCz || '',
    'EUpermit': permitData.euPermit || '',
  };

  const exportBuffer = await renderDocxPrintExport("EU_permit-2022.docx", data);

  return new Response(exportBuffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Disposition": `inline;filename=EU_permit-${specimenId}-${getXlsFileTimestamp()}.docx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      'Cache-Control': 'no-cache',
    },
  });
}
