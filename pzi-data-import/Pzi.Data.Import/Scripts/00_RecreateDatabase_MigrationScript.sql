DROP INDEX IF EXISTS [IX_TaxonomyHierarchyView] ON [dbo].[TaxonomyHierarchyView];
DROP VIEW IF EXISTS [dbo].[TaxonomyHierarchyView];
DROP INDEX IF EXISTS [IX_ExpositionHierarchyView] ON [dbo].[ExpositionHierarchyView];
DROP VIEW IF EXISTS [dbo].[ExpositionHierarchyView];
DROP VIEW IF EXISTS [dbo].[OrganizationHierarchyView];

DROP TABLE IF EXISTS [dbo].[JournalActionTypesToOrganizationLevels];
DROP TABLE IF EXISTS [dbo].[SpecimenImages];
DROP TABLE IF EXISTS [dbo].[UserFlaggedDistricts];
DROP TABLE IF EXISTS [dbo].[UserFlaggedSpecies];
DROP TABLE IF EXISTS [dbo].[JournalActionTypeDefinitions];
DROP TABLE IF EXISTS [dbo].[JournalEntrySpecimenAttributes];
DROP TABLE IF EXISTS [dbo].[JournalEntryAttributes];
DROP TABLE IF EXISTS [dbo].[JournalEntrySpecimens];
DROP TABLE IF EXISTS [dbo].[JournalEntryAudits];
DROP TABLE IF EXISTS [dbo].[JournalEntries];
DROP TABLE IF EXISTS [dbo].[JournalActionTypes];
DROP TABLE IF EXISTS [dbo].[SpecimenPlacements];
DROP TABLE IF EXISTS [dbo].[Markings];
DROP TABLE IF EXISTS [dbo].[SpecimenAggregatedMovements];
DROP TABLE IF EXISTS [dbo].[Zoos];
DROP TABLE IF EXISTS [dbo].[RecordSpecimens];
DROP TABLE IF EXISTS [dbo].[RecordSpecies];
DROP TABLE IF EXISTS [dbo].[Placements];
DROP TABLE IF EXISTS [dbo].[ContractActions];
DROP TABLE IF EXISTS [dbo].[Movements];
DROP TABLE IF EXISTS [dbo].[Contracts];
DROP TABLE IF EXISTS [dbo].[Cadavers];
DROP TABLE IF EXISTS [dbo].[CadaverPartners];
DROP TABLE IF EXISTS [dbo].[DocumentSpecimens];
DROP TABLE IF EXISTS [dbo].[DocumentSpecies];
DROP TABLE IF EXISTS [dbo].[Partners];
DROP TABLE IF EXISTS [dbo].[Specimens];
DROP TABLE IF EXISTS [dbo].[Species];
DROP TABLE IF EXISTS [dbo].[TaxonomyGenera];
DROP TABLE IF EXISTS [dbo].[TaxonomyFamilies];
DROP TABLE IF EXISTS [dbo].[TaxonomyOrders];
DROP TABLE IF EXISTS [dbo].[TaxonomyClasses];
DROP TABLE IF EXISTS [dbo].[TaxonomyPhyla];
DROP TABLE IF EXISTS [dbo].[ContractTypes];
DROP TABLE IF EXISTS [dbo].[ContractMovementReasons];
DROP TABLE IF EXISTS [dbo].[ContractActionTypes];
DROP TABLE IF EXISTS [dbo].[ContractActionInitiators];
DROP TABLE IF EXISTS [dbo].[SpecimenDocumentTypes];
DROP TABLE IF EXISTS [dbo].[SpeciesDocumentTypes];
DROP TABLE IF EXISTS [dbo].[RecordActionTypes];
DROP TABLE IF EXISTS [dbo].[SpeciesProtectionTypes];
DROP TABLE IF EXISTS [dbo].[ZooStatuses];
DROP TABLE IF EXISTS [dbo].[RdbCodes];
DROP TABLE IF EXISTS [dbo].[MarkingTypes];
DROP TABLE IF EXISTS [dbo].[SpeciesCiteTypes];
DROP TABLE IF EXISTS [dbo].[ClassificationTypes];
DROP TABLE IF EXISTS [dbo].[EuCodes];
DROP TABLE IF EXISTS [dbo].[GenderTypes];
DROP TABLE IF EXISTS [dbo].[OriginTypes];
DROP TABLE IF EXISTS [dbo].[IncrementReasons];
DROP TABLE IF EXISTS [dbo].[DecrementReasons];
DROP TABLE IF EXISTS [dbo].[Rearings];
DROP TABLE IF EXISTS [dbo].[BirthMethods];
DROP TABLE IF EXISTS [dbo].[Regions];
DROP TABLE IF EXISTS [dbo].[Sections];
DROP TABLE IF EXISTS [dbo].[Locations];
DROP TABLE IF EXISTS [dbo].[ExpositionSets];
DROP TABLE IF EXISTS [dbo].[ExpositionAreas];
DROP TABLE IF EXISTS [dbo].[OrganizationLevels];
DROP TABLE IF EXISTS [dbo].[UserTableSettings];
DROP TABLE IF EXISTS [dbo].[UserRoles];
DROP TABLE IF EXISTS [dbo].[Users];

