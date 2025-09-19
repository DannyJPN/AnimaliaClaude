-- PostgreSQL migration script converted from MSSQL
-- Drop indexes and views first
DROP INDEX IF EXISTS IX_TaxonomyHierarchyView;
DROP VIEW IF EXISTS TaxonomyHierarchyView CASCADE;
DROP INDEX IF EXISTS IX_ExpositionHierarchyView;
DROP VIEW IF EXISTS ExpositionHierarchyView CASCADE;
DROP VIEW IF EXISTS OrganizationHierarchyView CASCADE;

-- Drop tables in dependency order
DROP TABLE IF EXISTS JournalActionTypesToOrganizationLevels CASCADE;
DROP TABLE IF EXISTS SpecimenImages CASCADE;
DROP TABLE IF EXISTS UserFlaggedDistricts CASCADE;
DROP TABLE IF EXISTS UserFlaggedSpecies CASCADE;
DROP TABLE IF EXISTS JournalActionTypeDefinitions CASCADE;
DROP TABLE IF EXISTS JournalEntrySpecimenAttributes CASCADE;
DROP TABLE IF EXISTS JournalEntryAttributes CASCADE;
DROP TABLE IF EXISTS JournalEntrySpecimens CASCADE;
DROP TABLE IF EXISTS JournalEntryAudits CASCADE;
DROP TABLE IF EXISTS JournalEntries CASCADE;
DROP TABLE IF EXISTS JournalActionTypes CASCADE;
DROP TABLE IF EXISTS SpecimenPlacements CASCADE;
DROP TABLE IF EXISTS Markings CASCADE;
DROP TABLE IF EXISTS SpecimenAggregatedMovements CASCADE;
DROP TABLE IF EXISTS Zoos CASCADE;
DROP TABLE IF EXISTS RecordSpecimens CASCADE;
DROP TABLE IF EXISTS RecordSpecies CASCADE;
DROP TABLE IF EXISTS Placements CASCADE;
DROP TABLE IF EXISTS ContractActions CASCADE;
DROP TABLE IF EXISTS Movements CASCADE;
DROP TABLE IF EXISTS Contracts CASCADE;
DROP TABLE IF EXISTS Cadavers CASCADE;
DROP TABLE IF EXISTS CadaverPartners CASCADE;
DROP TABLE IF EXISTS DocumentSpecimens CASCADE;
DROP TABLE IF EXISTS DocumentSpecies CASCADE;
DROP TABLE IF EXISTS Partners CASCADE;
DROP TABLE IF EXISTS Specimens CASCADE;
DROP TABLE IF EXISTS Species CASCADE;
DROP TABLE IF EXISTS TaxonomyGenera CASCADE;
DROP TABLE IF EXISTS TaxonomyFamilies CASCADE;
DROP TABLE IF EXISTS TaxonomyOrders CASCADE;
DROP TABLE IF EXISTS TaxonomyClasses CASCADE;
DROP TABLE IF EXISTS TaxonomyPhyla CASCADE;
DROP TABLE IF EXISTS ContractTypes CASCADE;
DROP TABLE IF EXISTS ContractMovementReasons CASCADE;
DROP TABLE IF EXISTS ContractActionTypes CASCADE;
DROP TABLE IF EXISTS ContractActionInitiators CASCADE;
DROP TABLE IF EXISTS SpecimenDocumentTypes CASCADE;
DROP TABLE IF EXISTS SpeciesDocumentTypes CASCADE;
DROP TABLE IF EXISTS RecordActionTypes CASCADE;
DROP TABLE IF EXISTS SpeciesProtectionTypes CASCADE;
DROP TABLE IF EXISTS ZooStatuses CASCADE;
DROP TABLE IF EXISTS RdbCodes CASCADE;
DROP TABLE IF EXISTS MarkingTypes CASCADE;
DROP TABLE IF EXISTS SpeciesCiteTypes CASCADE;
DROP TABLE IF EXISTS ClassificationTypes CASCADE;
DROP TABLE IF EXISTS EuCodes CASCADE;
DROP TABLE IF EXISTS GenderTypes CASCADE;
DROP TABLE IF EXISTS OriginTypes CASCADE;
DROP TABLE IF EXISTS IncrementReasons CASCADE;
DROP TABLE IF EXISTS DecrementReasons CASCADE;
DROP TABLE IF EXISTS Rearings CASCADE;
DROP TABLE IF EXISTS BirthMethods CASCADE;
DROP TABLE IF EXISTS Regions CASCADE;
DROP TABLE IF EXISTS Sections CASCADE;
DROP TABLE IF EXISTS Locations CASCADE;
DROP TABLE IF EXISTS ExpositionSets CASCADE;
DROP TABLE IF EXISTS ExpositionAreas CASCADE;
DROP TABLE IF EXISTS OrganizationLevels CASCADE;
DROP TABLE IF EXISTS UserTableSettings CASCADE;
DROP TABLE IF EXISTS UserRoles CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Create tables with PostgreSQL syntax
CREATE TABLE OrganizationLevels
(
  Id SERIAL PRIMARY KEY,
  ParentId INT,
  Level VARCHAR(10) NOT NULL CHECK (Level IN ('department', 'workplace', 'district')),
  Name VARCHAR(255) NOT NULL,
  Director VARCHAR(255),
  JournalContributorGroup VARCHAR(1024),
  JournalReadGroup VARCHAR(1024),
  JournalApproversGroup VARCHAR(1024),
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_OrganizationLevels_OrganizationLevels FOREIGN KEY (ParentId) REFERENCES OrganizationLevels (Id)
);

