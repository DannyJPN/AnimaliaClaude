CREATE VIEW [dbo].[ExpositionHierarchyView] WITH SCHEMABINDING AS
SELECT 
    loc.[Id] AS LocationId,
    loc.[Name] AS LocationName,
    loc.[ExpositionSetId],
    es.[Name] AS ExpositionSetName,
    es.[ExpositionAreaId],
    ea.[Name] AS ExpositionAreaName,
    loc.[OrganizationLevelId] AS DistrictId
FROM [dbo].[Locations] loc
INNER JOIN [dbo].[ExpositionSets] es ON loc.[ExpositionSetId] = es.[Id]
INNER JOIN [dbo].[ExpositionAreas] ea ON es.[ExpositionAreaId] = ea.[Id];