CREATE TABLE [dbo].[OrganizationLevels]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [ParentId] INT,
  [Level] NVARCHAR(10) NOT NULL CHECK ([Level] IN ('department', 'workplace', 'district')),
  [Name] NVARCHAR(255) NOT NULL,
  [Director] NVARCHAR(255),
  [JournalContributorGroup] NVARCHAR(1024),
  [JournalReadGroup] NVARCHAR(1024),
  [JournalApproversGroup] NVARCHAR(1024),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),

  CONSTRAINT FK_OrganizationLevels_OrganizationLevels  FOREIGN KEY ([ParentId]) REFERENCES [dbo].[OrganizationLevels] ([Id])
);

CREATE TABLE [dbo].[ExpositionAreas]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Name] NVARCHAR(255) NOT NULL,
  [Note] NVARCHAR(1000),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE()
);

CREATE TABLE [dbo].[ExpositionSets]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [ExpositionAreaId] INT NOT NULL,
  [Name] NVARCHAR(255) NOT NULL,
  [Note] NVARCHAR(1000),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_ExpositionSets_ExpositionAreas FOREIGN KEY ([ExpositionAreaId]) REFERENCES [dbo].[ExpositionAreas] ([Id])
);

CREATE TABLE [dbo].[Locations]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [OrganizationLevelId] INT,
  [ExpositionSetId] INT,
  [Name] NVARCHAR(255) NOT NULL,
  [ObjectNumber] INT,
  [RoomNumber] INT,
  [AvailableForVisitors] BIT NOT NULL DEFAULT 1,
  [LocationTypeCode] INT NOT NULL,
  [AreaM2] DECIMAL(18,2),
  [CapacityM3] DECIMAL(18,2),
  [Note] NVARCHAR(1000),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Locations_OrganizationLevels FOREIGN KEY ([OrganizationLevelId]) REFERENCES [dbo].[OrganizationLevels] ([Id]),
  CONSTRAINT FK_Locations_ExpositionSets FOREIGN KEY ([ExpositionSetId]) REFERENCES [dbo].[ExpositionSets] ([Id])
);

-- LOOKUP TABLES

-- ADRUH
CREATE TABLE [dbo].[ContractTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- NOTE: new lookup table
CREATE TABLE [dbo].[ContractMovementReasons]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- AUKON
CREATE TABLE [dbo].[ContractActionTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- AUCASTNIK
CREATE TABLE [dbo].[ContractActionInitiators]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- DRUHDRUH
CREATE TABLE [dbo].[SpeciesDocumentTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- DRUHEXEMPLAR
CREATE TABLE [dbo].[SpecimenDocumentTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- AVYKON
CREATE TABLE [dbo].[RecordActionTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- CROCHRANA
CREATE TABLE [dbo].[SpeciesProtectionTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- NOTE: new lookup table
CREATE TABLE [dbo].[ZooStatuses]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256),
);

-- RDB
CREATE TABLE [dbo].[RdbCodes] -- RDB?
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256),
);

-- AZNACENI
CREATE TABLE [dbo].[MarkingTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- CITES
CREATE TABLE [dbo].[SpeciesCiteTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- new lookup table
CREATE TABLE [dbo].[ClassificationTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- POHLAVI
CREATE TABLE [dbo].[GenderTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- EU
CREATE TABLE [dbo].[EuCodes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- REGPUVOD
CREATE TABLE [dbo].[OriginTypes]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- PRIRUSTEK
CREATE TABLE [dbo].[IncrementReasons]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- UBYTEK 
CREATE TABLE [dbo].[DecrementReasons] -- NOTE: why order starts from 100 in the original table? 
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- ODCHOV (Rearing)
CREATE TABLE [dbo].[Rearings]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

-- NAROZENI ZPUSOB (Birth Method)
CREATE TABLE [dbo].[BirthMethods]
(
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [Sort] INT NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(32) NOT NULL UNIQUE,
  [Note] NVARCHAR(256)
);

CREATE TABLE [dbo].[Sections]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SectionName] NVARCHAR(128) NOT NULL,
  [Code] NVARCHAR(3)
);

-- RAJON
CREATE TABLE [dbo].[Regions]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SectionId] INT NOT NULL,
  [Name] NVARCHAR(128) NOT NULL,
  [Code] NVARCHAR(4),
  [OperationNote] NVARCHAR(32),
  CONSTRAINT FK_Regions_Sections FOREIGN KEY ([SectionId]) REFERENCES [dbo].[Sections]([Id])
);

-- KMEN (Only for invertebrates)
CREATE TABLE [dbo].[TaxonomyPhyla]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Code] NVARCHAR(3),
  [ZooStatus] VARCHAR(5),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  [IsVertebrate] BIT NOT NULL DEFAULT(0),
  CONSTRAINT FK_TaxonomyPhyla_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code])
);

