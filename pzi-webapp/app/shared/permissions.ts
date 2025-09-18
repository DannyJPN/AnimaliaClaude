export const RECORDS_VIEW = "RECORDS:VIEW" as const;
export const RECORDS_EDIT = "RECORDS:EDIT" as const;
export const LISTS_VIEW = "LISTS:VIEW" as const;
export const LISTS_EDIT = "LISTS:EDIT" as const;
export const DOCUMENTATION_DEPARTMENT = "DOCUMENTATION_DEPARTMENT" as const;
export const JOURNAL_ACCESS = "JOURNAL:ACCESS" as const;
export const JOURNAL_CONTRIBUTE = "JOURNAL:CONTRIBUTE" as const;

export type AllPermissions = typeof RECORDS_VIEW
  | typeof RECORDS_EDIT
  | typeof LISTS_VIEW
  | typeof LISTS_EDIT
  | typeof DOCUMENTATION_DEPARTMENT
  | typeof JOURNAL_ACCESS
  | typeof JOURNAL_CONTRIBUTE;

export function hasOneOfPermissions(userPermissions: string[], permissionsToCheck: AllPermissions[]): boolean {
  return permissionsToCheck.some(permission => userPermissions.includes(permission));
};
