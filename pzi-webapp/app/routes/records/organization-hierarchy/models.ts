export type OrganizationLevelItem = {
  id: number
  parentId?: number
  level: 'department' | 'workplace' | 'district',
  name: string
  director?: string
  journalApproversGroup?: string
  journalReadGroup?: string
  journalContributorGroup?: string
  modifiedBy?: string
  modifiedAt?: string
}