-- TRIDA
CREATE TABLE [dbo].[TaxonomyClasses]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Code] VARCHAR(2),
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Cryptogram] VARCHAR(5),
  [ImageName] NVARCHAR(256),
  [Note] NVARCHAR(MAX),
  [Synonyms] NVARCHAR(MAX),
  [ZooStatus] VARCHAR(5),
  [Shortcut] VARCHAR(3),
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  [TaxonomyPhylumId] INT NULL,
  CONSTRAINT FK_TaxonomyClasses_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code]),
  CONSTRAINT FK_TaxonomyClasses_TaxonomyPhyla FOREIGN KEY ([TaxonomyPhylumId]) REFERENCES [dbo].[TaxonomyPhyla]([Id])
);

-- RAD
CREATE TABLE [dbo].[TaxonomyOrders]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [TaxonomyClassId] INT NOT NULL,
  [Code] VARCHAR(2),
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Note] NVARCHAR(MAX),
  [Synonyms] NVARCHAR(MAX),
  [ZooStatus] VARCHAR(5),
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_TaxonomyOrders_TaxonomyClasses FOREIGN KEY ([TaxonomyClassId]) REFERENCES [dbo].[TaxonomyClasses]([Id]),
  CONSTRAINT FK_TaxonomyOrders_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code])
);

-- CELED
CREATE TABLE [dbo].[TaxonomyFamilies]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [TaxonomyOrderId] INT NOT NULL,
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Code] NVARCHAR(3),
  [Note] NVARCHAR(MAX),
  [Synonyms] NVARCHAR(MAX),
  [ZooStatus] VARCHAR(5),
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_TaxonomyFamilies_TaxonomyOrders FOREIGN KEY ([TaxonomyOrderId]) REFERENCES [dbo].[TaxonomyOrders]([Id]),
  CONSTRAINT FK_TaxonomyFamilies_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code])
);

-- ROD
CREATE TABLE [dbo].[TaxonomyGenera]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [TaxonomyFamilyId] INT NOT NULL,
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Code] NVARCHAR(3),
  [ZooStatus] VARCHAR(5),
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_TaxonomyGenera_TaxonomyFamilies FOREIGN KEY ([TaxonomyFamilyId]) REFERENCES [dbo].[TaxonomyFamilies]([Id]),
  CONSTRAINT FK_TaxonomyGenera_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code])
);

-- DRUH
CREATE TABLE [dbo].[Species]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [TaxonomyGenusId] INT NOT NULL,
  [Code] NVARCHAR(6),
  [NameCz] NVARCHAR(128),
  [NameLat] NVARCHAR(128),
  [NameEn] NVARCHAR(128),
  [NameGe] NVARCHAR(128),
  [NameSk] NVARCHAR(128),
  [Card] NVARCHAR(10),
  [RdbCode] VARCHAR(5),
  [CiteType] VARCHAR(5),
  [ProtectionType] VARCHAR(5),
  [IsEep] BIT NOT NULL DEFAULT(0),
  [IsEsb] BIT NOT NULL DEFAULT(0),
  [IsIsb] BIT NOT NULL DEFAULT(0),
  [IsGenePool] BIT NOT NULL DEFAULT(0),
  [ClassificationType] VARCHAR(5) NOT NULL,
  -- NOTE: can be boolean?
  [ZooStatus] VARCHAR(5),
  [Price] DECIMAL(18,2),
  [RegionId] INT,
  [Note] NVARCHAR(MAX),
  [Synonyms] NVARCHAR(MAX),
  [Description] NVARCHAR(MAX),
  [FeedingRate] NVARCHAR(1),
  [Photo] VARBINARY(MAX),
  [UcszCoef] NVARCHAR(6),
  [EuCode] VARCHAR(5),
  -- NOTE: What EU? What does that mean? regulation, protection or what?
  [IsRegulationRequirement] BIT NOT NULL DEFAULT(0),
  [GroupType] NVARCHAR(1),
  [IsEuFauna] BIT NOT NULL DEFAULT(0),
  [EuFaunaRefNumber] NVARCHAR(200),
  [CrExceptionRefNumber] NVARCHAR(200),
  [RdbCodePrevious] VARCHAR(5),
  [AvgMinDepositInk] NVARCHAR(8),
  -- NOTE: Not used, please confirm with Drozda. this is probably value related to incubation (minimal decrease)
  [AvgMaxDepositInk] NVARCHAR(8),
  -- NOTE: Not used, please confirm with Drozda. this is probably value related to incubation (max decrease)
  [AvgDurationInk] NVARCHAR(8),
  -- NOTE: Not used, please confirm with Drozda. this is probably value related to incubation
  [GroupId] INT,
  -- NOTE: integer value probably relation FK or id from external system. Confirm with Drozada or find relation. 
  [Documentation] NVARCHAR(256),
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_Species_Genera FOREIGN KEY ([TaxonomyGenusId]) REFERENCES [dbo].[TaxonomyGenera]([Id]),
  CONSTRAINT FK_Species_ZooStatuses FOREIGN KEY ([ZooStatus]) REFERENCES [dbo].[ZooStatuses]([Code]),
  CONSTRAINT FK_Species_RdbCodes FOREIGN KEY ([RdbCode]) REFERENCES [dbo].[RdbCodes]([Code]),
  CONSTRAINT FK_Species_RdbCodes_Prev FOREIGN KEY ([RdbCodePrevious]) REFERENCES [dbo].[RdbCodes]([Code]),
  CONSTRAINT FK_Species_SpeciesCiteTypes FOREIGN KEY ([CiteType]) REFERENCES [dbo].[SpeciesCiteTypes]([Code]),
  CONSTRAINT FK_Species_SpeciesProtectionTypes FOREIGN KEY ([ProtectionType]) REFERENCES [dbo].[SpeciesProtectionTypes]([Code]),
  CONSTRAINT FK_Species_EuCodes FOREIGN KEY ([EuCode]) REFERENCES [dbo].[EuCodes]([Code]),
  CONSTRAINT FK_Species_ClassificationTypes FOREIGN KEY ([ClassificationType]) REFERENCES [dbo].[ClassificationTypes]([Code])
);

