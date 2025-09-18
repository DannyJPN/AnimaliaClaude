import { LoaderFunctionArgs } from "react-router";
import { fetchODataList } from "~/.server/odata-api";
import { TaxonomySpecimenAutocompleteItem } from "./models";
import { SelectItemType } from "~/shared/models";

export async function loader({ request }: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q") ?? "";
  const speciesId = Number(searchParams.get("speciesId"));
  const genderTypeCode = searchParams.get("genderTypeCode");

  if (!query) {
    return new Response("Query not specified", {
      status: 400
    });
  }

  let filter = `$filter=`;
  const mandatoryFilters = [];
  const searchConditions = [];
  
  // Species ID is always required
  if (speciesId) {
    mandatoryFilters.push(`speciesId eq ${speciesId}`);
  }
  
  // Add gender filter if provided
  if (genderTypeCode) {
    mandatoryFilters.push(`genderTypeCode eq '${genderTypeCode}'`);
  }
  
  const numericQuery = Number(query);
  if (!isNaN(numericQuery)) {
    searchConditions.push(`accessionNumber eq ${numericQuery}`);
  }
  
  searchConditions.push(`contains(zims, '${query}')`);
  searchConditions.push(`contains(cast(accessionNumber, 'Edm.String'), '${query}')`);
  
  const searchFilter = `(${searchConditions.join(' or ')})`;
  
  filter += [...mandatoryFilters, searchFilter].join(' and ');
  
  const [fetchError, listResult] = await fetchODataList<TaxonomySpecimenAutocompleteItem>(
    `specimens?$count=true&$orderby=accessionNumber&$expand=species($select=code,nameLat)&select=id,accessionNumber,zims,genderTypeCode&$top=15&${filter}`
  );

  const autocompleteResults: SelectItemType<number, string>[] = (listResult?.items || []).map((item) => {
    return {
      key: item.id,
      text: [item.accessionNumber?.toString(), item.zims].filter(x => x).join(' ')
    };
  });

  return Response.json(autocompleteResults);
}
