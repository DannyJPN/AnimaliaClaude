export type TaxonomySpecimenItem = {
  id: number,
  speciesId: number,
  accessionNumber?: number,
  genderTypeCode?: string,
  classificationTypeCode?: string,
  zims?: string,
  studBookNumber?: string,
  studBookName?: string,
  name?: string,
  isHybrid?: boolean,
  registrationNumber?: string,
  registeredDate?: string,
  registeredTo?: string,
  euPermit?: string,
  czechregistrationNumber?: string,
  ueln?: string,
  notch?: string,
  chip?: string,
  ringNumber?: string,
  otherMarking?: string,
  birthDate?: string,
  birthPlace?: string,
  birthMethod?: string,
  rearing?: string,
  fatherId?: number,
  fatherZims?: string,
  motherId?: number,
  motherZims?: string,
  note?: string,
  modifiedBy?: string,
  modifiedAt?: string,
  father?: {
    id: number,
    accessionNumber?: number,
    zims?: string,
    speciesId: number,
    species: {
      code?: string,
      nameLat?: string,
      nameCz?: string
    }
  },
  mother?: {
    id: number,
    accessionNumber?: number,
    zims?: string,
    speciesId: number,
    species: {
      code?: string,
      nameLat?: string,
      nameCz?: string
    }
  },
  inDate?: string,
  inLocationId?: string,
  inReasonCode?: string,
  outDate?: string,
  outLocationId?: string,
  outReasonCode?: string,
  price?: number,
  quantity?: number,
  quantityOwned?: number,
  quantityInZoo?: number,
  quantityDeponatedFrom?: number,
  quantityDeponatedTo?: number,
  inLocation?: {
    keyword?: string
  },
  outLocation?: {
    keyword?: string
  },
  inReason?: {
    displayName?: string
  },
  outReason?: {
    displayName?: string
  },
  images?: { id: number }[]
};

export type TaxonomySpecimenItemWithFlatRelatedData = TaxonomySpecimenItem & {
  father_displayName?: string,
  mother_displayName?: string,
  father_species_id?: number,
  father_species_name?: string,
  mother_species_id?: number,
  mother_species_name?: string,
  inLocation_keyword?: string,
  outLocation_keyword?: string,
  inReason_displayName?: string,
  outReason_displayName?: string
};

export type TaxonomySpeciesInfoItem = {
  id: number,
  taxonomyGenusId: number,
  code?: string,
  nameLat?: string,
  nameCz?: string,
  taxonomyGenus?: {
    id: number,
    nameLat?: string,
    nameCz?: string,
    taxonomyFamilyId: number
  }
};

export type TaxonomyFamilyInfoItem = {
  id: number,
  taxonomyOrderId: number,
  code?: string,
  nameLat?: string,
  nameCz?: string,
  taxonomyOrder?: {
    id: number,
    nameLat?: string,
    nameCz: string,
    taxonomyClass?: {
      id: number,
      taxonomyPhylumId: number,
      nameLat?: string,
      nameCz?: string
    }
  }
};

export type TaxonomySpecimenInfoItem = {
  id: number,
  speciesId: number,
  accessionNumber?: number,
  zims?: string,
  genderTypeCode?: string,
  name?: string,
  classificationTypeCode?: string,
  isHybrid?: boolean,
  species?: {
    id: number,
    nameLat?: string,
    nameCz?: string,
    taxonomyGenusId: number,
    taxonomyGenus?: {
      id: number,
      nameLat?: string,
      nameCz?: string,
      taxonomyFamilyId: number
    }
  }
};

export type TaxonomySpecimenMovementItem = {
  id: number
  contractId?: number,
  contractNote?: string,
  contractNumber?: string,
  modifiedAt?: string,
  modifiedBy?: string,
  date: string,
  decrementReasonCode?: string,
  depType?: string,
  gender?: string,
  incrementReasonCode?: string,
  accountingDate?: string,
  locationId?: number,
  note?: string,
  price?: number,
  priceFinal?: number,
  quantity: number,
  quantityActual: number,
  specimenId: number,
  incrementReason?: {
    code: string,
    displayName: string
  },
  decrementReason?: {
    code: string,
    displayName: string
  },
  contract?: {
    id: number,
    number: string
  },
  partner?: {
    id: number,
    keyword: string
  }
};

export type TaxonomySpecimenMovementItemWithFlatRelatedData = TaxonomySpecimenMovementItem & {
  incrementReason_displayName?: string,
  decrementReason_displayName?: string,
  contract_number?: string,
  partner_keyword?: string
};

export type TaxonomySpecimenAutocompleteItem = {
  id: number,
  accessionNumber?: number,
  zims?: string,
  species: {
    code?: string,
    nameLat?: string
  }
};

export type TaxonomySpeciesAutocompleteItem = {
  id: number,
  nameLat?: string,
  nameCz?: string
};

export type ContractAutocompleteItem = {
  id: number,
  number: string
};

export type SpecimenPlacementItem = {
  id: number;
  specimenId: number;
  validSince?: string;
  locationId?: number;
  organizationLevelId?: number;
  note?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  location?: {
    id: number;
    name: string;
  };
  organizationLevel?: {
    id: number;
    name: string;
  };
};

export type SpecimenPlacementFlattened = SpecimenPlacementItem & {
  location_name?: string;
  organizationLevel_name?: string;
};

export type TaxonomySpecimenRecordItem = {
  id: number
  specimenId: number,
  date: string,
  actionTypeCode?: string,
  note?: string,
  partnerId?: number,
  modifiedBy?: string,
  modifiedAt?: string,
  actionType?: {
    code: string,
    displayName: string
  },
  partner?: {
    id: number,
    accessionNumber?: number,
    zims?: string,
    speciesId: number,
    species: {
      code?: string,
      nameLat?: string,
      nameCz?: string
    }
  }
};

export type TaxonomySpecimenRecordItemWithRelations = {
  actionType_displayName?: string
  partner_displayName?: string,
  partner_species_id?: number,
  partner_species_name?: string,
} & TaxonomySpecimenRecordItem;

export type TaxonomySpecimenMarkingItem = {
  id: number,
  specimenId: number,
  markingTypeCode?: string,
  ringNumber?: string,
  color?: string,
  side?: string,
  locatedOn?: string,
  isValid: boolean,
  markingDate?: string,
  note?: string,
  modifiedBy?: string,
  modifiedAt?: string,
  markingType?: {
    code: string,
    displayName: string
  }
};

export type TaxonomySpecimenMarkingItemWithRelations = TaxonomySpecimenMarkingItem & {
  markingType_displayName?: string
};

export type TaxonomySpecimenCadaverItem = {
  id: number,
  specimenId: number,
  date?: string,
  location?: string,
  note?: string
};

export type TaxonomySpecimenCadaverItemWithRelations = TaxonomySpecimenCadaverItem & {};

export type TaxonomySpecimenDocumentItem = {
  id: number,
  specimenId: number,
  documentTypeCode?: string,
  number?: string,
  date?: string,
  partner?: string,
  note?: string,
  isValid: boolean,
  modifiedBy?: string,
  modifiedAt?: string,
  documentType?: {
    code: string,
    displayName: string
  }
};

export type TaxonomySpecimenDocumentItemWithRelations = TaxonomySpecimenDocumentItem & {
  documentType_displayName?: string
};
