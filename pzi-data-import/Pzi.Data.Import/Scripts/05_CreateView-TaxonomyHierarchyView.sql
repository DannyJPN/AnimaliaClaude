CREATE VIEW [dbo].[TaxonomyHierarchyView] WITH SCHEMABINDING AS
SELECT 
    sp.[Id] AS SpeciesId,
    sp.[NameCz] AS SpeciesNameCz,
    sp.[NameLat] AS SpeciesNameLat,
    g.[Id] AS GenusId,
    g.[NameCz] AS GenusNameCz,
    g.[NameLat] AS GenusNameLat,
    fam.[Id] AS FamilyId,
    fam.[NameCz] AS FamilyNameCz,
    fam.[NameLat] AS FamilyNameLat,
    o.[Id] AS OrderId,
    o.[NameCz] AS OrderNameCz,
    o.[NameLat] AS OrderNameLat,
    c.[Id] AS ClassId,
    c.[NameCz] AS ClassNameCz,
    c.[NameLat] AS ClassNameLat,
    p.[Id] AS PhylumId,
    p.[NameCz] AS PhylumNameCz,
    p.[NameLat] AS PhylumNameLat,
    p.[IsVertebrate]
FROM [dbo].[Species] sp
INNER JOIN [dbo].[TaxonomyGenera] g ON sp.[TaxonomyGenusId] = g.[Id]
INNER JOIN [dbo].[TaxonomyFamilies] fam ON g.[TaxonomyFamilyId] = fam.[Id]
INNER JOIN [dbo].[TaxonomyOrders] o ON fam.[TaxonomyOrderId] = o.[Id]
INNER JOIN [dbo].[TaxonomyClasses] c ON o.[TaxonomyClassId] = c.[Id]
INNER JOIN [dbo].[TaxonomyPhyla] p ON c.[TaxonomyPhylumId] = p.[Id];