-- EXEMPLAR
CREATE TABLE [dbo].[Specimens]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpeciesId] INT NOT NULL,
  [AccessionNumber] INT,
  [GenderType] VARCHAR(5),
  [ClassificationType] VARCHAR(5) NOT NULL,
  [Zims] NVARCHAR(6),
  [StudBookNumber] NVARCHAR(32),
  -- Stud? PLEM is breed? -> yes it is breed = plemenna kniha
  [StudBookName] NVARCHAR(32),
  [Name] NVARCHAR(128),
  [Notch] NVARCHAR(128),
  [Chip] NVARCHAR(128),
  [RingNumber] NVARCHAR(128),
  [OtherMarking] NVARCHAR(128),
  [IsHybrid] BIT NOT NULL DEFAULT(0),
  [Location] NVARCHAR(40),
  [IsFree] BIT NOT NULL DEFAULT(0),
  -- NOTE: does it mean something like safari?
  [BirthDate] NVARCHAR(16),
  [BirthPlace] NVARCHAR(32),
  [BirthMethod] NVARCHAR(16),
  [Rearing] NVARCHAR(10),
  [FatherId] INT,
  [MotherId] INT,
  [Note] NVARCHAR(MAX),
  [OtherDetails] NVARCHAR(MAX),
  [Photo] VARBINARY(MAX),
  [RegisteredDate] NVARCHAR(10),
  [RegisteredTo] NVARCHAR(32),
  [RegistrationNumber] NVARCHAR(128),
  [CadaverDate] NVARCHAR(16),
  [CadaverPlace] NVARCHAR(32),
  [EuPermit] NVARCHAR(48),
  [CzechRegistrationNumber] NVARCHAR(48),
  [FatherZims] NVARCHAR(32),
  [MotherZims] NVARCHAR(32),
  [RingNumberSecondary] NVARCHAR(128),
  [OtherMarkingSecondary] NVARCHAR(128),
  [ChipSecondary] NVARCHAR(128),
  [NotchSecondary] NVARCHAR(128),
  [Documentation] NVARCHAR(256),
  -- NOTE: can be probably removed. No record it the table column.
  [Ueln] NVARCHAR(48),
  -- UELN?
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),

  -- NOTE: Calculated columns
  [InDate] NVARCHAR(10),
  [InReason] VARCHAR(5),
  [InLocationId] INT,
  [OutDate] NVARCHAR(10),
  [OutReason] VARCHAR(5),
  [OutLocationId] INT,
  [Price] DECIMAL(18,2),
  [QuantityOwned] INT NOT NULL DEFAULT 0,
  [QuantityInZoo] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedFrom] INT NOT NULL DEFAULT 0,
  [QuantityDeponatedTo] INT NOT NULL DEFAULT 0,
  [PlacementDate] NVARCHAR(10),
  [RegionId] INT,
  -- NOTE: NEW PLACEMENTS
  [PlacementLocationId] INT,
  [OrganizationLevelId] INT,
  CONSTRAINT FK_Specimens_Species FOREIGN KEY ([SpeciesId]) REFERENCES [dbo].[Species]([Id]),
  CONSTRAINT FK_Specimens_Father FOREIGN KEY ([FatherId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_Specimens_Mother FOREIGN KEY ([MotherId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_Specimens_GenderTypes FOREIGN KEY ([GenderType]) REFERENCES [dbo].[GenderTypes]([Code]),
  CONSTRAINT FK_Specimens_ClassificationTypes FOREIGN KEY ([ClassificationType]) REFERENCES [dbo].[ClassificationTypes]([Code]),
  CONSTRAINT FK_Specimens_Regions FOREIGN KEY ([RegionId]) REFERENCES [dbo].[Regions]([Id]),
  CONSTRAINT FK_Specimens_OrganizationLevels FOREIGN KEY ([OrganizationLevelId]) REFERENCES [dbo].[OrganizationLevels]([Id]),
  CONSTRAINT FK_Specimens_PlacementLocation FOREIGN KEY ([PlacementLocationId]) REFERENCES [dbo].[Locations]([Id])
);

CREATE TABLE [dbo].[Partners]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Keyword] NVARCHAR(32) NOT NULL,
  [Name] NVARCHAR(128),
  [Status] NVARCHAR(32),
  -- Probably not correct column name. (STATUT)
  [City] NVARCHAR(48),
  [StreetAddress] NVARCHAR(64),
  [PostalCode] NVARCHAR(10),
  [Country] NVARCHAR(64),
  [Phone] NVARCHAR(20),
  [Fax] NVARCHAR(20),
  [Email] NVARCHAR(128),
  [PartnerType] NVARCHAR(4),
  -- can be removed? no data in the legacy db
  [LastName] NVARCHAR(32),
  [FirstName] NVARCHAR(32),
  [Note] NVARCHAR(MAX)
);

-- DOKLADD
CREATE TABLE [dbo].[DocumentSpecies]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpeciesId] INT NOT NULL,
  [DocumentType] VARCHAR(5) NOT NULL,
  [Date] NVARCHAR(16),
  [Number] NVARCHAR(128) NOT NULL,
  [Note] NVARCHAR(MAX),
  [IsValid] BIT NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_DocumentSpecies_Species FOREIGN KEY ([SpeciesId]) REFERENCES [dbo].[Species]([Id]),
  CONSTRAINT FK_DocumentSpecies_SpeciesDocumentTypes FOREIGN KEY ([DocumentType]) REFERENCES [dbo].[SpeciesDocumentTypes]([Code])
);

