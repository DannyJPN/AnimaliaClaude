-- DELETES
-- DELETE FROM [dbo].[JournalBioEntrySpecimens];
-- DELETE FROM [dbo].[JournalBioEntries];

SET IDENTITY_INSERT [dbo].[JournalBioEntries] ON;

INSERT INTO [dbo].[JournalBioEntries]
  ([Id], [EntryTypeCode], [AuthorUserName], [OrganizationLevelId], [SpeciesId], [Status], [EntryDate], [Note], [LastApproverUserName], [ModifiedBy], [ModifiedAt])
VALUES
  (10001, 'BT14', 't-chovatel', 1054, 11132, '1-draft', '2025-06-26', 'Ukázkový biologický záznam pro exemplář 42315', NULL, 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntrySpecimens]
  ([EntryId], [SpecimenId], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (10001, 42315, 'Poznámka k exempláři 42315', 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntries]
  ([Id], [EntryTypeCode], [AuthorUserName], [OrganizationLevelId], [SpeciesId], [Status], [EntryDate], [Note], [LastApproverUserName], [ModifiedBy], [ModifiedAt])
VALUES
  (10002, 'BT22', 't-chovatel', 1021, 37, '1-draft', '2025-06-26', 'Ukázkový záznam vážení pro exempláře 49423 a 47576', NULL, 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntrySpecimens]
  ([EntryId], [SpecimenId], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (10002, 49423, 'Hmotnost: 3.2 kg', 't-chovatel', GETDATE()),
  (10002, 47576, 'Hmotnost: 2.9 kg', 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntries]
  ([Id], [EntryTypeCode], [AuthorUserName], [OrganizationLevelId], [SpeciesId], [Status], [EntryDate], [Note], [LastApproverUserName], [ModifiedBy], [ModifiedAt])
VALUES
  (10003, 'BT14', 't-chovatel', 1021, 37, '1-draft', '2025-06-26', 'Ukázkový biologický záznam pro exemplář 45032', NULL, 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntrySpecimens]
  ([EntryId], [SpecimenId], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (10003, 45032, 'Poznámka k exempláři 45032', 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntries]
  ([Id], [EntryTypeCode], [AuthorUserName], [OrganizationLevelId], [SpeciesId], [Status], [EntryDate], [Note], [LastApproverUserName], [ModifiedBy], [ModifiedAt])
VALUES
  (10004, 'BT14', 't-chovatel', 1010, 53757, '1-draft', '2025-06-26', 'Pozorování skupiny exemplářů 49733, 40968, 38710', NULL, 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntrySpecimens]
  ([EntryId], [SpecimenId], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (10004, 49733, 'Poznámka k exempláři 49733', 't-chovatel', GETDATE()),
  (10004, 40968, 'Poznámka k exempláři 40968', 't-chovatel', GETDATE()),
  (10004, 38710, 'Poznámka k exempláři 38710', 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntries]
  ([Id], [EntryTypeCode], [AuthorUserName], [OrganizationLevelId], [SpeciesId], [Status], [EntryDate], [Note], [LastApproverUserName], [ModifiedBy], [ModifiedAt])
VALUES
  (10005, 'BT22', 't-chovatel', 1010, 53757, '1-draft', '2025-06-26', 'Vážení skupiny exemplářů 49733, 40968, 38710', NULL, 't-chovatel', GETDATE());

INSERT INTO [dbo].[JournalBioEntrySpecimens]
  ([EntryId], [SpecimenId], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (10005, 49733, 'Hmotnost: 4.1 kg', 't-chovatel', GETDATE()),
  (10005, 40968, 'Hmotnost: 3.8 kg', 't-chovatel', GETDATE()),
  (10005, 38710, 'Hmotnost: 4.0 kg', 't-chovatel', GETDATE());

SET IDENTITY_INSERT [dbo].[JournalBioEntries] OFF;