CREATE TABLE ExpositionAreas
(
  Id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  Note TEXT,
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ExpositionSets
(
  Id SERIAL PRIMARY KEY,
  ExpositionAreaId INT NOT NULL,
  Name VARCHAR(255) NOT NULL,
  Note TEXT,
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_ExpositionSets_ExpositionAreas FOREIGN KEY (ExpositionAreaId) REFERENCES ExpositionAreas (Id)
);

CREATE TABLE Locations
(
  Id SERIAL PRIMARY KEY,
  OrganizationLevelId INT NOT NULL,
  ExpositionSetId INT,
  Name VARCHAR(255) NOT NULL,
  Note VARCHAR(255),
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_Locations_OrganizationLevels FOREIGN KEY (OrganizationLevelId) REFERENCES OrganizationLevels (Id),
  CONSTRAINT FK_Locations_ExpositionSets FOREIGN KEY (ExpositionSetId) REFERENCES ExpositionSets (Id) ON DELETE SET NULL
);

CREATE TABLE Users
(
  Id SERIAL PRIMARY KEY,
  Username VARCHAR(255) NOT NULL UNIQUE,
  DisplayName VARCHAR(255),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UserRoles
(
  Id SERIAL PRIMARY KEY,
  UserId INT NOT NULL,
  Role VARCHAR(50) NOT NULL,

  CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE
);

CREATE TABLE UserTableSettings
(
  Id SERIAL PRIMARY KEY,
  UserId INT NOT NULL,
  TableId VARCHAR(100) NOT NULL,
  Settings TEXT,

  CONSTRAINT FK_UserTableSettings_Users FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE
);

-- Lookup tables
CREATE TABLE Sections
(
  Id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE Regions
(
  Id SERIAL PRIMARY KEY,
  SectionId INT NOT NULL,
  Name VARCHAR(255) NOT NULL,

  CONSTRAINT FK_Regions_Sections FOREIGN KEY (SectionId) REFERENCES Sections (Id)
);

CREATE TABLE BirthMethods
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE Rearings
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE DecrementReasons
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE IncrementReasons
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE OriginTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE GenderTypes
(
  Code VARCHAR(1) PRIMARY KEY,
  Name VARCHAR(50) NOT NULL
);

CREATE TABLE EuCodes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ClassificationTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE SpeciesCiteTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE MarkingTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE RdbCodes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ZooStatuses
(
  Code VARCHAR(1) PRIMARY KEY,
  Name VARCHAR(50) NOT NULL
);

CREATE TABLE SpeciesProtectionTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE RecordActionTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE SpeciesDocumentTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE SpecimenDocumentTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ContractActionInitiators
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ContractActionTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ContractMovementReasons
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

CREATE TABLE ContractTypes
(
  Code VARCHAR(10) PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- Taxonomy tables
CREATE TABLE TaxonomyPhyla
(
  Id SERIAL PRIMARY KEY,
  ZooStatus VARCHAR(1),
  Code VARCHAR(3),
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT
);

CREATE TABLE TaxonomyClasses
(
  Id SERIAL PRIMARY KEY,
  TaxonomyPhylumId INT NOT NULL,
  ZooStatus VARCHAR(1) NOT NULL,
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT,

  CONSTRAINT FK_TaxonomyClasses_TaxonomyPhyla FOREIGN KEY (TaxonomyPhylumId) REFERENCES TaxonomyPhyla (Id)
);

CREATE TABLE TaxonomyOrders
(
  Id SERIAL PRIMARY KEY,
  TaxonomyClassId INT NOT NULL,
  ZooStatus VARCHAR(1),
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT,

  CONSTRAINT FK_TaxonomyOrders_TaxonomyClasses FOREIGN KEY (TaxonomyClassId) REFERENCES TaxonomyClasses (Id)
);

CREATE TABLE TaxonomyFamilies
(
  Id SERIAL PRIMARY KEY,
  TaxonomyOrderId INT NOT NULL,
  ZooStatus VARCHAR(1),
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT,

  CONSTRAINT FK_TaxonomyFamilies_TaxonomyOrders FOREIGN KEY (TaxonomyOrderId) REFERENCES TaxonomyOrders (Id)
);

CREATE TABLE TaxonomyGenera
(
  Id SERIAL PRIMARY KEY,
  TaxonomyFamilyId INT NOT NULL,
  ZooStatus VARCHAR(1),
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT,

  CONSTRAINT FK_TaxonomyGenera_TaxonomyFamilies FOREIGN KEY (TaxonomyFamilyId) REFERENCES TaxonomyFamilies (Id)
);

-- Species table
CREATE TABLE Species
(
  Id SERIAL PRIMARY KEY,
  TaxonomyGenusId INT NOT NULL,
  RegionId INT,
  ClassificationType VARCHAR(10) NOT NULL,
  CiteType VARCHAR(10),
  ProtectionType VARCHAR(10),
  Name VARCHAR(255) NOT NULL,
  Author VARCHAR(255),
  Year INT,
  Czech VARCHAR(255),
  English VARCHAR(255),
  German VARCHAR(255),
  Latin VARCHAR(255),
  Note TEXT,

  CONSTRAINT FK_Species_TaxonomyGenera FOREIGN KEY (TaxonomyGenusId) REFERENCES TaxonomyGenera (Id),
  CONSTRAINT FK_Species_Regions FOREIGN KEY (RegionId) REFERENCES Regions (Id),
  CONSTRAINT FK_Species_ClassificationTypes FOREIGN KEY (ClassificationType) REFERENCES ClassificationTypes (Code),
  CONSTRAINT FK_Species_SpeciesCiteTypes FOREIGN KEY (CiteType) REFERENCES SpeciesCiteTypes (Code),
  CONSTRAINT FK_Species_SpeciesProtectionTypes FOREIGN KEY (ProtectionType) REFERENCES SpeciesProtectionTypes (Code)
);

-- Partners table
CREATE TABLE Partners
(
  Id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  Address VARCHAR(500),
  Phone VARCHAR(50),
  Email VARCHAR(255),
  Note TEXT
);

-- Specimens table
CREATE TABLE Specimens
(
  Id SERIAL PRIMARY KEY,
  SpeciesId INT NOT NULL,
  OrganizationLevelId INT,
  PlacementLocationId INT,
  InLocationId INT,
  OutLocationId INT,
  FatherId INT,
  MotherId INT,
  ClassificationType VARCHAR(10),
  GenderType VARCHAR(1),
  InReason VARCHAR(10),
  OutReason VARCHAR(10),
  ZimsId VARCHAR(50),
  LocalId VARCHAR(50),
  Name VARCHAR(255),
  InDate DATE,
  OutDate DATE,
  BirthDate DATE,
  Note TEXT,

  CONSTRAINT FK_Specimens_Species FOREIGN KEY (SpeciesId) REFERENCES Species (Id),
  CONSTRAINT FK_Specimens_OrganizationLevels FOREIGN KEY (OrganizationLevelId) REFERENCES OrganizationLevels (Id),
  CONSTRAINT FK_Specimens_Locations_Placement FOREIGN KEY (PlacementLocationId) REFERENCES Locations (Id),
  CONSTRAINT FK_Specimens_Locations_In FOREIGN KEY (InLocationId) REFERENCES Locations (Id),
  CONSTRAINT FK_Specimens_Locations_Out FOREIGN KEY (OutLocationId) REFERENCES Locations (Id),
  CONSTRAINT FK_Specimens_Father FOREIGN KEY (FatherId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Specimens_Mother FOREIGN KEY (MotherId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Specimens_ClassificationTypes FOREIGN KEY (ClassificationType) REFERENCES ClassificationTypes (Code),
  CONSTRAINT FK_Specimens_GenderTypes FOREIGN KEY (GenderType) REFERENCES GenderTypes (Code),
  CONSTRAINT FK_Specimens_IncrementReasons FOREIGN KEY (InReason) REFERENCES IncrementReasons (Code),
  CONSTRAINT FK_Specimens_DecrementReasons FOREIGN KEY (OutReason) REFERENCES DecrementReasons (Code)
);

-- Document tables
CREATE TABLE DocumentSpecies
(
  Id SERIAL PRIMARY KEY,
  SpeciesId INT NOT NULL,
  DocumentType VARCHAR(10) NOT NULL,
  DocumentNumber VARCHAR(100),
  DocumentDate DATE,
  Note TEXT,

  CONSTRAINT FK_DocumentSpecies_Species FOREIGN KEY (SpeciesId) REFERENCES Species (Id),
  CONSTRAINT FK_DocumentSpecies_DocumentTypes FOREIGN KEY (DocumentType) REFERENCES SpeciesDocumentTypes (Code)
);

CREATE TABLE DocumentSpecimens
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  DocumentType VARCHAR(10) NOT NULL,
  DocumentNumber VARCHAR(100),
  DocumentDate DATE,
  Note TEXT,

  CONSTRAINT FK_DocumentSpecimens_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_DocumentSpecimens_DocumentTypes FOREIGN KEY (DocumentType) REFERENCES SpecimenDocumentTypes (Code)
);

-- Other entity tables
CREATE TABLE CadaverPartners
(
  Id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  Address VARCHAR(500),
  Note TEXT
);

CREATE TABLE Cadavers
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  CadaverPartnerId INT,
  DeathDate DATE,
  CauseOfDeath TEXT,
  Note TEXT,

  CONSTRAINT FK_Cadavers_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Cadavers_CadaverPartners FOREIGN KEY (CadaverPartnerId) REFERENCES CadaverPartners (Id)
);

CREATE TABLE Contracts
(
  Id SERIAL PRIMARY KEY,
  PartnerId INT NOT NULL,
  ContractType VARCHAR(10) NOT NULL,
  MovementReason VARCHAR(10) NOT NULL,
  ContractNumber VARCHAR(100),
  ContractDate DATE,
  Note TEXT,

  CONSTRAINT FK_Contracts_Partners FOREIGN KEY (PartnerId) REFERENCES Partners (Id),
  CONSTRAINT FK_Contracts_ContractTypes FOREIGN KEY (ContractType) REFERENCES ContractTypes (Code),
  CONSTRAINT FK_Contracts_MovementReasons FOREIGN KEY (MovementReason) REFERENCES ContractMovementReasons (Code)
);

CREATE TABLE Movements
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  LocationId INT,
  ContractId INT,
  IncrementReason VARCHAR(10),
  DecrementReason VARCHAR(10),
  MovementDate DATE,
  Quantity INT,
  Note TEXT,

  CONSTRAINT FK_Movements_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Movements_Partners FOREIGN KEY (LocationId) REFERENCES Partners (Id),
  CONSTRAINT FK_Movements_Contracts FOREIGN KEY (ContractId) REFERENCES Contracts (Id),
  CONSTRAINT FK_Movements_IncrementReasons FOREIGN KEY (IncrementReason) REFERENCES IncrementReasons (Code),
  CONSTRAINT FK_Movements_DecrementReasons FOREIGN KEY (DecrementReason) REFERENCES DecrementReasons (Code)
);

-- Create a PostgreSQL trigger for movement calculations (equivalent to SQL Server trigger)
CREATE OR REPLACE FUNCTION calculate_movement_aggregations()
RETURNS TRIGGER AS $$
BEGIN
    -- This would contain the business logic for movement calculations
    -- For now, just a placeholder
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_Movements_CalculateAggregations
    AFTER INSERT OR UPDATE OR DELETE ON Movements
    FOR EACH ROW
    EXECUTE FUNCTION calculate_movement_aggregations();

-- Continue with remaining tables...
CREATE TABLE ContractActions
(
  Id SERIAL PRIMARY KEY,
  ContractId INT NOT NULL,
  ActionInitiator VARCHAR(10) NOT NULL,
  ActionType VARCHAR(10) NOT NULL,
  ActionDate DATE,
  Note TEXT,

  CONSTRAINT FK_ContractActions_Contracts FOREIGN KEY (ContractId) REFERENCES Contracts (Id),
  CONSTRAINT FK_ContractActions_ActionInitiators FOREIGN KEY (ActionInitiator) REFERENCES ContractActionInitiators (Code),
  CONSTRAINT FK_ContractActions_ActionTypes FOREIGN KEY (ActionType) REFERENCES ContractActionTypes (Code)
);

CREATE TABLE Placements
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  RegionId INT,
  PlacementDate DATE,
  Note TEXT,

  CONSTRAINT FK_Placements_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Placements_Regions FOREIGN KEY (RegionId) REFERENCES Regions (Id)
);

CREATE TABLE RecordSpecies
(
  Id SERIAL PRIMARY KEY,
  SpeciesId INT NOT NULL,
  ActionType VARCHAR(10) NOT NULL,
  RecordDate DATE,
  Note TEXT,

  CONSTRAINT FK_RecordSpecies_Species FOREIGN KEY (SpeciesId) REFERENCES Species (Id),
  CONSTRAINT FK_RecordSpecies_ActionTypes FOREIGN KEY (ActionType) REFERENCES RecordActionTypes (Code)
);

CREATE TABLE RecordSpecimens
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT,
  PartnerId INT,
  ActionType VARCHAR(10) NOT NULL,
  RecordDate DATE,
  Note TEXT,

  CONSTRAINT FK_RecordSpecimens_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_RecordSpecimens_Partners FOREIGN KEY (PartnerId) REFERENCES Partners (Id),
  CONSTRAINT FK_RecordSpecimens_ActionTypes FOREIGN KEY (ActionType) REFERENCES RecordActionTypes (Code)
);

CREATE TABLE Zoos
(
  Id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  Code VARCHAR(10),
  Country VARCHAR(100),
  City VARCHAR(100)
);

CREATE TABLE SpecimenAggregatedMovements
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  TotalIn INT DEFAULT 0,
  TotalOut INT DEFAULT 0,
  CurrentBalance INT DEFAULT 0,
  LastCalculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_SpecimenAggregatedMovements_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id)
);