-- DOKLADE
CREATE TABLE [dbo].[DocumentSpecimens]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [DocumentType] VARCHAR(5) NOT NULL,
  [Number] NVARCHAR(128) NOT NULL,
  [Date] NVARCHAR(16),
  [Partner] NVARCHAR(128),
  --  NOTE: it looks like it is string value from the Partners table (investigate)
  [Note] NVARCHAR(MAX),
  [IsValid] BIT NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_DocumentSpecimens_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_DocumentSpecimens_SpecimenDocumentTypes FOREIGN KEY ([DocumentType]) REFERENCES [dbo].[SpecimenDocumentTypes]([Code])
);

-- KADAVER
CREATE TABLE [dbo].[Cadavers]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [Date] NVARCHAR(16),
  [Location] NVARCHAR(128),
  -- NOTE: it is not int value as in the Movement table, but it looks like it is string value from the Partners table (investigate)
  [Note] NVARCHAR(MAX),
  [Photo] VARBINARY(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Cadavers_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id])
);

-- KADRESAR
CREATE TABLE [dbo].[CadaverPartners]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Keyword] NVARCHAR(32) NOT NULL,
  [Name] NVARCHAR(128),
  [City] NVARCHAR(48),
  [StreetAndNumber] NVARCHAR(64),
  [PostalCode] NVARCHAR(10),
  [Country] NVARCHAR(64),
  [Phone] NVARCHAR(20),
  [Fax] NVARCHAR(20),
  [Email] NVARCHAR(128),
  [LastName] NVARCHAR(32),
  [FirstName] NVARCHAR(32),
  [Note] NVARCHAR(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE()
);

-- SMLOUVA
CREATE TABLE [dbo].[Contracts]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Number] NVARCHAR(32) NOT NULL,
  [Date] NVARCHAR(10) NOT NULL,
  [MovementReason] VARCHAR(5),
  [ContractType] VARCHAR(5),
  [PartnerId] INT,
  [Note] NVARCHAR(MAX),
  [NotePrague] NVARCHAR(MAX),
  [NotePartner] NVARCHAR(MAX),
  [Year] INT,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Contracts_Partners FOREIGN KEY ([PartnerId]) REFERENCES [dbo].[Partners]([Id]),
  CONSTRAINT FK_Contracts_ContractTypes FOREIGN KEY ([ContractType]) REFERENCES [dbo].[ContractTypes]([Code]),
  CONSTRAINT FK_Contracts_ContractMovementReasons FOREIGN KEY ([MovementReason]) REFERENCES [dbo].[ContractMovementReasons]([Code])
);

