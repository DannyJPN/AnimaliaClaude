export type Contract = {
  id: number,
  number?: string,
  date?: string,
  movementReasonCode?: string,
  contractTypeCode?: string,
  partnerId?: number,
  note?: string,
  notePrague?: string,
  notePartner?: string,
  year?: number,
  modifiedBy?: string,
  modifiedAt?: string,
  partner?: {
    keyword?: string
  },
  movementReason?: {
    displayName?: string
  },
  contractType?: {
    displayName?: string
  }
};

export type ContractWithRelatedData = Contract & {
  partner_keyword?: string,
  movementReason_displayName?: string,
  contractType_displayName?: string
};

export type DocumentMovement = {
  id: number,
  specimenId: number,
  date: string,
  accountingDate?: string,
  quantity: number,
  quantityActual: number,
  incrementReasonName?: string,
  decrementReasonName?: string,
  locationName?: string,
  gender?: string,
  price?: number,
  priceFinal?: number,
  depType?: string,
  speciesNameLat?: string,
  accessionNumber?: string,
  name?: string,
  note?: string,
  contractNote?: string
}

export type ContractAction = {
  id: number,
  contractId: number,
  date?: string,
  actionTypeCode?: string,
  actionInitiatorCode?: string,
  note?: string,
  modifiedBy?: string,
  modifiedAt?: string,
  actionType?: {
    code?: string,
    displayName?: string
  },
  actionInitiator?: {
    code?: string,
    displayName?: string
  }
}
