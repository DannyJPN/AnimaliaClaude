export type Location = {
  id: number;
  organizationLevelId?: number;
  expositionSetId?: number,
  name?: string;
  objectNumber?: number | null;
  roomNumber?: number | null;
  availableForVisitors?: boolean;
  locationTypeCode?: number;
  areaM2?: number | null;
  capacityM3?: number | null;
  note?: string;
  modifiedAt?: string;
  modifiedBy?: string;
  organizationLevel?: { id: number, name: string }
  expositionSet?: { id: number, name: string }
};
