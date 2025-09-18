SET IDENTITY_INSERT [dbo].[TaxonomyPhyla] ON;

INSERT INTO [dbo].[TaxonomyPhyla] ([Id], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [ZooStatus], [ModifiedBy], [ModifiedAt], [IsVertebrate])
VALUES (1, '00', 'obratlovci', 'Vertebrates', 'Vertebrates', 'obratlovci', 'Z', 'system', GETDATE(), 1);

SET IDENTITY_INSERT [dbo].[TaxonomyPhyla] OFF;

-- [TRIDA] -> [TaxonomyClasses] NOTE: TaxonomyPhylumId is set to 1 for all vertebrate classes

PRINT(N'[TRIDA] -> [TaxonomyClasses]')

SET IDENTITY_INSERT [dbo].[TaxonomyClasses] ON;

INSERT INTO [dbo].[TaxonomyClasses] ([Id], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [Cryptogram], [ImageName], [Note], [Synonyms], [ZooStatus], [Shortcut], [SourceType], [TaxonomyPhylumId], [ModifiedBy], [ModifiedAt])
SELECT [TRIDA_ID], [KOD], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [KRYPTOGRAM], [IMAGE], [POZNAMKA], [SYNONYMA], [STAVZOO], [TRIDAZKR], 'A', 1, [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[TRIDA];

SET IDENTITY_INSERT [dbo].[TaxonomyClasses] OFF;

-- [RAD] -> [TaxonomyOrders]

PRINT(N'[RAD] -> [TaxonomyOrders]')

SET IDENTITY_INSERT [dbo].[TaxonomyOrders] ON;

INSERT INTO [dbo].[TaxonomyOrders] ([Id], [TaxonomyClassId], [Code], [NameCz], [NameLat], [NameEn], [NameSk], [Note], [Synonyms], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT [RAD_ID], [TRIDA_ID], [KOD], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [POZNAMKA], [SYNONYMA], [STAVZOO], 'A', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[RAD];

SET IDENTITY_INSERT [dbo].[TaxonomyOrders] OFF;

-- [CELED] -> [Family]

PRINT(N'[CELED] -> [TaxonomyFamilies]')

SET IDENTITY_INSERT [dbo].[TaxonomyFamilies] ON;

INSERT INTO [dbo].[TaxonomyFamilies] ([Id], [TaxonomyOrderId], [NameCz], [NameLat], [NameEn], [NameSk], [Code], [Note], [Synonyms], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT [CELED_ID], [RAD_ID], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [KOD], [POZNAMKA], [SYNONYMA], [STAVZOO], 'A', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[CELED];

SET IDENTITY_INSERT [dbo].[TaxonomyFamilies] OFF;

-- [ROD] -> [Genus]

PRINT(N'[ROD] -> [TaxonomyGenera]')

SET IDENTITY_INSERT [dbo].[TaxonomyGenera] ON;

INSERT INTO [dbo].[TaxonomyGenera] ([Id], [TaxonomyFamilyId], [NameCz], [NameLat], [NameEn], [NameSk], [Code], [ZooStatus], [SourceType], [ModifiedBy], [ModifiedAt])
SELECT [ROD_ID], [CELED_ID], [NAZEV_CZ], [NAZEV_LAT], [NAZEV_EN], [NAZEV_SK], [KOD], [STAVZOO], 'A', [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[ROD];

SET IDENTITY_INSERT [dbo].[TaxonomyGenera] OFF;

-- [DRUH] -> [Species]

PRINT(N'[DRUH] -> [Species]')

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
      ,[IsRegulationRequirement]
      ,[GroupType]
      ,[IsEuFauna]
      ,[EuFaunaRefNumber]
      ,[CrExceptionRefNumber]
      ,[RdbCodePrevious]
      ,[AvgMinDepositInk]
      ,[AvgMaxDepositInk]
      ,[AvgDurationInk]
      ,[GroupId]
      ,[Documentation]
      ,[SourceType])
SELECT [DRUH_ID]
      ,[ROD_ID]
      ,[KOD]
      ,[NAZEV_CZ]
      ,[NAZEV_LAT]
      ,[NAZEV_EN]
      ,[NAZEV_GE]
      ,[NAZEV_SK]
      ,[KARTA]
      ,[RDB]
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
      ,CASE WHEN [REGPOVINNOST] = 'Ano' THEN 1 ELSE 0 END
      ,[SKUPINA]
      ,CASE WHEN [EUFAUNA] = 'Ano' THEN 1 ELSE 0 END
      ,[EUFAUNACJ]
      ,[CRVYJIMKACJ]
      ,[RDB_PREV]
      ,[PRUMMINUBYTEKINK]
      ,[PRUMMAXUBYTEKINK]
      ,[PRUMDOBAINK]
      ,[SKUPINAID]
      ,[DOKLADS]
      ,'A' AS [SOURCETYPE]
FROM [Raw].[DRUH];

SET IDENTITY_INSERT [dbo].[Species] OFF;

-- [ZAZNAMY_D] -> [RecordSpecies]

PRINT(N'[ZAZNAMY_D] -> [RecordSpecies]')

SET IDENTITY_INSERT [dbo].[RecordSpecies] ON;

INSERT INTO [dbo].[RecordSpecies] ([Id], [SpeciesId], [Date], [ActionType], [Note], [ModifiedBy], [ModifiedAt])
SELECT d.[ID], [DRUH_ID], [DATUM], t.[Code], [POZNAMKA], [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[ZAZNAMY_D] d
    LEFT JOIN [dbo].[RecordActionTypes] t ON d.[VYKON] = t.[DisplayName];

SET IDENTITY_INSERT [dbo].[RecordSpecies] OFF;

-- [DOKLADD] -> [DocumentSpecies]

PRINT(N'[DOKLADD] -> [DocumentSpecies]')

SET IDENTITY_INSERT [dbo].[DocumentSpecies] ON;

INSERT INTO [dbo].[DocumentSpecies] ([Id], [SpeciesId], [DocumentType], [Date], [Number], [Note], [IsValid], [ModifiedBy], [ModifiedAt])
SELECT [DOKLADD_ID], [DRUH_ID], s.[Code], [DATUM], [CISLO], [POZNAMKA], CASE WHEN [PLATNY] = 'Ano' THEN 1 WHEN [PLATNY] = 'Ne' THEN 0 ELSE [PLATNY] END, [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[DOKLADD] d
    LEFT JOIN [dbo].[SpeciesDocumentTypes] s ON d.[DRUHDOKLADU] = s.[DisplayName];

SET IDENTITY_INSERT [dbo].[DocumentSpecies] OFF;

-- [EXEMPLAR] -> [Specimens]

PRINT(N'[EXEMPLAR] -> [Specimens]')

ALTER TABLE [dbo].[Specimens] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[Specimens] ON;

;WITH PartnerData AS (
    SELECT [Keyword], MIN([Id]) AS Id FROM [dbo].[Partners] GROUP BY [Keyword]
)
INSERT INTO [dbo].[Specimens] ([Id], [SpeciesId], [AccessionNumber], [GenderType], [ClassificationType], [Zims], [StudBookNumber], [StudBookName], [Name], [Notch], [Chip], [RingNumber], [OtherMarking], [IsHybrid], [Location], [IsFree], [BirthDate], [BirthPlace], [BirthMethod], [Rearing], [FatherId], [MotherId], [Note], [OtherDetails], [Photo], [ModifiedBy], [RegisteredDate], [RegisteredTo], [RegistrationNumber], [CadaverDate], [CadaverPlace], [EuPermit], [CzechRegistrationNumber], [FatherZims], [MotherZims], [RingNumberSecondary], [OtherMarkingSecondary], [ChipSecondary], [NotchSecondary], [Documentation], [Ueln], [SourceType], [PlacementDate], [RegionId], [InDate], [InReason], [InLocationId], [OutDate], [OutReason], [OutLocationId], [Price], [ModifiedAt])
SELECT e.[EXEMPLAR_ID], e.[DRUH_ID], e.[PRIRUSTCISLO], e.[POHLAVI], e.[TYP], e.[ARKS], e.[PLEMKNIHACISLO], e.[PLEMKNIHAJMENO], e.[JMENO], TRIM(e.[VRUB]), TRIM(e.[CHIP]), e.[KROUZEKCISLO], e.[JINEZNACENI], CASE WHEN e.[HYBRID] = 'Ano' THEN 1 ELSE 0 END, e.[UMISTENI], CASE WHEN e.[VOLNE] = 'Ano' THEN 1 ELSE 0 END, e.[NAROZENIDATUM], e.[NAROZENIMISTO], e.[NAROZENIZPUSOB], e.[ODCHOV], e.[OTEC], e.[MATKA], e.[POZNAMKA], e.[OSTATNI], CONVERT(VARBINARY(MAX), e.[FOTO]), e.[GIOS$KDO], e.[REGKDY], e.[REGKOMU], e.[REGISTRACE], e.[KADAVERDATUM], e.[KADAVERMISTO], e.[EUPERMIT], e.[CREVIDENCE], e.[OTEC_ARKS], e.[MATKA_ARKS], e.[KROUZEKCISLOS], e.[JINEZNACENIS], TRIM(e.[CHIPS]), TRIM(e.[VRUBS]), e.[DOKLADS], e.[UELN], 'A', p.[UMISTENI_DATUM], r.[Id], p.[PRIRUSTEK_DATUM],i.[Code],pa.[Id],p.[UBYTEK_DATUM],o.[Code],po.[Id], TRY_CAST(REPLACE(p.[CENA], ',', '.') AS decimal(18,2)),
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[EXEMPLAR] e
    LEFT JOIN [Raw].[REDPOHYB] p ON e.[EXEMPLAR_ID] = p.[EXEMPLAR_ID]
    LEFT JOIN [dbo].[Regions] r ON p.[RAJON_ID] = r.[Id]
    LEFT JOIN  [dbo].[IncrementReasons] i ON i.[DisplayName] = p.[PRIRUSTEK]
    LEFT JOIN  [dbo].[DecrementReasons] o ON o.[DisplayName] = p.[UBYTEK]
    LEFT JOIN PartnerData pa ON pa.[Keyword] = p.[PRIRUSTEK_MISTO]
    LEFT JOIN PartnerData po ON po.[Keyword] = p.[UBYTEK_MISTO]

SET IDENTITY_INSERT [dbo].[Specimens] OFF;

ALTER TABLE  [dbo].[Specimens] WITH NOCHECK CHECK CONSTRAINT all

-- [KADAVER] -> [Cadavers]

PRINT(N'[KADAVER] -> [Cadavers]')

SET IDENTITY_INSERT [dbo].[Cadavers] ON;

INSERT INTO [dbo].[Cadavers] ([Id], [SpecimenId], [Date], [Location], [Note], [Photo], [ModifiedBy], [ModifiedAt])
SELECT [KADAVER_ID], [EXEMPLAR_ID], [DATUM], [MISTO], [POZNAMKA], CONVERT(VARBINARY(MAX), [FOTO]), [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM.[Raw].[KADAVER];

SET IDENTITY_INSERT [dbo].[Cadavers] OFF;

-- [DOKLADE] -> [DocumentSpecimens]

PRINT(N'[DOKLADE] -> [DocumentSpecimens]')

ALTER TABLE [dbo].[DocumentSpecimens] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[DocumentSpecimens] ON;

INSERT INTO [dbo].[DocumentSpecimens] ([Id], [SpecimenId], [DocumentType], [Number], [Date], [Partner], [Note], [IsValid], [ModifiedBy], [ModifiedAt])
SELECT [DOKLADE_ID], [EXEMPLAR_ID], s.[Code], [CISLO], [DATUM], [PARTNER], [POZNAMKA], CASE WHEN [PLATNY] = 'Ano' THEN 1 WHEN [PLATNY] = 'Ne' THEN 0 ELSE [PLATNY] END, [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[DOKLADE] d
    LEFT JOIN [dbo].[SpecimenDocumentTypes] s ON d.[DRUHDOKLADU] = s.[DisplayName];

SET IDENTITY_INSERT [dbo].[DocumentSpecimens] OFF;

ALTER TABLE [dbo].[DocumentSpecimens] WITH NOCHECK CHECK CONSTRAINT all

-- [ZAZNAMY] -> [RecordSpecimens]

PRINT(N'[ZAZNAMY] -> [RecordSpecimens]')

ALTER TABLE [dbo].[RecordSpecimens] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[RecordSpecimens] ON;

INSERT INTO [dbo].[RecordSpecimens] ([Id], [SpecimenId], [Date], [ActionType], [Note], [PartnerId], [ModifiedBy], [ModifiedAt])
SELECT d.[ID], [EXEMPLAR_ID], [DATUM], t.[Code], [POZNAMKA], [PARTNER], [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[ZAZNAMY] d
    LEFT JOIN [dbo].[RecordActionTypes] t ON d.[VYKON] = t.[DisplayName];


SET IDENTITY_INSERT [dbo].[RecordSpecimens] OFF;

ALTER TABLE [dbo].[RecordSpecimens] WITH NOCHECK CHECK CONSTRAINT all

-- [POHYB] -> [Movements]

PRINT(N'[POHYB] -> [Movements]')

ALTER TABLE [dbo].[Movements] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[Movements] ON;

INSERT INTO  [dbo].[Movements] ([Id], [SpecimenId], [Date], [Quantity], [QuantityActual], [IncrementReason], [DecrementReason], [LocationId], [CitesImport], [CitesExport], [Price], [Note], [ModifiedBy], [Gender], [AccountingDate], [PriceFinal], [DepType], [ContractNumber], [ContractNote], [ContractId], [SourceType], [ModifiedAt])
SELECT [ID], [EXEMPLAR_ID], [DATUM], [POCET], [POCETR], i.[Code], o.[Code], [MISTO], [CITES_DOVOZ], [CITES_VYVOZ], CAST(REPLACE([CENA], ',', '.') AS DECIMAL(18,2)), [POZNAMKA], [GIOS$KDO], [SDRPOHLAVI], [DATUMU], CAST(REPLACE([CENAK], ',', '.') AS DECIMAL(18,2)), [DEP], [CISLOSMLOUVY], [POZNSMLOUVY], [SMLOUVAID], 'A',
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[POHYB] p
    LEFT JOIN  [dbo].[IncrementReasons] i ON i.[DisplayName] = p.[PRIRUSTEK]
    LEFT JOIN  [dbo].[DecrementReasons] o ON o.[DisplayName] = p.[UBYTEK];

SET IDENTITY_INSERT [dbo].[Movements] OFF;

ALTER TABLE [dbo].[Movements] WITH NOCHECK CHECK CONSTRAINT all

-- [UMISTENI] -> [Placements]

PRINT(N'[UMISTENI] -> [Placements]')

ALTER TABLE [dbo].[Placements] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[Placements] ON;

INSERT INTO [dbo].[Placements] ([Id], [SpecimenId], [OriginSpecimenId], [RegionId], [Date], [Note], [ModifiedBy], [ModifiedAt])
SELECT [UMISTENI_ID], [EXEMPLAR_ID], [BEXEMPLAR_ID], [RAJON_ID], [DATUM], [POZNAMKA], [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[UMISTENI];

SET IDENTITY_INSERT [dbo].[Placements] OFF;

ALTER TABLE [dbo].[Placements] WITH NOCHECK CHECK CONSTRAINT all

-- [ZNACENI] -> [Markings]

PRINT(N'[ZNACENI] -> [Markings]')

SET IDENTITY_INSERT [dbo].[Markings] ON;

INSERT INTO [dbo].[Markings] ([Id]
      ,[SpecimenId]
      ,[MarkingType]
      ,[RingNumber]
      ,[Color]
      ,[Side]
      ,[LocatedOn]
      ,[IsValid]
      ,[MarkingDate]
      ,[Note]
      ,[ModifiedBy]
      ,[ModifiedAt])
SELECT z.[ID]
      ,z.[EXEMPLAR_ID]
      ,t.[Code]
      ,z.[KROUZEKCISLO]
      ,z.[BARVA]
      ,z.[STRANA]
      ,z.[UMISTENI]
      ,CASE WHEN z.[PLATNY] = 'T' THEN 1 WHEN z.[PLATNY] = 'F' THEN 0 ELSE z.[PLATNY] END
      ,z.[DATUM]
      ,z.[POZNAMKA]
      ,z.[GIOS$KDO]
      ,CONVERT(datetime,
          STUFF(STUFF(LEFT(z.[GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
          STUFF(STUFF(STUFF(RIGHT(z.[GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
      121)
FROM [Raw].[Znaceni] z
    INNER JOIN [dbo].[Specimens] s ON z.[EXEMPLAR_ID] = s.[Id] -- remove records with not valid specimen relation
    LEFT JOIN [dbo].[MarkingTypes] t ON z.[TYPZNACENI] = t.[DisplayName];

SET IDENTITY_INSERT [dbo].[Markings] OFF;

-- [UMISTENI] -> [SpecimenPlacements]

PRINT(N'[UMISTENI] -> [SpecimenPlacements]')

ALTER TABLE [dbo].[SpecimenPlacements] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT [dbo].[SpecimenPlacements] ON;

INSERT INTO [dbo].[SpecimenPlacements] ([Id], [SpecimenId], [ValidSince], [Note], [ModifiedBy], [ModifiedAt])
SELECT [UMISTENI_ID], [EXEMPLAR_ID], [DATUM], [POZNAMKA], [GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[UMISTENI] WHERE [EXEMPLAR_ID] IS NOT NULL; -- NOTE: will be solved with organization structure

SET IDENTITY_INSERT [dbo].[SpecimenPlacements] OFF;

ALTER TABLE [dbo].[SpecimenPlacements] WITH NOCHECK CHECK CONSTRAINT all