CREATE TABLE [dbo].[Movements]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [Date] NVARCHAR(10) NOT NULL,
  [Quantity] INT NOT NULL,
  [QuantityActual] INT NOT NULL,
  [IncrementReason] VARCHAR(5),
  -- NOTE: Investigate if enum is same as Decrease reason and Contracts.MovementReason
  [DecrementReason] VARCHAR(5),
  [LocationId] INT,
  -- NOTE: looks like it is ID of the location, probably FK from other table, relation is missing in the original table. (investigate)
  [CitesImport] NVARCHAR(50),
  [CitesExport] NVARCHAR(50),
  [Price] DECIMAL(18,2),
  [Note] NVARCHAR(MAX),
  [Gender] NVARCHAR(16),
  -- NOTE: not gender, What for is this? SDRPOHLAVI => original column name and values are numbers like 0,6 or 0.6.0 etc.
  [AccountingDate] NVARCHAR(24),
  [PriceFinal] DECIMAL(18,2),
  -- NOTE: this is price column -> change to decimal and ask if used and purpose. confirm with drozda. 
  [DepType] CHAR(1),
  -- NOTE: this has values as null, -, + -> , probably not used, confirm with Drozda (deponace?)
  [ContractNumber] NVARCHAR(32),
  -- Is the ContractNumber related to Contracts table? Is it possible to edit? There are no data in the legacy in this column. So can be probably removed.
  [ContractNote] NVARCHAR(MAX),
  [ContractId] INT,
  [SourceType] CHAR(1) NOT NULL,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Movements_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_Movements_Contracts FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Contracts]([Id]),
  CONSTRAINT FK_Movements_IncrementReasons FOREIGN KEY ([IncrementReason]) REFERENCES [dbo].[IncrementReasons]([Code]),
  CONSTRAINT FK_Movements_DecrementReasons FOREIGN KEY ([DecrementReason]) REFERENCES [dbo].[DecrementReasons]([Code])
);


-- UKONSMLOUVY
CREATE TABLE [dbo].[ContractActions]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [ContractId] INT NOT NULL,
  [Date] NVARCHAR(10),
  [ActionType] VARCHAR(5),
  [ActionInitiator] VARCHAR(5),
  [Note] NVARCHAR(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_ContractActions_Contract FOREIGN KEY ([ContractId]) REFERENCES [dbo].[Contracts]([Id]),
  CONSTRAINT FK_ContractActions_ContractActionTypes FOREIGN KEY ([ActionType]) REFERENCES [dbo].[ContractActionTypes]([Code]),
  CONSTRAINT FK_ContractActions_ContractActionInitiators FOREIGN KEY ([ActionInitiator]) REFERENCES [dbo].[ContractActionInitiators]([Code])
);

CREATE TABLE [dbo].[Placements]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT,
  [OriginSpecimenId] INT,
  -- NOTE: investigate. Remove in case of A and B tables merged
  [RegionId] INT NOT NULL,
  [Date] NVARCHAR(10) NOT NULL,
  [Note] NVARCHAR(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Placements_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_Placements_Regions FOREIGN KEY ([RegionId]) REFERENCES [dbo].[Regions]([Id])
);

-- ZAZNAMY
CREATE TABLE [dbo].[RecordSpecimens]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [Date] NVARCHAR(10) NOT NULL,
  [ActionType] VARCHAR(5),
  [Note] NVARCHAR(MAX),
  [PartnerId] INT,
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_RecordSpecimens_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_RecordSpecimens_RecordActionTypes FOREIGN KEY ([ActionType]) REFERENCES [dbo].[RecordActionTypes]([Code])
);

-- ZAZNAMY_D
CREATE TABLE [dbo].[RecordSpecies]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpeciesId] INT NOT NULL,
  [Date] NVARCHAR(10) NOT NULL,
  -- NOTE: we should not use Date probably as the column name
  [ActionType] VARCHAR(5),
  [Note] NVARCHAR(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_RecordSpecies_Species FOREIGN KEY ([SpeciesId]) REFERENCES [dbo].[Species]([Id]),
  CONSTRAINT FK_RecordSpecies_RecordActionTypes FOREIGN KEY ([ActionType]) REFERENCES [dbo].[RecordActionTypes]([Code])
);

