export interface Specimens {
    // Specimen properties
    id: number;
    accessionNumber?: number;
    genderTypeCode?: string;
    classificationTypeCode: string;
    zims?: string;
    studBookNumber?: string;
    studBookName?: string;
    name?: string;
    notch?: string;
    chip?: string;
    ringNumber?: string;
    otherMarking?: string;
    isHybrid: boolean;
    location?: string;
    birthDate?: string;
    birthPlace?: string;
    birthMethod?: string;
    rearing?: string;
    fatherId?: number;
    motherId?: number;
    note?: string;
    otherDetails?: string;
    registeredDate?: string;
    registeredTo?: string;
    registrationNumber?: string;
    cadaverDate?: string;
    cadaverPlace?: string;
    euPermit?: string;
    czechRegistrationNumber?: string;
    fatherZims?: string;
    motherZims?: string;
    documentation?: string;
    ueln?: string;
    modifiedBy?: string;
    modifiedAt?: string;
    
    // Movement data
    inDate?: string;
    inReasonCode?: string;
    inLocationId?: number;
    outDate?: string;
    outReasonCode?: string;
    outLocationId?: number;
    price?: number;
    
    // Quantity data
    quantityOwned: number;
    quantityInZoo: number;
    quantityDeponatedFrom: number;
    quantityDeponatedTo: number;
    
    // Placement data
    placementLocationId?: number;
    organizationLevelId?: number;
    
    // Species and Taxonomy properties
    speciesId: number;
    speciesNameCz?: string;
    speciesNameLat?: string;
    speciesCode?: string;
    speciesNameEn?: string;
    speciesSynonyms?: string;
    speciesIsEuFauna?: boolean;
    speciesIsRegulationRequirement?: boolean;
    
    // Taxonomy Genus
    genusId: number;
    genusNameCz?: string;
    genusNameLat?: string;
    
    // Taxonomy Family
    familyId: number;
    familyNameCz?: string;
    familyNameLat?: string;
    familySynonyms?: string;
    
    // Taxonomy Order
    orderId: number;
    orderNameCz?: string;
    orderNameLat?: string;
    orderCode?: string;
    orderNameEn?: string;
    orderSynonyms?: string;
    
    // Taxonomy Class
    classId: number;
    classNameCz?: string;
    classNameLat?: string;
    
    // Taxonomy Phylum
    phylumId?: number;
    phylumNameCz?: string;
    phylumNameLat?: string;
    
    // Exposition hierarchy
    locationName?: string;
    expositionSetId?: number;
    expositionSetName?: string;
    expositionAreaId?: number;
    expositionAreaName?: string;
    
    // Organization hierarchy
    districtId?: number;
    districtName?: string;
    workplaceId?: number;
    workplaceName?: string;
    departmentId?: number;
    departmentName?: string;
}

export interface PagedSpecimensResponse {
    items?: Specimens[];
    totalCount?: number;
    pageIndex?: number;
    pageSize?: number;
}