import { fetchODataList } from "~/.server/odata-api";
import { TaxonomyFamilyInfoItem, TaxonomySpecimenInfoItem, TaxonomySpecimenItem, TaxonomySpecimenItemWithFlatRelatedData, TaxonomySpecimenMovementItem, TaxonomySpecimenMovementItemWithFlatRelatedData } from "./models";
import { TaxonomyPhylumInfoItem } from "../models";

export function flattenODataResult(item: TaxonomySpecimenItem): TaxonomySpecimenItemWithFlatRelatedData {
  return {
    ...item,
    father_displayName: item.father
      ? [item.father.accessionNumber?.toString(), item.father.zims].filter(x => x).join(' ')
      : undefined,
    mother_displayName: item.mother
      ? [item.mother.accessionNumber?.toString(), item.mother.zims].filter(x => x).join(' ')
      : undefined,
    inLocation_keyword: item.inLocation?.keyword,
    outLocation_keyword: item.outLocation?.keyword,
    inReason_displayName: item.inReason?.displayName,
    outReason_displayName: item.outReason?.displayName,
    father_species_id: item.father?.speciesId,
    father_species_name: [item.father?.species.nameLat, item.father?.species.nameCz].filter(x => x).join(' / '),
    mother_species_id: item.mother?.speciesId,
    mother_species_name: [item.mother?.species.nameLat, item.father?.species.nameCz].filter(x => x).join(' / '),
  } as TaxonomySpecimenItemWithFlatRelatedData;
};

export function flattenODataMovementsResult(item: TaxonomySpecimenMovementItem): TaxonomySpecimenMovementItemWithFlatRelatedData {
  return {
    ...item,
    incrementReason_displayName: item.incrementReason?.displayName,
    decrementReason_displayName: item.decrementReason?.displayName,
    contract_number: item.contract?.number,
    partner_keyword: item.partner?.keyword
  } as TaxonomySpecimenMovementItemWithFlatRelatedData;
};

export async function fetchSpecimenSubViewParents(specimenId: number) {
  const [parentFetchError, parentResult] = await fetchODataList<TaxonomySpecimenInfoItem>(
    `specimens?$filter=id eq ${specimenId}&$expand=species($select=id,nameLat,nameCz,taxonomyGenusId;$expand=taxonomyGenus($select=id,nameLat,nameCz,taxonomyFamilyId))`
  );

  const [parentFamilyFetchError, parentFamilyResult] = await fetchODataList<TaxonomyFamilyInfoItem>(
    `taxonomyfamilies?$filter=id eq ${parentResult?.items[0].species?.taxonomyGenus?.taxonomyFamilyId}&$expand=taxonomyOrder($select=id,nameLat,nameCz;$expand=taxonomyClass($select=id,taxonomyPhylumId,nameLat,nameCz))`
  );

  const [phylaFetchError, parentPhylaResult] = await fetchODataList<TaxonomyPhylumInfoItem>(
    `taxonomyphyla?$filter=id eq ${parentFamilyResult?.items[0].taxonomyOrder?.taxonomyClass?.taxonomyPhylumId}`
  );

  return [parentResult, parentPhylaResult, parentFamilyResult] as const;
};