-- ZAHRADY
CREATE TABLE [dbo].[Zoos]
(
  [Id] NVARCHAR(3) NOT NULL PRIMARY KEY,
  [Keyword] NVARCHAR(32) NOT NULL,
  [Name] NVARCHAR(128),
  [City] NVARCHAR(48),
  [StreetNumber] NVARCHAR(32),
  [PostalCode] NVARCHAR(10),
  [Country] NVARCHAR(64),
  [Phone] NVARCHAR(20),
  [Fax] NVARCHAR(20),
  [Email] NVARCHAR(128),
  [Website] NVARCHAR(64),
  [LastName] NVARCHAR(32),
  [FirstName] NVARCHAR(32),
  [Note] NVARCHAR(MAX)
);

CREATE TABLE [dbo].[Users]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserName] NVARCHAR(256) NOT NULL,
  [VisibleTaxonomyStatuses] NVARCHAR(128),
  [TaxonomySearchByCz] BIT NOT NULL DEFAULT(0),
  [TaxonomySearchByLat] BIT NOT NULL DEFAULT(1),
);

CREATE TABLE [dbo].[UserRoles]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserId] INT NOT NULL,
  [RoleName] NVARCHAR(256)
  CONSTRAINT FK_UserRoles_Users FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
);

CREATE TABLE [dbo].[UserTableSettings]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserId] INT NOT NULL,
  [TableId] NVARCHAR(256) NOT NULL,
  [Settings] NVARCHAR(MAX) NOT NULL,
  CONSTRAINT FK_UserTableSettings_Users FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]),
);

-- ZNACENI
CREATE TABLE [dbo].[Markings]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [MarkingType] VARCHAR(5) NOT NULL,
  [RingNumber] NVARCHAR(32),
  [Color] VARCHAR(16),
  [Side] VARCHAR(2),
  [LocatedOn] VARCHAR(2),
  [IsValid] BIT NOT NULL DEFAULT(1),
  [MarkingDate] NVARCHAR(16),
  [Note] NVARCHAR(MAX),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_Markings_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_Markings_MarkingTypes FOREIGN KEY ([MarkingType]) REFERENCES [dbo].[MarkingTypes]([Code])
);

CREATE TABLE [dbo].[SpecimenPlacements]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [ValidSince] NVARCHAR(10) NOT NULL,
  [LocationId] INT,
  [OrganizationLevelId] INT,
  [Note] NVARCHAR(255),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME DEFAULT GETDATE(),
  CONSTRAINT FK_SpecimenPlacements_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT FK_SpecimenPlacements_OrganizationLevels FOREIGN KEY ([OrganizationLevelId]) REFERENCES [dbo].[OrganizationLevels]([Id]),
  CONSTRAINT FK_SpecimenPlacements_Locations FOREIGN KEY ([LocationId]) REFERENCES [dbo].[Locations]([Id])
);

CREATE TABLE [dbo].[UserFlaggedDistricts]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserId] INT NOT NULL,
  [DistrictId] INT NOT NULL,
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ModifiedBy] NVARCHAR(64),
  CONSTRAINT FK_UserFlaggedDistricts_Users FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]),
  CONSTRAINT FK_UserFlaggedDistricts_OrganizationLevels FOREIGN KEY ([DistrictId]) REFERENCES [dbo].[OrganizationLevels] ([Id]),
  CONSTRAINT UQ_UserFlaggedDistricts_User_District UNIQUE ([UserId], [DistrictId])
);

CREATE TABLE [dbo].[UserFlaggedSpecies]
(
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserId] INT NOT NULL,
  [SpeciesId] INT NOT NULL,
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ModifiedBy] NVARCHAR(64),
  CONSTRAINT FK_UserFlaggedSpecies_Users FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]),
  CONSTRAINT FK_UserFlaggedSpecies_Species FOREIGN KEY ([SpeciesId]) REFERENCES [dbo].[Species] ([Id]),
  CONSTRAINT UQ_UserFlaggedSpecies_User_Species UNIQUE ([UserId], [SpeciesId])
);

CREATE TABLE [dbo].[SpecimenImages] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [SpecimenId] INT NOT NULL,
  [Label] NVARCHAR(255) NOT NULL,
  [Description] NVARCHAR(1000) NULL,
  [Image] VARBINARY(MAX) NOT NULL,
  [ContentType] NVARCHAR(64) NOT NULL,
  [ModifiedBy] NVARCHAR(64) NULL,
  [ModifiedAt] DATETIME NULL DEFAULT GETDATE(),
  CONSTRAINT FK_SpecimenImages_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id])
);

-- JOURNAL

