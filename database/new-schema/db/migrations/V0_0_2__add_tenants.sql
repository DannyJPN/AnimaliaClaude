-- V0_0_2__add_tenants.sql
-- Add tenant support for multi-tenant architecture

-- Create Tenants table
CREATE TABLE [dbo].[Tenants] (
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [Name] NVARCHAR(255) NOT NULL UNIQUE,
  [DisplayName] NVARCHAR(255) NOT NULL,
  [Subdomain] NVARCHAR(100) NOT NULL UNIQUE,
  [Auth0OrganizationId] NVARCHAR(255) UNIQUE,
  [IsActive] BIT NOT NULL DEFAULT 1,
  [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ModifiedAt] DATETIME NOT NULL DEFAULT GETDATE(),
  [ModifiedBy] NVARCHAR(64),

  -- Configuration settings
  [Configuration] NVARCHAR(MAX), -- JSON configuration
  [Theme] NVARCHAR(MAX),          -- JSON theme settings
  [Logo] VARBINARY(MAX),          -- Custom logo
  [ContactInfo] NVARCHAR(MAX),    -- Contact details

  -- Limits and quotas
  [MaxUsers] INT DEFAULT 100,
  [MaxSpecimens] INT DEFAULT 10000,
  [StorageQuotaMB] INT DEFAULT 1000
);

-- Add tenant_id to all tenant-specific tables
-- Core entity tables
ALTER TABLE [dbo].[OrganizationLevels] ADD [TenantId] INT;
ALTER TABLE [dbo].[ExpositionAreas] ADD [TenantId] INT;
ALTER TABLE [dbo].[ExpositionSets] ADD [TenantId] INT;
ALTER TABLE [dbo].[Locations] ADD [TenantId] INT;
ALTER TABLE [dbo].[Species] ADD [TenantId] INT;
ALTER TABLE [dbo].[Specimens] ADD [TenantId] INT;
ALTER TABLE [dbo].[Partners] ADD [TenantId] INT;
ALTER TABLE [dbo].[Contracts] ADD [TenantId] INT;
ALTER TABLE [dbo].[Movements] ADD [TenantId] INT;
ALTER TABLE [dbo].[Placements] ADD [TenantId] INT;
ALTER TABLE [dbo].[Users] ADD [TenantId] INT;

-- Document tables
ALTER TABLE [dbo].[DocumentSpecies] ADD [TenantId] INT;
ALTER TABLE [dbo].[DocumentSpecimens] ADD [TenantId] INT;
ALTER TABLE [dbo].[Cadavers] ADD [TenantId] INT;
ALTER TABLE [dbo].[CadaverPartners] ADD [TenantId] INT;

-- Marking and placement tables
ALTER TABLE [dbo].[Markings] ADD [TenantId] INT;
ALTER TABLE [dbo].[SpecimenPlacements] ADD [TenantId] INT;
ALTER TABLE [dbo].[SpecimenImages] ADD [TenantId] INT;

-- Record tables
ALTER TABLE [dbo].[RecordSpecimens] ADD [TenantId] INT;
ALTER TABLE [dbo].[RecordSpecies] ADD [TenantId] INT;

-- User-specific tables
ALTER TABLE [dbo].[UserTableSettings] ADD [TenantId] INT;
ALTER TABLE [dbo].[UserFlaggedDistricts] ADD [TenantId] INT;
ALTER TABLE [dbo].[UserFlaggedSpecies] ADD [TenantId] INT;

-- Journal tables
ALTER TABLE [dbo].[JournalEntries] ADD [TenantId] INT;

-- Contract action tables
ALTER TABLE [dbo].[ContractActions] ADD [TenantId] INT;

-- Zoo table (each tenant can have multiple zoos)
ALTER TABLE [dbo].[Zoos] ADD [TenantId] INT;

