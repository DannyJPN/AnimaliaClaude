-- Tenant seed data for multi-tenant architecture
-- Insert default tenants for Zoo Praha and Zoo Brno

INSERT INTO [dbo].[Tenants] ([Id], [Name], [DisplayName], [Domain], [IsActive], [CreatedAt], [UpdatedAt], [Configuration], [Theme], [Features])
VALUES
(
    'zoo-praha',
    'zoo-praha',
    'Zoo Praha',
    'zoo-praha.cz',
    1,
    GETUTCDATE(),
    GETUTCDATE(),
    '{"timeZone": "Europe/Prague", "language": "cs-CZ", "currency": "CZK", "dateFormat": "dd.MM.yyyy", "quotas": {"maxUsers": 100, "maxSpecimens": 10000, "maxStorageMB": 5000}}',
    '{"primaryColor": "#2E7D32", "secondaryColor": "#4CAF50", "logoUrl": "/logos/zoo-praha.png", "backgroundImage": "/backgrounds/zoo-praha.jpg"}',
    '{"journalWorkflow": true, "documentManagement": true, "cadaverTracking": true, "contractManagement": true, "movementTracking": true}'
),
(
    'zoo-brno',
    'zoo-brno',
    'Zoo Brno',
    'zoobrno.cz',
    1,
    GETUTCDATE(),
    GETUTCDATE(),
    '{"timeZone": "Europe/Prague", "language": "cs-CZ", "currency": "CZK", "dateFormat": "dd.MM.yyyy", "quotas": {"maxUsers": 50, "maxSpecimens": 5000, "maxStorageMB": 2500}}',
    '{"primaryColor": "#1976D2", "secondaryColor": "#2196F3", "logoUrl": "/logos/zoo-brno.png", "backgroundImage": "/backgrounds/zoo-brno.jpg"}',
    '{"journalWorkflow": true, "documentManagement": true, "cadaverTracking": true, "contractManagement": true, "movementTracking": true}'
),
(
    'default',
    'default',
    'Default Tenant',
    NULL,
    1,
    GETUTCDATE(),
    GETUTCDATE(),
    '{"timeZone": "Europe/Prague", "language": "cs-CZ", "currency": "CZK", "dateFormat": "dd.MM.yyyy", "quotas": {"maxUsers": 10, "maxSpecimens": 1000, "maxStorageMB": 500}}',
    '{"primaryColor": "#6200EA", "secondaryColor": "#7C4DFF", "logoUrl": "/logos/default.png"}',
    '{"journalWorkflow": true, "documentManagement": false, "cadaverTracking": false, "contractManagement": false, "movementTracking": true}'
);