CREATE TABLE [dbo].[JournalActionTypes] (
  [Code] VARCHAR(5) NOT NULL PRIMARY KEY,
  [JournalEntryType] NVARCHAR(10) NOT NULL CHECK ([JournalEntryType] IN ('Bio', 'Movement')),
  [Sort] INT NOT NULL,
  [DisplayName] NVARCHAR(50) NOT NULL,
  [Note] NVARCHAR(255) NULL,
  CONSTRAINT UQ_JournalEntryType_Sort UNIQUE ([JournalEntryType], [Sort]),
  CONSTRAINT UQ_JournalEntryType_DisplayName UNIQUE ([JournalEntryType], [DisplayName])
);

CREATE TABLE [dbo].[JournalEntries] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [OrganizationLevelId] INT NOT NULL,
  [SpeciesId] INT NOT NULL,
  [AuthorName] NVARCHAR(255) NOT NULL,
  [EntryType] NVARCHAR(10) CHECK ([EntryType] IN ('Bio', 'Movement')),
  [EntryDate] DATETIME NOT NULL,
  [ActionTypeCode] VARCHAR(5) NOT NULL,
  [Status] NVARCHAR(32) NOT NULL CHECK ([Status] IN ('1-review', '2-closed_in_review', '3-review_in_doc', '4-closed_in_doc', '5-solved_in_doc')),
  [Note] NVARCHAR(1024),
  [IsLocked] BIT NOT NULL DEFAULT 0,
  [IsDeleted] BIT NOT NULL DEFAULT 0,
  [CreatedBy] NVARCHAR(64) NOT NULL,
  [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ReviewedBy] NVARCHAR(64),
  [ReviewedAt] DATETIME,
  [CuratorReviewNote] NVARCHAR(255),
  [ArchiveReviewedBy] NVARCHAR(64),
  [ArchiveReviewedAt] DATETIME,
  [ArchiveReviewNote] NVARCHAR(255),
  CONSTRAINT FK_JournalEntries_OrganizationLevels FOREIGN KEY ([OrganizationLevelId]) REFERENCES [dbo].[OrganizationLevels]([Id]),
  CONSTRAINT FK_JournalEntries_ActionType FOREIGN KEY ([ActionTypeCode]) REFERENCES [dbo].[JournalActionTypes]([Code]),
  CONSTRAINT FK_JournalEntries_Species FOREIGN KEY ([SpeciesId]) REFERENCES [dbo].[Species]([Id])
);

CREATE TABLE [dbo].[JournalEntrySpecimens] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [JournalEntryId] INT NOT NULL,
  [SpecimenId] INT NOT NULL,
  [Note] NVARCHAR(255),
  [ModifiedBy] NVARCHAR(64),
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_JournalEntrySpecimens_JournalEntries FOREIGN KEY ([JournalEntryId]) REFERENCES [dbo].[JournalEntries]([Id]),
  CONSTRAINT FK_JournalEntrySpecimens_Specimens FOREIGN KEY ([SpecimenId]) REFERENCES [dbo].[Specimens]([Id]),
  CONSTRAINT UQ_JournalEntrySpecimens UNIQUE ([JournalEntryId], [SpecimenId])
);

CREATE TABLE [dbo].[JournalEntryAttributes] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [JournalEntryId] INT NOT NULL,
  [AttributeTypeCode] NVARCHAR(64) NOT NULL,
  [AttributeValue] NVARCHAR(1024),
  CONSTRAINT FK_JournalEntryAttributes_JournalEntries FOREIGN KEY ([JournalEntryId]) REFERENCES [dbo].[JournalEntries]([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[JournalEntrySpecimenAttributes] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [JournalEntrySpecimenId] INT NOT NULL,
  [AttributeTypeCode] NVARCHAR(64) NOT NULL,
  [AttributeValue] NVARCHAR(1024),
  CONSTRAINT FK_JournalEntrySpecimenAttributes_JournalEntrySpecimens FOREIGN KEY ([JournalEntrySpecimenId]) REFERENCES [dbo].[JournalEntrySpecimens]([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[JournalEntryAudits] (
  [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [JournalEntryId] INT NOT NULL,
  [ActionType] VARCHAR(32) NOT NULL,
  [SerializedData] NVARCHAR(MAX) NULL,
  [ModifiedBy] NVARCHAR(64) NOT NULL,
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_JournalEntryAudits_JournalEntries FOREIGN KEY ([JournalEntryId]) REFERENCES [dbo].[JournalEntries]([Id])
);

CREATE TABLE [dbo].[JournalActionTypesToOrganizationLevels] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [ActionTypeCode] VARCHAR(5) NOT NULL,
  [OrganizationLevelId] INT NOT NULL,
  CONSTRAINT FK_JournalActionTypesToOrganizationLevels_OrganizationLevels FOREIGN KEY ([OrganizationLevelId]) REFERENCES [dbo].[OrganizationLevels]([Id]),
  CONSTRAINT FK_JournalActionTypesToOrganizationLevels_ActionType FOREIGN KEY ([ActionTypeCode]) REFERENCES [dbo].[JournalActionTypes]([Code])
);
