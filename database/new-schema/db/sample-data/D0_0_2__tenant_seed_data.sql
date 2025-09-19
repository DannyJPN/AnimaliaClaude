-- D0_0_2__tenant_seed_data.sql
-- Seed data for tenants based on Auth0 configuration

-- Ensure default tenants exist
INSERT INTO [dbo].[Tenants] ([Name], [DisplayName], [Subdomain], [Auth0OrganizationId], [IsActive], [CreatedAt], [ModifiedAt], [ModifiedBy], [Configuration], [Theme])
VALUES
-- Zoo Praha
('zoo-praha', 'Zoo Praha', 'praha', 'zoo-praha', 1, GETDATE(), GETDATE(), 'system-seed',
 '{
   "timeZone": "Europe/Prague",
   "defaultLanguage": "cs",
   "dateFormat": "dd.MM.yyyy",
   "currency": "CZK",
   "enableJournalWorkflow": true,
   "enableSpecimenDocuments": true,
   "enableContractManagement": true,
   "enableImageUpload": true
 }',
 '{
   "primaryColor": "#2E7D32",
   "secondaryColor": "#1976D2",
   "backgroundColor": "#E8F5E8",
   "textColor": "#000000",
   "logoUrl": "/logos/zoo-praha.png"
 }'),

-- Zoo Brno
('zoo-brno', 'Zoo Brno', 'brno', 'zoo-brno', 1, GETDATE(), GETDATE(), 'system-seed',
 '{
   "timeZone": "Europe/Prague",
   "defaultLanguage": "cs",
   "dateFormat": "dd.MM.yyyy",
   "currency": "CZK",
   "enableJournalWorkflow": true,
   "enableSpecimenDocuments": true,
   "enableContractManagement": true,
   "enableImageUpload": true
 }',
 '{
   "primaryColor": "#1976D2",
   "secondaryColor": "#2E7D32",
   "backgroundColor": "#E3F2FD",
   "textColor": "#000000",
   "logoUrl": "/logos/zoo-brno.png"
 }'),

-- Default tenant for fallback
('default', 'Default Organization', 'default', NULL, 1, GETDATE(), GETDATE(), 'system-seed',
 '{
   "timeZone": "UTC",
   "defaultLanguage": "en",
   "dateFormat": "yyyy-MM-dd",
   "currency": "EUR",
   "enableJournalWorkflow": true,
   "enableSpecimenDocuments": true,
   "enableContractManagement": true,
   "enableImageUpload": true
 }',
 '{
   "primaryColor": "#0066CC",
   "secondaryColor": "#CC6600",
   "backgroundColor": "#FFFFFF",
   "textColor": "#000000"
 }')
ON CONFLICT ([Name]) DO NOTHING;

-- Create sample organization levels for Zoo Praha tenant
DECLARE @ZooPrahaTenantId INT = (SELECT [Id] FROM [dbo].[Tenants] WHERE [Name] = 'zoo-praha');

IF @ZooPrahaTenantId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[OrganizationLevels] ([TenantId], [Level], [Name], [Director], [ModifiedBy], [ModifiedAt])
    VALUES
    (@ZooPrahaTenantId, 'department', 'Zoologická zahrada Praha', 'ředitel Zoo Praha', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'workplace', 'Sekce savců', 'kurátor savců', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'workplace', 'Sekce ptáků', 'kurátor ptáků', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'workplace', 'Sekce plazů', 'kurátor plazů', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'district', 'Pavilon velkých šelem', NULL, 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'district', 'Pavilon opic', NULL, 'system-seed', GETDATE());
END

-- Create sample organization levels for Zoo Brno tenant
DECLARE @ZooBrnoTenantId INT = (SELECT [Id] FROM [dbo].[Tenants] WHERE [Name] = 'zoo-brno');

IF @ZooBrnoTenantId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[OrganizationLevels] ([TenantId], [Level], [Name], [Director], [ModifiedBy], [ModifiedAt])
    VALUES
    (@ZooBrnoTenantId, 'department', 'Zoologická zahrada Brno', 'ředitel Zoo Brno', 'system-seed', GETDATE()),
    (@ZooBrnoTenantId, 'workplace', 'Chov savců', 'vedoucí chovu savců', 'system-seed', GETDATE()),
    (@ZooBrnoTenantId, 'workplace', 'Chov ptáků', 'vedoucí chovu ptáků', 'system-seed', GETDATE());
END

-- Create exposition areas for Zoo Praha
IF @ZooPrahaTenantId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[ExpositionAreas] ([TenantId], [Name], [Note], [ModifiedBy], [ModifiedAt])
    VALUES
    (@ZooPrahaTenantId, 'Pavilony', 'Vnitřní prostory pro zvířata', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'Výběhy', 'Venkovní prostory pro zvířata', 'system-seed', GETDATE()),
    (@ZooPrahaTenantId, 'Zázemí', 'Pracovní a skladové prostory', 'system-seed', GETDATE());
END

-- Create exposition areas for Zoo Brno
IF @ZooBrnoTenantId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[ExpositionAreas] ([TenantId], [Name], [Note], [ModifiedBy], [ModifiedAt])
    VALUES
    (@ZooBrnoTenantId, 'Expozice', 'Expozice pro návštěvníky', 'system-seed', GETDATE()),
    (@ZooBrnoTenantId, 'Zázemí', 'Provozní prostory', 'system-seed', GETDATE());
END