CREATE TABLE Markings
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  MarkingType VARCHAR(10) NOT NULL,
  MarkingValue VARCHAR(100),
  MarkingDate DATE,
  Note TEXT,

  CONSTRAINT FK_Markings_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_Markings_MarkingTypes FOREIGN KEY (MarkingType) REFERENCES MarkingTypes (Code)
);

CREATE TABLE SpecimenPlacements
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  LocationId INT,
  OrganizationLevelId INT,
  ValidSince VARCHAR(10) NOT NULL,
  Note VARCHAR(255),
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_SpecimenPlacements_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  CONSTRAINT FK_SpecimenPlacements_Locations FOREIGN KEY (LocationId) REFERENCES Locations (Id),
  CONSTRAINT FK_SpecimenPlacements_OrganizationLevels FOREIGN KEY (OrganizationLevelId) REFERENCES OrganizationLevels (Id)
);

-- Journal system tables
CREATE TABLE JournalActionTypes
(
  Code VARCHAR(5) PRIMARY KEY,
  JournalEntryType VARCHAR(32),
  DisplayName VARCHAR(32) NOT NULL,
  Note VARCHAR(256)
);

CREATE TABLE JournalEntries
(
  Id SERIAL PRIMARY KEY,
  OrganizationLevelId INT,
  SpeciesId INT,
  ActionTypeCode VARCHAR(5),
  AuthorName VARCHAR(255) NOT NULL,
  EntryDate DATE,
  EntryType VARCHAR(10),
  Status VARCHAR(32),
  Note TEXT,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(64),
  ModifiedAt TIMESTAMP,
  ModifiedBy VARCHAR(64),
  ReviewedAt TIMESTAMP,
  ReviewedBy VARCHAR(64),
  CuratorReviewNote VARCHAR(255),
  ArchiveReviewedAt TIMESTAMP,
  ArchiveReviewedBy VARCHAR(64),
  ArchiveReviewNote VARCHAR(255),
  IsDeleted BOOLEAN DEFAULT FALSE,

  CONSTRAINT FK_JournalEntries_OrganizationLevels FOREIGN KEY (OrganizationLevelId) REFERENCES OrganizationLevels (Id),
  CONSTRAINT FK_JournalEntries_Species FOREIGN KEY (SpeciesId) REFERENCES Species (Id),
  CONSTRAINT FK_JournalEntries_ActionTypes FOREIGN KEY (ActionTypeCode) REFERENCES JournalActionTypes (Code)
);

