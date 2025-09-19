-- Migration V0.0.3: Make TenantId columns NOT NULL for security
-- This migration ensures all tenant-aware entities have required TenantId values

-- First, update any existing NULL TenantId values to 'default'
-- This prevents constraint violation errors when we make the columns NOT NULL

-- Core specimen and species data
UPDATE [dbo].[Specimens] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[Species] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[SpecimenImages] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Movement and placement data
UPDATE [dbo].[Movements] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[Placements] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[SpecimenPlacements] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Contract and partner data
UPDATE [dbo].[Contracts] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[ContractActions] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[Partners] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Document management
UPDATE [dbo].[DocumentSpecimens] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[DocumentSpecies] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Cadaver tracking
UPDATE [dbo].[Cadavers] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[CadaverPartners] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Markings and identifiers
UPDATE [dbo].[Markings] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Journal system
UPDATE [dbo].[JournalEntries] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[JournalEntryAudits] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[JournalEntrySpecimens] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[JournalEntryAttributes] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[JournalEntrySpecimenAttributes] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- User preferences (tenant-specific)
UPDATE [dbo].[UserFlaggedSpecies] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[UserFlaggedDistricts] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Record tracking
UPDATE [dbo].[RecordSpecimens] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;
UPDATE [dbo].[RecordSpecies] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Aggregated data
UPDATE [dbo].[SpecimenAggregatedMovements] SET [TenantId] = 'default' WHERE [TenantId] IS NULL;

-- Now make all TenantId columns NOT NULL
-- Core specimen and species data
ALTER TABLE [dbo].[Specimens] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Species] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[SpecimenImages] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Movement and placement data
ALTER TABLE [dbo].[Movements] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Placements] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[SpecimenPlacements] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Contract and partner data
ALTER TABLE [dbo].[Contracts] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[ContractActions] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[Partners] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Document management
ALTER TABLE [dbo].[DocumentSpecimens] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[DocumentSpecies] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Cadaver tracking
ALTER TABLE [dbo].[Cadavers] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[CadaverPartners] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Markings and identifiers
ALTER TABLE [dbo].[Markings] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Journal system
ALTER TABLE [dbo].[JournalEntries] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[JournalEntryAudits] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[JournalEntrySpecimens] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[JournalEntryAttributes] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[JournalEntrySpecimenAttributes] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- User preferences (tenant-specific)
ALTER TABLE [dbo].[UserFlaggedSpecies] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[UserFlaggedDistricts] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Record tracking
ALTER TABLE [dbo].[RecordSpecimens] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;
ALTER TABLE [dbo].[RecordSpecies] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;

-- Aggregated data
ALTER TABLE [dbo].[SpecimenAggregatedMovements] ALTER COLUMN [TenantId] NVARCHAR(50) NOT NULL;