export type TaxonomyGenusItem = {
  id: number,
  taxonomyFamilyId: number,
  code?: string,
  nameCz?: string,
  nameLat?: string,
  nameEn?: string,
  nameSk?: string,
  cryptogram?: string,
  // note?: string,
  // synonyms?: string,
  zooStatus?: string,
  quantityOwned?: number,
  quantityInZoo?: number,
  quantityDeponatedFrom?: number,
  quantityDeponatedTo?: number,
  shortcut?: string,
  modifiedBy?: string,
  modifiedAt?: string
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
    nameCz?: string,
    taxonomyClass?: {
      id: number,
      taxonomyPhylumId: number,
      nameLat?: string
      nameCz?: string,
    }
  }
};
