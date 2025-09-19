-- Multi-Tenant Architecture Migration
-- Adds tenant support to the existing database schema

-- Create Tenants table
CREATE TABLE [dbo].[Tenants]
(
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    [DisplayName] NVARCHAR(200) NOT NULL,
    [Domain] NVARCHAR(100),
    [ConnectionString] NVARCHAR(500),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    -- Configuration JSON fields
    [Configuration] NVARCHAR(MAX), -- JSON configuration
    [Theme] NVARCHAR(MAX), -- JSON theme settings
    [Features] NVARCHAR(MAX), -- JSON feature flags

    -- Constraints
    CONSTRAINT [CK_Tenants_Id] CHECK ([Id] <> ''),
    CONSTRAINT [UQ_Tenants_Name] UNIQUE ([Name]),
    CONSTRAINT [UQ_Tenants_Domain] UNIQUE ([Domain])
);

-- Create index for performance
CREATE INDEX [IX_Tenants_Domain] ON [dbo].[Tenants] ([Domain]);
CREATE INDEX [IX_Tenants_IsActive] ON [dbo].[Tenants] ([IsActive]);

-- Add TenantId to tenant-specific tables
-- These are the main entity tables that need tenant isolation

-- Core specimen and species data
ALTER TABLE [dbo].[Specimens] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Species] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[SpecimenImages] ADD [TenantId] NVARCHAR(50) NULL;

-- Movement and placement data
ALTER TABLE [dbo].[Movements] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Placements] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[SpecimenPlacements] ADD [TenantId] NVARCHAR(50) NULL;

-- Contract and partner data
ALTER TABLE [dbo].[Contracts] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[ContractActions] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[Partners] ADD [TenantId] NVARCHAR(50) NULL;

-- Document management
ALTER TABLE [dbo].[DocumentSpecimens] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[DocumentSpecies] ADD [TenantId] NVARCHAR(50) NULL;

-- Cadaver tracking
ALTER TABLE [dbo].[Cadavers] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[CadaverPartners] ADD [TenantId] NVARCHAR(50) NULL;

-- Markings and identifiers
ALTER TABLE [dbo].[Markings] ADD [TenantId] NVARCHAR(50) NULL;

-- Journal system
ALTER TABLE [dbo].[JournalEntries] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[JournalEntryAudits] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[JournalEntrySpecimens] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[JournalEntryAttributes] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[JournalEntrySpecimenAttributes] ADD [TenantId] NVARCHAR(50) NULL;

-- User preferences (tenant-specific)
ALTER TABLE [dbo].[UserFlaggedSpecies] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[UserFlaggedDistricts] ADD [TenantId] NVARCHAR(50) NULL;

-- Record tracking
ALTER TABLE [dbo].[RecordSpecimens] ADD [TenantId] NVARCHAR(50) NULL;
ALTER TABLE [dbo].[RecordSpecies] ADD [TenantId] NVARCHAR(50) NULL;

-- Aggregated data
ALTER TABLE [dbo].[SpecimenAggregatedMovements] ADD [TenantId] NVARCHAR(50) NULL;