CREATE TABLE JournalEntryAudits
(
  Id SERIAL PRIMARY KEY,
  JournalEntryId INT NOT NULL,
  ActionType VARCHAR(64) NOT NULL,
  SerializedData TEXT,
  ModifiedBy VARCHAR(64) NOT NULL,
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_JournalEntryAudits_JournalEntries FOREIGN KEY (JournalEntryId) REFERENCES JournalEntries (Id)
);

CREATE TABLE JournalEntrySpecimens
(
  Id SERIAL PRIMARY KEY,
  JournalEntryId INT NOT NULL,
  SpecimenId INT,
  Note VARCHAR(255),
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_JournalEntrySpecimens_JournalEntries FOREIGN KEY (JournalEntryId) REFERENCES JournalEntries (Id),
  CONSTRAINT FK_JournalEntrySpecimens_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id),
  UNIQUE(JournalEntryId, SpecimenId)
);

CREATE TABLE JournalEntryAttributes
(
  Id SERIAL PRIMARY KEY,
  JournalEntryId INT NOT NULL,
  AttributeName VARCHAR(100),
  AttributeValue TEXT,

  CONSTRAINT FK_JournalEntryAttributes_JournalEntries FOREIGN KEY (JournalEntryId) REFERENCES JournalEntries (Id)
);

