DECLARE @bStartId INT = 1000000;
DECLARE @bSmallStartId INT = 100000;

-- [KMEN_B] -> [TaxonomyPhyla]

PRINT(N'[KMEN_B] -> [TaxonomyPhyla]')

SET IDENTITY_INSERT [dbo].[TaxonomyPhyla] ON;

INSERT INTO [dbo].[TaxonomyPhyla] ([Id], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [ZooStatus], [ModifiedBy], [ModifiedAt])
SELECT @bSmallStartId + [KMEN_ID], [KOD], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [STAVZOO], [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[KMEN_B];

SET IDENTITY_INSERT [dbo].[TaxonomyPhyla] OFF;

-- [TRIDA_B] -> [TaxonomyClasses]

PRINT(N'[TRIDA_B] -> [TaxonomyClasses]')

SET IDENTITY_INSERT [dbo].[TaxonomyClasses] ON;

INSERT INTO [dbo].[TaxonomyClasses] ([Id], [TaxonomyPhylumId], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT @bStartId + [TRIDA_ID], @bSmallStartId + [KMEN_ID], [KOD], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [STAVZOO], 'B', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[TRIDA_B];

SET IDENTITY_INSERT [dbo].[TaxonomyClasses] OFF;

-- [RAD_B] -> [TaxonomyOrders]

PRINT(N'[RAD_B] -> [TaxonomyOrders]')

SET IDENTITY_INSERT [dbo].[TaxonomyOrders] ON;

INSERT INTO [dbo].[TaxonomyOrders] ([Id], [TaxonomyClassId], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT @bStartId + [RAD_ID], @bStartId + [TRIDA_ID], [KOD], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [STAVZOO], 'B', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[RAD_B];

SET IDENTITY_INSERT [dbo].[TaxonomyOrders] OFF;

-- [CELED_B] -> [Family]

PRINT(N'[CELED_B] -> [TaxonomyFamilies]')

SET IDENTITY_INSERT [dbo].[TaxonomyFamilies] ON;

INSERT INTO [dbo].[TaxonomyFamilies] ([Id], [TaxonomyOrderId], [NameCz], [NameLat], [NameEn], [NameSk], [Code], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT @bStartId + [CELED_ID], @bStartId + [RAD_ID], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [KOD], [STAVZOO], 'B', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[CELED_B];

SET IDENTITY_INSERT [dbo].[TaxonomyFamilies] OFF;

-- [ROD] -> [Genus]

PRINT(N'[ROD_B] -> [TaxonomyGenera]')

SET IDENTITY_INSERT [dbo].[TaxonomyGenera] ON;

INSERT INTO [dbo].[TaxonomyGenera] ([Id], [TaxonomyFamilyId], [NameCz], [NameLat], [NameEn], [NameSk], [Code], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT @bStartId + [ROD_ID], @bStartId + [CELED_ID], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [KOD], [STAVZOO], 'B', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[ROD_B];

SET IDENTITY_INSERT [dbo].[TaxonomyGenera] OFF;

-- [DRUH] -> [Species]

PRINT(N'[DRUH_B] -> [Species]')

SET IDENTITY_INSERT [dbo].[Species] ON;

INSERT INTO [dbo].[Species] ([Id]
      ,[TaxonomyGenusId]
      ,[Code]
      ,[NameCz]
      ,[NameLat]
      ,[NameEn]
      ,[NameGe]
      ,[NameSk]
      ,[Card]
      ,[RdbCode]
      ,[CiteType]
      ,[ProtectionType]
      ,[IsEep]
      ,[IsEsb]
      ,[IsIsb]
      ,[IsGenePool]
      ,[ClassificationType]
      ,[ZooStatus]
      ,[Price]
      ,[RegionId]
      ,[Note]
      ,[Synonyms]
      ,[Description]
      ,[FeedingRate]
      ,[Photo]
      ,[ModifiedBy]
      ,[ModifiedAt]
      ,[UcszCoef]
      ,[EuCode]
      ,[GroupType]
      ,[RdbCodePrevious]
      ,[GroupId]
      ,[SourceType])
SELECT @bStartId + [DRUH_ID]
      ,@bStartId + [ROD_ID]
      ,[KOD]
      ,[NAZEV_CZ]
      ,[NAZEV_LAT]
      ,[NAZEV_EN]
      ,[NAZEV_GE]
      ,[NAZEV_SK]
      ,[KARTA]
      ,r.[Code]
      ,[CITES]
      ,[CROCHRANA]
      ,CASE WHEN [EEP] = 'Ano' THEN 1 ELSE 0 END
      ,CASE WHEN [ESB] = 'Ano' THEN 1 ELSE 0 END
      ,CASE WHEN [ISB] = 'Ano' THEN 1 ELSE 0 END
      ,CASE WHEN [GENOFOND] = 'Ano' THEN 1 ELSE 0 END
      ,[TYP]
      ,[STAVZOO]
      ,CAST(REPLACE([CENA], ',', '.') AS DECIMAL(18,2))
      ,[RAJON_ID]
      ,[POZNAMKA]
      ,[SYNONYMA]
      ,[POPIS]
      ,[KRMNADAVKA]
      ,CONVERT(VARBINARY(MAX), [FOTO])
      ,[GIOS$KDO]
      ,CONVERT(datetime, STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' + STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'), 121)
      ,[UCSZKOEF]
      ,[EU]
      ,[SKUPINA]
      ,rp.[Code]
      ,[SKUPINAID]
      ,'B' AS [SOURCETYPE]
FROM [Raw].[DRUH_B] d 
LEFT JOIN [dbo].[RdbCodes] r ON r.[DisplayName] = d.[RDB]
LEFT JOIN [dbo].[RdbCodes] rp ON rp.[DisplayName] = d.[RDB_PREV];

SET IDENTITY_INSERT [dbo].[Species] OFF;

PRINT(N'[EXEMPLAR_B] -> [Specimens]')

ALTER TABLE [dbo].[Specimens] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[Specimens] ON;

;WITH PartnerData AS (
    SELECT [Keyword], MIN([Id]) AS Id FROM [dbo].[Partners] GROUP BY [Keyword]
)
INSERT INTO [dbo].[Specimens] ([Id], [SpeciesId], [AccessionNumber], [GenderType], [ClassificationType], [Zims], [StudBookNumber], [StudBookName], [Name], [OtherMarking], [IsHybrid], [Location], [IsFree], [BirthDate], [BirthPlace], [BirthMethod], [Rearing], [Note], [OtherDetails], [Photo], [ModifiedBy], [ModifiedAt], [RegistrationNumber], [CadaverDate], [CadaverPlace], [CzechRegistrationNumber], [EuPermit], [SourceType], [PlacementDate], [RegionId], [InDate],[InReason],[InLocationId],[OutDate],[OutReason],[OutLocationId])
SELECT @bStartId + e.[EXEMPLAR_ID], @bStartId + e.[DRUH_ID], e.[PRIRUSTCISLO], e.[POHLAVI], e.[TYP], e.[ARKS], e.[PLEMKNIHACISLO], e.[PLEMKNIHAJMENO], e.[JMENO], e.[JINEZNACENI], CASE WHEN e.[HYBRID] = 'Ano' THEN 1 ELSE 0 END, e.[UMISTENI], CASE WHEN e.[VOLNE] = 'Ano' THEN 1 ELSE 0 END, e.[NAROZENIDATUM], e.[NAROZENIMISTO], e.[NAROZENIZPUSOB], e.[ODCHOV], [POZNAMKA], e.[OSTATNI], CONVERT(VARBINARY(MAX), e.[FOTO]), e.[GIOS$KDO], CONVERT(datetime, STUFF(STUFF(LEFT(e.[GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' + STUFF(STUFF(STUFF(RIGHT(e.[GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'), 121), e.[REGISTRACE], e.[KADAVERDATUM], e.[KADAVERMISTO], e.[CREVIDENCE], e.[EUPERMIT], 'B', p.[UMISTENI_DATUM], r.[Id], p.[PRIRUSTEK_DATUM], i.[Code], pa.[Id], p.[UMISTENI_DATUM], o.[Code], po.[Id]
FROM [Raw].[EXEMPLAR_B] e
    LEFT JOIN [Raw].[REDPOHYB_B] p ON e.[EXEMPLAR_ID] = p.[EXEMPLAR_ID]
    LEFT JOIN [dbo].[Regions] r ON p.[RAJON_ID] = r.[Id]
    LEFT JOIN [dbo].[IncrementReasons] i ON i.[DisplayName] = p.[PRIRUSTEK]
    LEFT JOIN [dbo].[DecrementReasons] o ON o.[DisplayName] = p.[UBYTEK]
    LEFT JOIN PartnerData pa ON pa.[Keyword] = p.[PRIRUSTEK_MISTO]
    LEFT JOIN PartnerData po ON po.[Keyword] = p.[UBYTEK_MISTO]

SET IDENTITY_INSERT [dbo].[Specimens] OFF;

ALTER TABLE  [dbo].[Specimens] WITH NOCHECK CHECK CONSTRAINT all

-- [POHYB_B] -> [Movements]

PRINT(N'[POHYB_B] -> [Movements]')

ALTER TABLE [dbo].[Movements] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[Movements] ON;

INSERT INTO  [dbo].[Movements] ([Id], [SpecimenId], [Date], [Quantity], [QuantityActual], [IncrementReason], [DecrementReason], [LocationId], [CitesImport], [CitesExport], [Price], [Note], [ModifiedBy], [ModifiedAt], [Gender], [AccountingDate], [PriceFinal], [DepType], [ContractNumber], [ContractNote], [ContractId], [SourceType])
SELECT @bStartId + [ID], @bStartId + [EXEMPLAR_ID], [DATUM], [POCET], [POCETR], i.[Code], o.[Code], [MISTO], [CITES_DOVOZ], [CITES_VYVOZ], CAST(REPLACE([CENA], ',', '.') AS DECIMAL(18,2)), [POZNAMKA], [GIOS$KDO], CONVERT(datetime, STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' + STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'), 121), [SDRPOHLAVI], [DATUMU], CAST(REPLACE([CENAK], ',', '.') AS DECIMAL(18,2)), [DEP], [CISLOSMLOUVY], [POZNSMLOUVY], [SMLOUVAID], 'B'
FROM [Raw].[POHYB_B] p
    LEFT JOIN  [dbo].[IncrementReasons] i ON i.[DisplayName] = p.[PRIRUSTEK]
    LEFT JOIN  [dbo].[DecrementReasons] o ON o.[DisplayName] = p.[UBYTEK];

SET IDENTITY_INSERT [dbo].[Movements] OFF;

ALTER TABLE [dbo].[Movements] WITH NOCHECK CHECK CONSTRAINT all