-- Add foreign key constraints
ALTER TABLE [dbo].[Specimens] ADD CONSTRAINT [FK_Specimens_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Species] ADD CONSTRAINT [FK_Species_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[SpecimenImages] ADD CONSTRAINT [FK_SpecimenImages_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Movements] ADD CONSTRAINT [FK_Movements_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Placements] ADD CONSTRAINT [FK_Placements_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[SpecimenPlacements] ADD CONSTRAINT [FK_SpecimenPlacements_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Contracts] ADD CONSTRAINT [FK_Contracts_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[ContractActions] ADD CONSTRAINT [FK_ContractActions_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Partners] ADD CONSTRAINT [FK_Partners_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[DocumentSpecimens] ADD CONSTRAINT [FK_DocumentSpecimens_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[DocumentSpecies] ADD CONSTRAINT [FK_DocumentSpecies_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Cadavers] ADD CONSTRAINT [FK_Cadavers_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[CadaverPartners] ADD CONSTRAINT [FK_CadaverPartners_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[Markings] ADD CONSTRAINT [FK_Markings_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[JournalEntries] ADD CONSTRAINT [FK_JournalEntries_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[JournalEntryAudits] ADD CONSTRAINT [FK_JournalEntryAudits_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[JournalEntrySpecimens] ADD CONSTRAINT [FK_JournalEntrySpecimens_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[JournalEntryAttributes] ADD CONSTRAINT [FK_JournalEntryAttributes_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[JournalEntrySpecimenAttributes] ADD CONSTRAINT [FK_JournalEntrySpecimenAttributes_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[UserFlaggedSpecies] ADD CONSTRAINT [FK_UserFlaggedSpecies_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[UserFlaggedDistricts] ADD CONSTRAINT [FK_UserFlaggedDistricts_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[RecordSpecimens] ADD CONSTRAINT [FK_RecordSpecimens_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[RecordSpecies] ADD CONSTRAINT [FK_RecordSpecies_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

ALTER TABLE [dbo].[SpecimenAggregatedMovements] ADD CONSTRAINT [FK_SpecimenAggregatedMovements_Tenants]
    FOREIGN KEY ([TenantId]) REFERENCES [dbo].[Tenants] ([Id]);

-- Create indexes for tenant filtering performance
CREATE INDEX [IX_Specimens_TenantId] ON [dbo].[Specimens] ([TenantId]);
CREATE INDEX [IX_Species_TenantId] ON [dbo].[Species] ([TenantId]);
CREATE INDEX [IX_SpecimenImages_TenantId] ON [dbo].[SpecimenImages] ([TenantId]);
CREATE INDEX [IX_Movements_TenantId] ON [dbo].[Movements] ([TenantId]);
CREATE INDEX [IX_Placements_TenantId] ON [dbo].[Placements] ([TenantId]);
CREATE INDEX [IX_SpecimenPlacements_TenantId] ON [dbo].[SpecimenPlacements] ([TenantId]);
CREATE INDEX [IX_Contracts_TenantId] ON [dbo].[Contracts] ([TenantId]);
CREATE INDEX [IX_ContractActions_TenantId] ON [dbo].[ContractActions] ([TenantId]);
CREATE INDEX [IX_Partners_TenantId] ON [dbo].[Partners] ([TenantId]);
CREATE INDEX [IX_DocumentSpecimens_TenantId] ON [dbo].[DocumentSpecimens] ([TenantId]);
CREATE INDEX [IX_DocumentSpecies_TenantId] ON [dbo].[DocumentSpecies] ([TenantId]);
CREATE INDEX [IX_Cadavers_TenantId] ON [dbo].[Cadavers] ([TenantId]);
CREATE INDEX [IX_CadaverPartners_TenantId] ON [dbo].[CadaverPartners] ([TenantId]);
CREATE INDEX [IX_Markings_TenantId] ON [dbo].[Markings] ([TenantId]);
CREATE INDEX [IX_JournalEntries_TenantId] ON [dbo].[JournalEntries] ([TenantId]);
CREATE INDEX [IX_JournalEntryAudits_TenantId] ON [dbo].[JournalEntryAudits] ([TenantId]);
CREATE INDEX [IX_JournalEntrySpecimens_TenantId] ON [dbo].[JournalEntrySpecimens] ([TenantId]);
CREATE INDEX [IX_JournalEntryAttributes_TenantId] ON [dbo].[JournalEntryAttributes] ([TenantId]);
CREATE INDEX [IX_JournalEntrySpecimenAttributes_TenantId] ON [dbo].[JournalEntrySpecimenAttributes] ([TenantId]);
CREATE INDEX [IX_UserFlaggedSpecies_TenantId] ON [dbo].[UserFlaggedSpecies] ([TenantId]);
CREATE INDEX [IX_UserFlaggedDistricts_TenantId] ON [dbo].[UserFlaggedDistricts] ([TenantId]);
CREATE INDEX [IX_RecordSpecimens_TenantId] ON [dbo].[RecordSpecimens] ([TenantId]);
CREATE INDEX [IX_RecordSpecies_TenantId] ON [dbo].[RecordSpecies] ([TenantId]);
CREATE INDEX [IX_SpecimenAggregatedMovements_TenantId] ON [dbo].[SpecimenAggregatedMovements] ([TenantId]);