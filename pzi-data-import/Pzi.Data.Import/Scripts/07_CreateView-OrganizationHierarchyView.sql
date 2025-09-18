CREATE VIEW [dbo].[OrganizationHierarchyView] WITH SCHEMABINDING AS
SELECT
	itm.Id as Id,
	itm.Id as DistrictId,
  itm.Name as DistrictName,
	p.Id as WorkplaceId,
  p.Name as WorkplaceName,
	pp.Id as DepartmentId,
  pp.Name as DepartmentName
FROM
	[dbo].OrganizationLevels [itm]
	JOIN [dbo].OrganizationLevels [p] ON itm.ParentId = p.Id
	JOIN [dbo].OrganizationLevels [pp] ON p.ParentId = pp.Id
UNION 
SELECT
	itm.Id as Id,
	NULL as DistrictId,
  NULL as DistrictName,
	itm.Id as WorkplaceId,
  itm.Name as WorkplaceName,
	p.Id as DepartmentId,
  p.Name as DepartmentName
FROM
	[dbo].OrganizationLevels [itm]
	JOIN [dbo].OrganizationLevels [p] ON itm.ParentId = p.Id
WHERE
	itm.[Level] = 'workplace'
UNION 
SELECT
	itm.Id as Id,
	NULL as DistrictId,
  NULL as DistrictName,
	NULL as WorkplaceId,
  NULL as WorkplaceName,
	itm.Id as DepartmentId,
  itm.Name as DepartmentName
FROM
	[dbo].OrganizationLevels [itm]
WHERE
	itm.[Level] = 'department';
