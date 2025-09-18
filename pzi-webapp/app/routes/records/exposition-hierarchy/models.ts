export interface ExpositionArea {
  id: number;
  name: string;
  note?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  expositionSets?: ExpositionSet[];
}

export interface ExpositionSet {
  id: number;
  name: string;
  note?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  expositionAreaId: number;
  expositionArea?: ExpositionArea;
}