CREATE TABLE JournalEntrySpecimenAttributes
(
  Id SERIAL PRIMARY KEY,
  JournalEntrySpecimenId INT NOT NULL,
  AttributeName VARCHAR(100),
  AttributeValue TEXT,

  CONSTRAINT FK_JournalEntrySpecimenAttributes_JournalEntrySpecimens FOREIGN KEY (JournalEntrySpecimenId) REFERENCES JournalEntrySpecimens (Id)
);

CREATE TABLE UserFlaggedSpecies
(
  Id SERIAL PRIMARY KEY,
  UserId INT NOT NULL,
  SpeciesId INT NOT NULL,
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_UserFlaggedSpecies_Users FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE,
  CONSTRAINT FK_UserFlaggedSpecies_Species FOREIGN KEY (SpeciesId) REFERENCES Species (Id) ON DELETE CASCADE
);

CREATE TABLE UserFlaggedDistricts
(
  Id SERIAL PRIMARY KEY,
  UserId INT NOT NULL,
  DistrictId INT NOT NULL,
  ModifiedBy VARCHAR(64),
  ModifiedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT FK_UserFlaggedDistricts_Users FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE,
  CONSTRAINT FK_UserFlaggedDistricts_Districts FOREIGN KEY (DistrictId) REFERENCES OrganizationLevels (Id) ON DELETE CASCADE
);