-- Add foreign key constraints
ALTER TABLE [dbo].[OrganizationLevels] ADD CONSTRAINT FK_OrganizationLevels_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[ExpositionAreas] ADD CONSTRAINT FK_ExpositionAreas_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[ExpositionSets] ADD CONSTRAINT FK_ExpositionSets_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Locations] ADD CONSTRAINT FK_Locations_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Species] ADD CONSTRAINT FK_Species_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Specimens] ADD CONSTRAINT FK_Specimens_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Partners] ADD CONSTRAINT FK_Partners_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Contracts] ADD CONSTRAINT FK_Contracts_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Movements] ADD CONSTRAINT FK_Movements_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Placements] ADD CONSTRAINT FK_Placements_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Users] ADD CONSTRAINT FK_Users_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Document tables
ALTER TABLE [dbo].[DocumentSpecies] ADD CONSTRAINT FK_DocumentSpecies_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[DocumentSpecimens] ADD CONSTRAINT FK_DocumentSpecimens_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[Cadavers] ADD CONSTRAINT FK_Cadavers_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[CadaverPartners] ADD CONSTRAINT FK_CadaverPartners_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Marking and placement tables
ALTER TABLE [dbo].[Markings] ADD CONSTRAINT FK_Markings_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[SpecimenPlacements] ADD CONSTRAINT FK_SpecimenPlacements_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[SpecimenImages] ADD CONSTRAINT FK_SpecimenImages_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Record tables
ALTER TABLE [dbo].[RecordSpecimens] ADD CONSTRAINT FK_RecordSpecimens_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[RecordSpecies] ADD CONSTRAINT FK_RecordSpecies_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- User-specific tables
ALTER TABLE [dbo].[UserTableSettings] ADD CONSTRAINT FK_UserTableSettings_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[UserFlaggedDistricts] ADD CONSTRAINT FK_UserFlaggedDistricts_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);
ALTER TABLE [dbo].[UserFlaggedSpecies] ADD CONSTRAINT FK_UserFlaggedSpecies_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Journal tables
ALTER TABLE [dbo].[JournalEntries] ADD CONSTRAINT FK_JournalEntries_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Contract action tables
ALTER TABLE [dbo].[ContractActions] ADD CONSTRAINT FK_ContractActions_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Zoo table
ALTER TABLE [dbo].[Zoos] ADD CONSTRAINT FK_Zoos_Tenants FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants]([Id]);

-- Create indexes for better performance
CREATE INDEX IX_OrganizationLevels_TenantId ON [dbo].[OrganizationLevels]([TenantId]);
CREATE INDEX IX_Species_TenantId ON [dbo].[Species]([TenantId]);
CREATE INDEX IX_Specimens_TenantId ON [dbo].[Specimens]([TenantId]);
CREATE INDEX IX_Partners_TenantId ON [dbo].[Partners]([TenantId]);
CREATE INDEX IX_Contracts_TenantId ON [dbo].[Contracts]([TenantId]);
CREATE INDEX IX_Movements_TenantId ON [dbo].[Movements]([TenantId]);
CREATE INDEX IX_Users_TenantId ON [dbo].[Users]([TenantId]);
CREATE INDEX IX_JournalEntries_TenantId ON [dbo].[JournalEntries]([TenantId]);
CREATE INDEX IX_Locations_TenantId ON [dbo].[Locations]([TenantId]);
CREATE INDEX IX_ExpositionAreas_TenantId ON [dbo].[ExpositionAreas]([TenantId]);

-- Insert default tenants based on Auth0 setup examples
INSERT INTO [dbo].[Tenants] ([Name], [DisplayName], [Subdomain], [Auth0OrganizationId], [IsActive], [CreatedBy], [ModifiedBy]) VALUES
('zoo-praha', 'Zoo Praha', 'praha', 'zoo-praha', 1, 'system-migration', 'system-migration'),
('zoo-brno', 'Zoo Brno', 'brno', 'zoo-brno', 1, 'system-migration', 'system-migration'),
('default', 'Default Tenant', 'default', NULL, 1, 'system-migration', 'system-migration');

-- Update ModifiedBy columns to include tenant context where applicable
ALTER TABLE [dbo].[Tenants] ADD CONSTRAINT DF_Tenants_ModifiedBy DEFAULT 'system' FOR [ModifiedBy];