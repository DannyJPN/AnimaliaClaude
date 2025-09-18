export type TaxonomyOrderItem = {
  id: number,
  taxonomyClassId: number,
  code?: string,
  nameCz?: string,
  nameLat?: string,
  nameEn?: string,
  nameSk?: string,
  cryptogram?: string,
  note?: string,
  synonyms?: string,
  zooStatus?: string,
  quantityOwned?: number,
  quantityInZoo?: number,
  quantityDeponatedFrom?: number,
  quantityDeponatedTo?: number,
  shortcut?: string,
  modifiedBy?: string,
  modifiedAt?: string
};

export type TaxonomyClassInfoItem = {
  id: number,
  taxonomyPhylumId?: number,
  code?: string,
  nameLat?: string,
  nameCz?: string
};