CREATE TABLE SpecimenImages
(
  Id SERIAL PRIMARY KEY,
  SpecimenId INT NOT NULL,
  Label VARCHAR(255) NOT NULL,
  Description TEXT,
  Image BYTEA NOT NULL,

  CONSTRAINT FK_SpecimenImages_Specimens FOREIGN KEY (SpecimenId) REFERENCES Specimens (Id)
);

CREATE TABLE JournalActionTypesToOrganizationLevels
(
  Id SERIAL PRIMARY KEY,
  ActionTypeCode VARCHAR(5) NOT NULL,
  OrganizationLevelId INT NOT NULL,

  CONSTRAINT FK_JournalActionTypesToOrganizationLevels_ActionTypes FOREIGN KEY (ActionTypeCode) REFERENCES JournalActionTypes (Code),
  CONSTRAINT FK_JournalActionTypesToOrganizationLevels_OrganizationLevels FOREIGN KEY (OrganizationLevelId) REFERENCES OrganizationLevels (Id)
);

-- Create views (PostgreSQL equivalent)
CREATE VIEW TaxonomyHierarchyView AS
SELECT
    s.Id AS SpeciesId,
    p.Name AS PhylumName,
    c.Name AS ClassName,
    o.Name AS OrderName,
    f.Name AS FamilyName,
    g.Name AS GenusName,
    s.Name AS SpeciesName
FROM Species s
JOIN TaxonomyGenera g ON s.TaxonomyGenusId = g.Id
JOIN TaxonomyFamilies f ON g.TaxonomyFamilyId = f.Id
JOIN TaxonomyOrders o ON f.TaxonomyOrderId = o.Id
JOIN TaxonomyClasses c ON o.TaxonomyClassId = c.Id
JOIN TaxonomyPhyla p ON c.TaxonomyPhylumId = p.Id;

CREATE VIEW OrganizationHierarchyView AS
WITH RECURSIVE org_hierarchy AS (
    -- Base case: top-level organizations
    SELECT Id, Name, Level, ParentId, Name as FullPath, 1 as HierarchyLevel
    FROM OrganizationLevels
    WHERE ParentId IS NULL

    UNION ALL

    -- Recursive case: child organizations
    SELECT ol.Id, ol.Name, ol.Level, ol.ParentId,
           oh.FullPath || ' -> ' || ol.Name as FullPath,
           oh.HierarchyLevel + 1
    FROM OrganizationLevels ol
    JOIN org_hierarchy oh ON ol.ParentId = oh.Id
)
SELECT Id, Name, Level, ParentId, FullPath, HierarchyLevel
FROM org_hierarchy;

CREATE VIEW ExpositionHierarchyView AS
SELECT
    l.Id AS LocationId,
    ea.Name AS ExpositionAreaName,
    es.Name AS ExpositionSetName,
    l.Name AS LocationName,
    ea.Name || ' -> ' || COALESCE(es.Name, '') || ' -> ' || l.Name AS FullPath
FROM Locations l
LEFT JOIN ExpositionSets es ON l.ExpositionSetId = es.Id
LEFT JOIN ExpositionAreas ea ON es.ExpositionAreaId = ea.Id;

-- Create indexes for better performance
CREATE INDEX IX_TaxonomyHierarchyView ON Species (TaxonomyGenusId);
CREATE INDEX IX_ExpositionHierarchyView ON Locations (ExpositionSetId);
CREATE INDEX IX_OrganizationLevels_ParentId ON OrganizationLevels (ParentId);
CREATE INDEX IX_Specimens_SpeciesId ON Specimens (SpeciesId);
CREATE INDEX IX_Movements_SpecimenId ON Movements (SpecimenId);
CREATE INDEX IX_JournalEntries_OrganizationLevelId ON JournalEntries (OrganizationLevelId);
CREATE INDEX IX_JournalEntries_SpeciesId ON JournalEntries (SpeciesId);
CREATE INDEX IX_DocumentSpecies_SpeciesId ON DocumentSpecies (SpeciesId);
CREATE INDEX IX_DocumentSpecimens_SpecimenId ON DocumentSpecimens (SpecimenId);