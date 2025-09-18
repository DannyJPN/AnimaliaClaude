/* Lookup Tables */

-- [ADRUH]
INSERT INTO [dbo].[ContractTypes] ([Code], [Sort], [DisplayName])
VALUES	('V', 1, N'vlastní'),
		('C', 2, N'cizí');

INSERT INTO [dbo].[ContractMovementReasons] ([Code], [Sort], [DisplayName]) 
VALUES	('DAR', 1, N'dar'),
		('DEP', 2, N'deponace'),
		('DEPD', 3, N'deponace do'),
		('DEPZ', 4, N'deponace z'),
		('JZ', 5, N'jiný způsob'),
		('KUP', 6, N'koupě'),
		('DEPR', 7, N'návrat deponátu'),
		('DEPP', 8, N'převod deponátu'),
		('PROD', 9, N'prodej'),
		('VYM', 10, N'výměna');

-- [AUKON]
INSERT INTO [dbo].[ContractActionTypes] ([Code], [Sort], [DisplayName])
VALUES	('SEP', 1, N'sepsaní'),
		('P', 2, N'podpis'),
		('V', 3, N'vrácení'),
		('O', 4, N'odeslání'),
		('U', 5, N'uložení'),
		('J', 6, N'jiné'),
		('VYR', 7, N'vyřízení'),
		('Z', 8, N'zrušení');

-- [AUCASTNIK]
INSERT INTO [dbo].[ContractActionInitiators] ([Code], [Sort], [DisplayName])
VALUES	('N', 1, N'náměstek'),
		('R', 2, N'ředitel'),
		('P', 3, N'partner');

-- [DRUHDRUH]
INSERT INTO [dbo].[SpeciesDocumentTypes] ([Code], [Sort], [DisplayName], [Note])
VALUES	('V', 1, N'výjimka', N'Výjimka ze zákazu chovu zvláště chráněných druhů'),
		('O', 2, N'odchylka', N'Povolení chovu zvláště chráněných druhů');

-- [DRUHEXEMPLAR]
INSERT INTO [dbo].[SpecimenDocumentTypes] ([Code], [Sort], [DisplayName], [Note])
VALUES	('REL', 1, 'RegList', N'registrační list'),
		('EUV', 2, 'EU_Vyj', N'výjimka EU'),
		('CID', 3, 'CITES_D', N'CITES dovozní'),
		('CIV', 4, 'CITES_V', N'CITES vývozní'),
		('CR', 5, 'CR', N'ČR'),
		('PP', 6, 'PP', N'potvrzení původu'),
		('UELN', 7, 'UELN', N'koňské pasy');

-- [AVYKON]
INSERT INTO [dbo].[RecordActionTypes] ([Code], [Sort], [DisplayName])
VALUES	('V01', 1, N'říje'),
		('V02', 2, N'páření'),
		('V03', 3, N'vakcinace'),
		('V04', 4, N'vážení'),
		('V05', 5, N'měření'),
		('V06', 6, N'potrat'),
		('V07', 7, N'paroží'),
		('V08', 8, N'vejce'),
		('V09', 9, N'porod'),
		('V10', 10, N'menzes'),
		('V11', 11, N'zuby'),
		('V12', 12, N'trauma'),
		('V13', 13, N'zákrok'),
		('V14', 14, N'případ'),
		('V15', 15, N'pohyb'),
		('V16', 16, N'čipování'),
		('V17', 17, N'kastrace'),
		('V18', 18, N'vylétnutí'),
		('V19', 19, N'sexování'),
		('V20', 20, N'prevence'),
		('V21', 21, N'pozorování'),
		('V22', 22, N'akce'),
		('V23', 23, N'značení'),
		('V24', 24, N'přepeřování'),
		('V25', 25, N'párování'),
		('V26', 26, N'krmení'),
		('V27', 27, N'trus'),
		('V28', 28, N'odčervení'),
		('V29', 29, N'odchov'),
		('V30', 30, N'antikoncepce'),
		('V31', 31, N'křtiny'),
		('V32', 32, N'křídla'),
		('V33', 33, N'doklady'),
		('V34', 34, N'historie'),
		('V35', 35, N'pitva'),
		('V36', 36, N'taxonomie'),
		('V37', 37, N'tréning'),
		('V38', 38, N'nohy'),
		('V39', 39, N'transport'),
		('V40', 40, N'rodiče'),
		('V41', 41, N'únik'),
		('V42', 42, N'stav');

-- [CROCHRANA]
INSERT INTO [dbo].[SpeciesProtectionTypes] ([Code], [Sort], [DisplayName])
VALUES	('KOH', 1, 'KOH'),
		('SOH', 2, 'SOH'),
		('OH', 3, 'OH');

-- [RDB]
INSERT INTO [dbo].[RdbCodes] ([Code], [Sort], [DisplayName])
VALUES	('CR', 1, 'CR'),
		('DD', 2, 'DD'),
		('EN', 3, 'EN'),
		('EW', 4, 'EW'),
		('EX', 5, 'EX'),
		('LC', 6, 'LC'),
		('LR', 7, 'LR'),
		('NT', 8, 'NT'),
		('VU', 9, 'VU'),
		('VUD2', 10, N'VU[D2]'),
		('LRN', 11, N'LR/nt'),
		('LRC', 12, N'LR/lc');

-- [STAV] -> [ZooStatuses]
INSERT INTO [dbo].[ZooStatuses] ([Code], [Sort], [DisplayName], [Note]) 
VALUES	('A', 1, 'A', N'archiv'),
		('D', 2, 'D', null),
		('N', 3, 'N', null),
		('Z', 4, 'Z', N'zrušen');

INSERT INTO [dbo].[MarkingTypes] ([Code], [Sort], [DisplayName]) 
VALUES	('KRUH', 1, N'kroužek'),
		('CHIP', 2, N'čip'),
		('VRUB', 3, N'vrub'),
		('UCHO', 4, N'ušní značka'),
		('FOTO', 5, N'foto'),
		('TET', 6, N'tetování');

-- CITES
INSERT INTO [dbo].[SpeciesCiteTypes] ([Code], [Sort], [DisplayName]) 
VALUES	('I', 1, 'I'),
		('II', 2, 'II'),
		('III', 3, 'III');

INSERT INTO [dbo].[ClassificationTypes] ([Code], [Sort], [DisplayName], [Note]) 
VALUES	('E', 1, 'E', N'exemplár'),
		('S', 2, 'S', N'skupina');

-- [POHLAVI]
INSERT INTO [dbo].[GenderTypes] ([Code], [Sort], [DisplayName]) 
VALUES	('M', 1, 'M'),
		('F', 2, 'F'),
		('U', 3, 'U'),
		('M?', 4, 'M?'),
		('F?', 5, 'F?');

-- [EU]
INSERT INTO [dbo].[EuCodes] ([Code], [Sort], [DisplayName]) 
VALUES	('A', 1, 'A'),
		('B', 2, 'B'),
		('C', 3, 'C'),
		('D', 4, 'D');

INSERT INTO [dbo].[OriginTypes] ([Code], [Sort], [DisplayName], [Note]) 
VALUES	('W', 1, 'W', N'z volné přírody'),
		('C', 2, 'C', N'odchovaný v lidské péči /2.generace a vyšší/'),
		('R', 3, 'R', N'z řízeného chovu v přírodě'),
		('F', 4, 'F', N'narozený v lidské péči /1.generace narozená z rodičů z volné přírody/'),
		('P', 5, 'P', N'získáno před 1.6.1992'),
		('I', 6, 'I', N'státem zabavený exemplář'),
		('U', 7, 'U', N'neznámý původ /je třeba blíže specifikovat/');

-- [NARZPUSOB] -> [BirthMethod]
INSERT INTO [dbo].[BirthMethods] ([Code], [Sort], [DisplayName])
SELECT 'BM_' + RIGHT('00' + CAST([PORADI] AS VARCHAR(2)), 2) AS [Id],
       [PORADI] AS [Sort],
       [NARZPUSOB] AS [DisplayName]
FROM [Raw].[NARZPUSOB]
WHERE [NARZPUSOB] IS NOT NULL AND LTRIM(RTRIM([NARZPUSOB])) <> '';

-- [ODCHOV] -> [Rearing]
INSERT INTO [dbo].[Rearings] ([Code], [Sort], [DisplayName])
SELECT 'R_' + RIGHT('00' + CAST([PORADI] AS VARCHAR(2)), 2) AS [Id],
       [PORADI] AS [Sort],
       [ODCHOV] AS [DisplayName]
FROM [Raw].[ODCHOV]
WHERE [ODCHOV] IS NOT NULL AND LTRIM(RTRIM([ODCHOV])) <> '';

INSERT INTO [dbo].[IncrementReasons] ([Code], [Sort], [DisplayName])
VALUES	('IN01', 1, N'narození'),
		('IN02', 2, N'do stavu'),
		('IN03', 3, N'koupě'),
		('IN04', 4, N'výměna'),
		('IN05', 5, N'deponace z'),
		('IN06', 6, N'návrat deponátu'),
		('IN07', 7, N'narození deponátu'),
		('IN08', 8, N'dar'),
		('IN09', 9, N'zabaveno'),
		('IN10', 10, N'jiný způsob'),
		('IN11', 11, N'podíl z deponace'),
		('IN12', 12, N'tranzit'),
		('IN13', 13, N'odchyt'),
		('IN14', 14, N'handicap'),
		('IN50', 50, N'neznámý');

INSERT INTO [dbo].[DecrementReasons] ([Code], [Sort], [DisplayName])
VALUES	('OUT01', 100, N'úhyn'),
		('OUT02', 101, N'mrtvě narozeno'),
		('OUT03', 102, N'prodej'),
		('OUT04', 103, N'výměna'),
		('OUT05', 104, N'deponace do'),
		('OUT06', 105, N'návrat deponátu'),
		('OUT07', 106, N'trvalá deponace'),
		('OUT08', 107, N'převod deponátu'),
		('OUT09', 108, N'podíl z deponace'),
		('OUT10', 109, N'škodná'),
		('OUT11', 110, N'euthanasie'),
		('OUT12', 111, N'dar'),
		('OUT13', 112, N'únik'),
		('OUT14', 113, N'reintrodukce'),
		('OUT15', 114, N'zmizení'),
		('OUT16', 115, N'EEP'),
		('OUT17', 116, N'zkrmeno'),
		('OUT18', 117, N'jiný způsob'),
		('OUT19', 118, N'tranzit'),
		('OUT20', 119, N'zcizeno'),
		('OUT21', 121, N'ze stavu'),
		('OUT22', 122, N'úhyn deponátu'),
		('OUT23', 123, N'úbytek v deponaci'),
		('OUT50', 150, N'neznámý');

INSERT INTO [dbo].[JournalActionTypes] ([Code], [JournalEntryType], [Sort], [DisplayName], [Note])
VALUES
		('MT001', 'Movement', 1, N'přírustek', '+'),
		('MT002', 'Movement', 2, N'úbytek', '-'),
		('MT003', 'Movement', 3, N'přesun', 'N'),
		('MT101', 'Movement', 101, N'narození', '+'),
		('MT102', 'Movement', 102, N'do stavu', '+'),
		('MT103', 'Movement', 103, N'koupě', '+'),
		('MT104', 'Movement', 104, N'výměna (+)', '+'),
		('MT105', 'Movement', 105, N'deponace z', '+'),
		('MT106', 'Movement', 106, N'návrat deponátu (+)', '+'),
		('MT107', 'Movement', 107, N'narození deponátu', '+'),
		('MT108', 'Movement', 108, N'dar (+)', '+'),
		('MT109', 'Movement', 109, N'zabaveno', '+'),
		('MT110', 'Movement', 110, N'jiný způsob (+)', '+'),
		('MT111', 'Movement', 111, N'podíl z deponace (+)', '+'),
		('MT112', 'Movement', 112, N'tranzit (+)', '+'),
		('MT113', 'Movement', 113, N'odchyt', '+'),
		('MT114', 'Movement', 114, N'handicap', '+'),
		('MT115', 'Movement', 150, N'neznámý (+)', '+'),
		('MT116', 'Movement', 200, N'úhyn', '-'),
		('MT117', 'Movement', 201, N'mrtvě narozeno', '-'),
		('MT118', 'Movement', 202, N'prodej', '-'),
		('MT119', 'Movement', 203, N'výměna (-)', '-'),
		('MT120', 'Movement', 204, N'deponace do', '-'),
		('MT121', 'Movement', 205, N'návrat deponátu (-)', '-'),
		('MT122', 'Movement', 206, N'trvalá deponace', '-'),
		('MT123', 'Movement', 207, N'převod deponátu', '-'),
		('MT124', 'Movement', 208, N'podíl z deponace (-)', '-'),
		('MT125', 'Movement', 209, N'škodná', '-'),
		('MT126', 'Movement', 210, N'euthanasie', '-'),
		('MT127', 'Movement', 211, N'dar (-)', '-'),
		('MT128', 'Movement', 212, N'únik', '-'),
		('MT129', 'Movement', 213, N'reintrodukce', '-'),
		('MT130', 'Movement', 214, N'zmizení', '-'),
		('MT131', 'Movement', 215, N'EEP', '-'),
		('MT132', 'Movement', 216, N'zkrmeno', '-'),
		('MT133', 'Movement', 217, N'jiný způsob (-)', '-'),
		('MT134', 'Movement', 218, N'tranzit (-)', '-'),
		('MT135', 'Movement', 219, N'zcizeno', '-'),
		('MT136', 'Movement', 221, N'ze stavu', '-'),
		('MT137', 'Movement', 222, N'úhyn deponátu', '-'),
		('MT138', 'Movement', 223, N'úbytek v deponaci', '-'),
		('MT139', 'Movement', 250, N'neznámý (-)', '-'),
		('BT01', 'Bio', 1, N'akce', null),
		('BT02', 'Bio', 2, N'asanace', null),
		('BT03', 'Bio', 3, N'imobilizace', null),
		('BT04', 'Bio', 4, N'kadáver', null),
		('BT05', 'Bio', 5, N'kastrace', null),
		('BT06', 'Bio', 6, N'krmení', null),
		('BT07', 'Bio', 7, N'křídla', null),
		('BT08', 'Bio', 8, N'menzes', null),
		('BT09', 'Bio', 9, N'měření', null),
		('BT10', 'Bio', 10, N'paroží', null),
		('BT11', 'Bio', 11, N'páření - s kým', null),
		('BT12', 'Bio', 12, N'pěstouni - kdo', null),
		('BT13', 'Bio', 13, N'potrat - s kým', null),
		('BT14', 'Bio', 14, N'pozorování', null),
		('BT15', 'Bio', 15, N'prevence', null),
		('BT16', 'Bio', 16, N'přepeřování', null),
		('BT17', 'Bio', 17, N'případ', null),
		('BT18', 'Bio', 18, N'říje', null),
		('BT19', 'Bio', 19, N'sexování', null),
		('BT20', 'Bio', 20, N'trus', null),
		('BT21', 'Bio', 21, N'vakcinace', null),
		('BT22', 'Bio', 22, N'vážení', null),
		('BT23', 'Bio', 23, N'vejce', null),
		('BT24', 'Bio', 24, N'zákrok', null),
		('BT25', 'Bio', 25, N'značení', null),
		('BT26', 'Bio', 26, N'zuby', null),
		('BT27', 'Bio', 27, N'Trénink', null),
		('BT28', 'Bio', 28, N'porod', null);

/* Basic Tables */

-- [ZAHRADY] -> [Zoos]
INSERT INTO [dbo].[Zoos] ([Id],[Keyword],[Name],[City],[StreetNumber],[PostalCode],[Country],[Phone],[Fax],[Email],[Website],[LastName],[FirstName],[Note])
SELECT [ZAHRADA_ID],[HESLO],[NAZEV],[MESTO],[ULICECIS],[PSC],[STAT],[TELEFON],[FAX],[EMAIL],[WWW],[PRIJMENI],[JMENO],[POZNAMKA] 
FROM [Raw].[ZAHRADY]
ORDER BY [ZAHRADA_ID]

-- [KADRESAR] -> [CadaverPartners]
SET IDENTITY_INSERT  [dbo].[CadaverPartners] ON

INSERT INTO [dbo].[CadaverPartners] ([Id],[Keyword],[Name],[City],[StreetAndNumber],[PostalCode],[Country],[Phone],[Fax],[Email],[LastName],[FirstName],[Note],[ModifiedBy],[ModifiedAt])
SELECT [ADRESAR_ID],[HESLO],[NAZEV],[MESTO],[ULICECIS],[PSC],[STAT],[TELEFON],[FAX],[EMAIL],[PRIJMENI],[JMENO],[POZNAMKA],[GIOS$KDO],
  CONVERT(datetime,
      STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
      STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
  121)
FROM [Raw].[KADRESAR]
ORDER BY [ADRESAR_ID]

SET IDENTITY_INSERT  [dbo].[CadaverPartners] OFF

-- [USEK] -> [Sections]
SET IDENTITY_INSERT  [dbo].[Sections] ON

INSERT INTO [dbo].[Sections] ([Id], [SectionName], [Code])
SELECT [USEK_ID], [USEK], [KOD] FROM [Raw].[USEK]

SET IDENTITY_INSERT  [dbo].[Sections] OFF

-- [RAJON] -> [Regions]
SET IDENTITY_INSERT  [dbo].[Regions] ON

INSERT INTO [dbo].[Regions] ([Id], [SectionId], [Name], [Code], [OperationNote])
SELECT [RAJON_ID], [USEK_ID], [RAJON], [KOD], [PROVOZ] FROM [Raw].[RAJON]

SET IDENTITY_INSERT  [dbo].[Regions] OFF

-- Migrate Partners

-- [ADRESAR] -> [Partners]
SET IDENTITY_INSERT  [dbo].[Partners] ON

INSERT INTO [dbo].[Partners] ([Id],[Keyword],[Name],[Status],[City],[StreetAddress],[PostalCode],[Country],[Phone],[Fax],[Email],[PartnerType],[LastName],[FirstName],[Note])
SELECT [ADRESAR_ID],[HESLO],[NAZEV],[STATUT],[MESTO],[ULICECIS],[PSC],[STAT],[TELEFON],[FAX],[EMAIL],[TYP],[PRIJMENI],[JMENO],[POZNAMKA] 
FROM [Raw].[ADRESAR]
ORDER BY [ADRESAR_ID]

SET IDENTITY_INSERT  [dbo].[Partners] OFF

-- [SMLOUVA] -> [Contracts]

ALTER TABLE [dbo].[Contracts] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT  [dbo].[Contracts] ON

INSERT INTO [dbo].[Contracts] ([Id],[Number],[Date],[MovementReason],[ContractType],[PartnerId],[Note],[NotePrague],[NotePartner],[ModifiedBy],[Year],[ModifiedAt])
SELECT [SMLOUVAID],[CISLO],[DATUM],r.[Code],t.[Code],[PARTNER],[POZNAMKA],[POZN_PRAHA],[POZN_PARTNER],[GIOS$KDO],CONVERT(INT, [ROK]),
	CASE
		WHEN [GIOS$KDY] LIKE '%/%' THEN
				TRY_CONVERT(datetime, [GIOS$KDY], 111)
		ELSE
			TRY_CONVERT(datetime,
					STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
					STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
			121)
	END
FROM [Raw].[SMLOUVA] s
	LEFT JOIN [dbo].[ContractTypes] t ON s.[DRUH] = t.[DisplayName]
	LEFT JOIN [dbo].[ContractMovementReasons] r ON s.[POHYB] = r.[DisplayName]
ORDER BY [SMLOUVAID]

SET IDENTITY_INSERT  [dbo].[Contracts] OFF

ALTER TABLE [dbo].[Contracts] WITH NOCHECK CHECK CONSTRAINT all

-- [UKONSMLOUVY] -> [ContractActions]

ALTER TABLE [dbo].[ContractActions] NOCHECK CONSTRAINT all

SET IDENTITY_INSERT  [dbo].[ContractActions] ON

INSERT INTO [dbo].[ContractActions] ([Id],[ContractId],[Date],[ActionType],[ActionInitiator],[Note],[ModifiedBy],[ModifiedAt])
SELECT [UKONID],[SMLOUVAID],[DATUM],t.[Code],i.[Code],[POZNAMKA],[GIOS$KDO],
	CASE
		WHEN [GIOS$KDY] LIKE '%/%' THEN
				TRY_CONVERT(datetime, [GIOS$KDY], 111)
		ELSE
			TRY_CONVERT(datetime,
					STUFF(STUFF(LEFT([GIOS$KDY], 8), 5, 0, '-'), 8, 0, '-') + ' ' +
					STUFF(STUFF(STUFF(RIGHT([GIOS$KDY], 9), 3, 0, ':'), 6, 0, ':'), 9, 0, '.'),
			121)
	END
FROM [Raw].[UKONSMLOUVY] u
	LEFT JOIN [dbo].[ContractActionTypes] t ON u.[UKON] = t.[DisplayName]
	LEFT JOIN [dbo].[ContractActionInitiators] i ON u.[UCASTNIK] = i.[DisplayName]
ORDER BY [UKONID]

SET IDENTITY_INSERT  [dbo].[ContractActions] OFF

ALTER TABLE [dbo].[ContractActions] WITH NOCHECK CHECK CONSTRAINT all

-- HIERARCHY - Organization --

ALTER TABLE [dbo].[OrganizationLevels] NOCHECK CONSTRAINT all
SET IDENTITY_INSERT  [dbo].[OrganizationLevels] ON

-- Oddělení (department)
INSERT INTO OrganizationLevels 
  ([Id], [Name], [Level], [Director], [ParentId], [JournalContributorGroup], [JournalReadGroup], [JournalApproversGroup])
VALUES
  (1, N'Chov 1', 'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_Chov1,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_Chov1,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (2, N'Chov 2', 'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_Chov2,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_Chov2,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (3, N'Chov 3', 'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_Chov3,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_Chov3,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (4, N'Chov 4', 'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_Chov4,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_Chov4,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (5, N'Chov 5', 'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_Chov5,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_Chov5,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (6, N'KAR',    'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_KAR,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_KAR,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (7, N'KRM',    'department', NULL, NULL, 'CN=SG_zoopraha_Metazoa_Chovatel_KRM,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local', NULL, 'CN=SG_zoopraha_Metazoa_Kurator_KRM,OU=AplikacniRole,OU=zoopraha,DC=zoo,DC=local'),
  (8, N'OST',    'department', NULL, NULL, NULL, NULL, NULL),
	(9, N'Archiv', 'department', NULL, NULL, NULL, NULL, NULL),

	-- Pracoviště (workplace)
  (101, N'Bažantnice',        'workplace', NULL, 1, NULL, NULL, NULL),
  (102, N'Lachtani',          'workplace', NULL, 1, NULL, NULL, NULL),
  (103, N'Sečuán',            'workplace', NULL, 1, NULL, NULL, NULL),
  (104, N'Vodní ptáci',       'workplace', NULL, 1, NULL, NULL, NULL),
  (105, N'Kočkovité šelmy',   'workplace', NULL, 2, NULL, NULL, NULL),
  (106, N'Malí savci',        'workplace', NULL, 2, NULL, NULL, NULL),
  (107, N'Sloninec',          'workplace', NULL, 2, NULL, NULL, NULL),
  (108, N'Darwinův kráter',   'workplace', NULL, 2, NULL, NULL, NULL),
	(109, N'Afrika',            'workplace', NULL, 3, NULL, NULL, NULL),
  (110, N'Bizoni',            'workplace', NULL, 3, NULL, NULL, NULL),
  (111, N'Dobřejov',          'workplace', NULL, 3, NULL, NULL, NULL),
	(112, N'Indonéská džungle', 'workplace', NULL, 4, NULL, NULL, NULL),
  (113, N'Velké želvy',       'workplace', NULL, 4, NULL, NULL, NULL),
	(114, N'Primáti',           'workplace', NULL, 5, NULL, NULL, NULL),
	
	(115, N'Karanténa',         'workplace', NULL, 6, NULL, NULL, NULL),
  
	(116, N'Krmiva',            'workplace', NULL, 7, NULL, NULL, NULL),
  
	(117, N'OST',               'workplace', NULL, 8, NULL, NULL, NULL),
	-- district (Rajon)
	(1001, N'Nová Bažantnice', 'district', NULL, 101, NULL, NULL, NULL),
	(1002, N'Rákosův pavilon', 'district', NULL, 101, NULL, NULL, NULL),
	(1003, N'Austrálie', 'district', NULL, 101, NULL, NULL, NULL),
	(1004, N'Loriové', 'district', NULL, 101, NULL, NULL, NULL),
	(1005, N'Zoborožci', 'district', NULL, 101, NULL, NULL, NULL),
	(1006, N'Indonesie', 'district', NULL, 101, NULL, NULL, NULL),
	(1007, N'Hvězda', 'district', NULL, 101, NULL, NULL, NULL),
	(1008, N'Sovy', 'district', NULL, 101, NULL, NULL, NULL),
	(1009, N'Velká voliéra', 'district', NULL, 101, NULL, NULL, NULL),

	(1010, N'Lachtani', 'district', NULL, 102, NULL, NULL, NULL),
	(1011, N'Tučňáci', 'district', NULL, 102, NULL, NULL, NULL),

	(1012, N'PVP', 'district', NULL, 103, NULL, NULL, NULL),
	(1013, N'Člunozobci', 'district', NULL, 103, NULL, NULL, NULL),
	(1014, N'Sečuán', 'district', NULL, 103, NULL, NULL, NULL),
	(1015, N'R5', 'district', NULL, 103, NULL, NULL, NULL),

	(1016, N'Plameňáci', 'district', NULL, 104, NULL, NULL, NULL),
	(1058, N'Laguna', 'district', NULL, 104, NULL, NULL, NULL),
	(1059, N'Dravci', 'district', NULL, 104, NULL, NULL, NULL),
	(1060, N'Expozice', 'district', NULL, 104, NULL, NULL, NULL),
	(1061, N'Waldrapi', 'district', NULL, 104, NULL, NULL, NULL),
	(1062, N'staré CHZ', 'district', NULL, 104, NULL, NULL, NULL),
	(1063, N'Voliéry', 'district', NULL, 104, NULL, NULL, NULL),
	(1064, N'Odchovna', 'district', NULL, 104, NULL, NULL, NULL),
	(1065, N'Rajky', 'district', NULL, 104, NULL, NULL, NULL),
	(1066, N'Nové zázemí', 'district', NULL, 104, NULL, NULL, NULL),
	(1067, N'Skleník', 'district', NULL, 104, NULL, NULL, NULL),

	(1017, N'Lvi a tygři', 'district', NULL, 105, NULL, NULL, NULL),
	(1018, N'Malé kočky a tapíři', 'district', NULL, 105, NULL, NULL, NULL),
	(1019, N'Gepardi', 'district', NULL, 105, NULL, NULL, NULL),
	(1020, N'Horské kozy', 'district', NULL, 105, NULL, NULL, NULL),
	(1021, N'Vlci hřivnatí', 'district', NULL, 105, NULL, NULL, NULL),

	(1022, N'Vitríny', 'district', NULL, 106, NULL, NULL, NULL),
	(1023, N'Savci', 'district', NULL, 106, NULL, NULL, NULL),
	(1024, N'Medvědi', 'district', NULL, 106, NULL, NULL, NULL),
	(1025, N'Darwin (Malí savci)', 'district', NULL, 106, NULL, NULL, NULL),

	(1026, N'Sloni', 'district', NULL, 107, NULL, NULL, NULL),

	(1027, N'Darwin', 'district', NULL, 108, NULL, NULL, NULL),

	(1028, N'Žirafy', 'district', NULL, 109, NULL, NULL, NULL),
	(1029, N'Hrabáči', 'district', NULL, 109, NULL, NULL, NULL),
	(1030, N'Stáj A', 'district', NULL, 109, NULL, NULL, NULL),
	(1031, N'Stáj C', 'district', NULL, 109, NULL, NULL, NULL),
	(1032, N'Antilopy', 'district', NULL, 109, NULL, NULL, NULL),
	(1033, N'Hroši', 'district', NULL, 109, NULL, NULL, NULL),

	(1034, N'Salaš I', 'district', NULL, 110, NULL, NULL, NULL),
	(1035, N'Baraš', 'district', NULL, 110, NULL, NULL, NULL),
	(1036, N'Bizoni', 'district', NULL, 110, NULL, NULL, NULL),
	(1037, N'Zubři', 'district', NULL, 110, NULL, NULL, NULL),
	(1038, N'Jeleni', 'district', NULL, 110, NULL, NULL, NULL),
	(1039, N'Koně', 'district', NULL, 110, NULL, NULL, NULL),
	(1040, N'Zubr Počernice', 'district', NULL, 110, NULL, NULL, NULL),

	(1041, N'Dobřejov', 'district', NULL, 111, NULL, NULL, NULL),

	(1042, N'Indonéská džungle', 'district', NULL, 112, NULL, NULL, NULL),
	(1043, N'Terárium', 'district', NULL, 112, NULL, NULL, NULL),

	(1044, N'Lvinec a Tera', 'district', NULL, 113, NULL, NULL, NULL),
	(1045, N'AZBL plazi', 'district', NULL, 113, NULL, NULL, NULL),
	(1046, N'Bezobratlí', 'district', NULL, 113, NULL, NULL, NULL),
	(1047, N'Indonéská džungle (Velké želvy)', 'district', NULL, 113, NULL, NULL, NULL),
	(1068, N'Velké želvy', 'district', NULL, 113, NULL, NULL, NULL),

	(1048, N'Rezervace Dja', 'district', NULL, 114, NULL, NULL, NULL),
	(1049, N'Centrum Mefou', 'district', NULL, 114, NULL, NULL, NULL),
	(1050, N'Opičí ostrovy', 'district', NULL, 114, NULL, NULL, NULL),
	(1051, N'Indonéská džungle (Primáti)', 'district', NULL, 114, NULL, NULL, NULL),

	(1052, N'Statek', 'district', NULL, 115, NULL, NULL, NULL),
	(1053, N'Bosna', 'district', NULL, 115, NULL, NULL, NULL),
	(1054, N'Alcatraz', 'district', NULL, 115, NULL, NULL, NULL),

	(1055, N'Seník', 'district', NULL, 116, NULL, NULL, NULL),
	(1056, N'Dětská zoo', 'district', NULL, 116, NULL, NULL, NULL),

	(1057, N'Areál zoo', 'district', NULL, 117, NULL, NULL, NULL);

SET IDENTITY_INSERT  [dbo].[OrganizationLevels] OFF

ALTER TABLE [dbo].[OrganizationLevels] WITH NOCHECK CHECK CONSTRAINT all

-- Expoziční celek (ExpositionAreas)

ALTER TABLE [dbo].[ExpositionAreas] NOCHECK CONSTRAINT all
SET IDENTITY_INSERT  [dbo].[ExpositionAreas] ON

INSERT INTO [dbo].[ExpositionAreas]
  ([Id], [Name], [Note], [ModifiedBy], [ModifiedAt])
VALUES
  (1, N'Darwinův kráter', NULL, 'system', CURRENT_TIMESTAMP),
  (2, N'Dvojzoborožci', NULL, 'system', CURRENT_TIMESTAMP),
  (3, N'Indonéská džungle', NULL, 'system', CURRENT_TIMESTAMP),
  (4, N'Papouščí stezka', NULL, 'system', CURRENT_TIMESTAMP),
  (5, N'Ptáci jihovýchodní Asie', NULL, 'system', CURRENT_TIMESTAMP),
  (6, N'Rákosův pavilon', NULL, 'system', CURRENT_TIMESTAMP),
  (7, N'Severský les', NULL, 'system', CURRENT_TIMESTAMP),
  (8, N'Velká voliéra', NULL, 'system', CURRENT_TIMESTAMP),
  (9, N'Lachtani', NULL, 'system', CURRENT_TIMESTAMP),
  (10, N'Tučňáci', NULL, 'system', CURRENT_TIMESTAMP),
  (11, N'Orlosupi', NULL, 'system', CURRENT_TIMESTAMP),
  (12, N'Pavilon šelem a plazů', NULL, 'system', CURRENT_TIMESTAMP),
  (13, N'Ptačí mokřady', NULL, 'system', CURRENT_TIMESTAMP),
  (14, N'Sečuán', NULL, 'system', CURRENT_TIMESTAMP),
  (15, N'Dětská Zoo', NULL, 'system', CURRENT_TIMESTAMP),
  (16, N'Dravci', NULL, 'system', CURRENT_TIMESTAMP),
  (17, N'chovné zázemí ptáků', NULL, 'system', CURRENT_TIMESTAMP),
  (18, N'Pelikáni', NULL, 'system', CURRENT_TIMESTAMP),
  (19, N'Tropické sovy', NULL, 'system', CURRENT_TIMESTAMP),
  (20, N'Vodní svět ', NULL, 'system', CURRENT_TIMESTAMP),
  (21, N'Vodní svět a opičí ostrovy', NULL, 'system', CURRENT_TIMESTAMP),
  (22, N'Voliéra pod skálou', NULL, 'system', CURRENT_TIMESTAMP),
  (23, N'Austrálie', NULL, 'system', CURRENT_TIMESTAMP),
  (24, N'Dikobraz srstnatonosý', NULL, 'system', CURRENT_TIMESTAMP),
  (25, N'Gobi', NULL, 'system', CURRENT_TIMESTAMP),
  (26, N'Tapíři', NULL, 'system', CURRENT_TIMESTAMP),
  (27, N'Napříč kontinenty', NULL, 'system', CURRENT_TIMESTAMP),
  (28, N'Skalní masiv ', NULL, 'system', CURRENT_TIMESTAMP),
  (29, N'Afrika zblízka', NULL, 'system', CURRENT_TIMESTAMP),
  (30, N'Jihoamerické šelmy', NULL, 'system', CURRENT_TIMESTAMP),
  (31, N'Lední medvědi', NULL, 'system', CURRENT_TIMESTAMP),
  (32, N'Pandy červené', NULL, 'system', CURRENT_TIMESTAMP),
  (33, N'Urzoni', NULL, 'system', CURRENT_TIMESTAMP),
  (34, N'Vydry', NULL, 'system', CURRENT_TIMESTAMP),
  (35, N'Údolí slonů', NULL, 'system', CURRENT_TIMESTAMP),
  (36, N'Africká savana', NULL, 'system', CURRENT_TIMESTAMP),
  (37, N'Africký dům', NULL, 'system', CURRENT_TIMESTAMP),
  (38, N'Afrika', NULL, 'system', CURRENT_TIMESTAMP),
  (39, N'Pavilon hrochů', NULL, 'system', CURRENT_TIMESTAMP),
  (40, N'Dívčí hrady', NULL, 'system', CURRENT_TIMESTAMP),
  (41, N'Dolní Počernice', NULL, 'system', CURRENT_TIMESTAMP),
  (42, N'Pláně', NULL, 'system', CURRENT_TIMESTAMP),
  (43, N'Dobřejov', NULL, 'system', CURRENT_TIMESTAMP),
  (44, N'Rezervace Bororo', NULL, 'system', CURRENT_TIMESTAMP),
  (45, N'Čambal', NULL, 'system', CURRENT_TIMESTAMP),
  (46, N'Baalova pyramida', NULL, 'system', CURRENT_TIMESTAMP),
  (47, N'Velemlokárium', NULL, 'system', CURRENT_TIMESTAMP),
  (48, N'Zakázanka', NULL, 'system', CURRENT_TIMESTAMP),
  (49, N'Pavilon velkých želv', NULL, 'system', CURRENT_TIMESTAMP),
  (50, N'Centrum Mefou', NULL, 'system', CURRENT_TIMESTAMP),
  (51, N'Mravenečníci a kapybary', NULL, 'system', CURRENT_TIMESTAMP),
  (52, N'Ostrov Lemurů', NULL, 'system', CURRENT_TIMESTAMP),
  (53, N'Rezervace Dja', NULL, 'system', CURRENT_TIMESTAMP),
  (54, N'Variové', NULL, 'system', CURRENT_TIMESTAMP);

SET IDENTITY_INSERT  [dbo].[ExpositionAreas] OFF

ALTER TABLE [dbo].[ExpositionAreas] WITH NOCHECK CHECK CONSTRAINT all

-- Expoziční celek

ALTER TABLE [dbo].[ExpositionSets] NOCHECK CONSTRAINT all
SET IDENTITY_INSERT  [dbo].[ExpositionSets] ON

INSERT INTO [dbo].[ExpositionSets] 
	([Id],[ExpositionAreaId],[Name],[Note],[ModifiedBy])
VALUES
	(1, 1, N'Darwinův kráter', NULL, 'system'),
	(2, 2, N'Ptáci jihovýchodní Asie', NULL, 'system'),
	(3, 3, N'chovné zázemí ptáků (Indonéská džungle)', NULL, 'system'),
	(4, 4, N'Papouščí stezka', NULL, 'system'),
	(5, 5, N'Bažantnice', NULL, 'system'),
	(6, 6, N'Rákosův pavilon', NULL, 'system'),
	(7, 8, N'Skalní masiv - Velká voliéra', NULL, 'system'),
	(8, 9, N'Lachtani', NULL, 'system'),
	(9, 10, N'Pavilon tučňáků', NULL, 'system'),
	(10, 28, N'Skalní masiv', NULL, 'system'),
	(11, 12, N'Pavilon šelem a plazů', NULL, 'system'),
	(12, 13, N'Ptačí mokřady', NULL, 'system'),
	(13, 14, N'Sečuán', NULL, 'system'),
	(14, 14, N'voliéry pod skalou', NULL, 'system'),
	(15, 15, N'Dětská Zoo', NULL, 'system'),
	(16, 16, N'Dravci - Dolní část zoo', NULL, 'system'),
	(17, 17, N'Modré bazény', NULL, 'system'),
	(18, 20, N'Vodní svět a opičí ostrovy', NULL, 'system'),
	(19, 22, N'Skalní masiv - Voliéra pod skalou', NULL, 'system'),
	(20, 23, N'Austrálie', NULL, 'system'),
	(21, 25, N'Gobi', NULL, 'system'),
	(22, 26, N'Tapíři', NULL, 'system'),
	(23, 7, N'Tygři ussurijští', NULL, 'system'),
	(24, 27, N'Napříč kontinenty', NULL, 'system'),
	(25, 7, N'Severský les', NULL, 'system'),
	(26, 26, N'Rezervace Bororo', NULL, 'system'),
	(27, 29, N'Afrika zblízka', NULL, 'system'),
	(28, 3, N'Indonéská džungle', NULL, 'system'),
	(29, 31, N'Lední medvědi', NULL, 'system'),
	(30, 35, N'Údolí slonů', NULL, 'system'),
	(31, 37, N'Africký dům', NULL, 'system'),
	(32, 38, N'Afrika', NULL, 'system'),
	(33, 36, N'Africká savana', NULL, 'system'),
	(34, 40, N'Dívčí hrady - kůň Převalského', NULL, 'system'),
	(35, 41, N'Dolní Počernice - zubr evropský', NULL, 'system'),
	(36, 41, N'Dolní Počernice', NULL, 'system'),
	(37, 42, N'Pláně', NULL, 'system'),
	(38, 43, N'Dobřejov', NULL, 'system'),
	(39, 45, N'Čambal', NULL, 'system'),
	(40, 53, N'Rezervace Dja', NULL, 'system'),
	(41, 46, N'Baalova pyramida', NULL, 'system'),
	(42, 47, N'Velemlokárium', NULL, 'system'),
	(43, 48, N'Zakázanka', NULL, 'system'),
	(44, 49, N'Pavilon velkých želv', NULL, 'system'),
	(45, 50, N'Centrum Mefou', NULL, 'system'),
	(46, 51, N'Mravenečníci a kapybary', NULL, 'system'),
	(47, 52, N'Ostrov lemurů', NULL, 'system'),
	(48, 17, N'chovné zázemí ptáků', NULL, 'system'),
	(49, 7, N'chovné zázemí ptáků (Severský les)', NULL, 'system'),
	(50, 18, N'Vodní svět a opičí ostrovy (Pelikáni)', NULL, 'system'),
	(51, 14, N'Vodní svět a opičí ostrovy (Sečuán)', NULL, 'system'),
	(52, 21, N'Ptačí mokřady (Vodní svět a opičí ostrovy)', NULL, 'system'),
	(53, 7, N'Napříč kontinenty (Severský les)', NULL, 'system'),
	(54, 11, N'Skalní masiv (orlosupi)', NULL, 'system'),
	(55, 26, N'Vodní svět a opičí ostrovy (Tapíři)', NULL, 'system'),
	(56, 7, N'Napříč kontinenty (Jihoamerické šelmy)', NULL, 'system'),
	(57, 39, N'Afrika (Pavilon hrochů)', NULL, 'system'),
	(58, 51, N'Vodní svět a opičí ostrovy (Mravenečníci a kapybary)', NULL, 'system'),
	(59, 54, N'Vodní svět a opičí ostrovy (Variové)', NULL, 'system'),
	(60, 32, N'Skalní masiv (Pandy červené)', NULL, 'system'),
	(61, 33, N'Skalní masiv (Urzoni)', NULL, 'system');

SET IDENTITY_INSERT  [dbo].[ExpositionSets] OFF

ALTER TABLE [dbo].[ExpositionSets] WITH NOCHECK CHECK CONSTRAINT all

INSERT INTO [dbo].[JournalActionTypesToOrganizationLevels]
  ([ActionTypeCode], [OrganizationLevelId])
VALUES
  (N'BT01', 1), (N'BT01', 2), (N'BT01', 3), (N'BT01', 4), (N'BT01', 5),
  (N'BT03', 2), (N'BT03', 3), (N'BT03', 4), (N'BT03', 5),
  (N'BT05', 2), (N'BT05', 3), (N'BT05', 4), (N'BT05', 5),
  (N'BT06', 2), (N'BT06', 3), (N'BT06', 4), (N'BT06', 5),
  (N'BT07', 1),
  (N'BT08', 1), (N'BT08', 2), (N'BT08', 3), (N'BT08', 4), (N'BT08', 5),
  (N'BT10', 2), (N'BT10', 3),
  (N'BT11', 1), (N'BT11', 2), (N'BT11', 3), (N'BT11', 4), (N'BT11', 5),
  (N'BT12', 1),
  (N'BT13', 2), (N'BT13', 3), (N'BT13', 4), (N'BT13', 5),
  (N'BT14', 1), (N'BT14', 2), (N'BT14', 3), (N'BT14', 4), (N'BT14', 5),
  (N'BT15', 1), (N'BT15', 2), (N'BT15', 3), (N'BT15', 4), (N'BT15', 5),
  (N'BT16', 1),
  (N'BT17', 2), (N'BT17', 3), (N'BT17', 4), (N'BT17', 5),
  (N'BT18', 2), (N'BT18', 3), (N'BT18', 4), (N'BT18', 5),
  (N'BT19', 1), (N'BT19', 2), (N'BT19', 3), (N'BT19', 4), (N'BT19', 5),
  (N'BT20', 1), (N'BT20', 2), (N'BT20', 3), (N'BT20', 4), (N'BT20', 5),
  (N'BT21', 1), (N'BT21', 2), (N'BT21', 3), (N'BT21', 4), (N'BT21', 5),
  (N'BT22', 1), (N'BT22', 2), (N'BT22', 3), (N'BT22', 4), (N'BT22', 5),
  (N'BT23', 1),
  (N'BT24', 2), (N'BT24', 3), (N'BT24', 4), (N'BT24', 5),
  (N'BT25', 1), (N'BT25', 2), (N'BT25', 3), (N'BT25', 4), (N'BT25', 5),
  (N'BT27', 2), (N'BT27', 3), (N'BT27', 4), (N'BT27', 5),
  (N'BT28', 2), (N'BT28', 3), (N'BT28', 4), (N'BT28', 5),
  (N'MT001', 1), (N'MT001', 2), (N'MT001', 3), (N'MT001', 4), (N'MT001', 5),
  (N'MT002', 2), (N'MT002', 3), (N'MT002', 4), (N'MT002', 5),
  (N'MT003', 1), (N'MT003', 2), (N'MT003', 3), (N'MT003', 4), (N'MT003', 5),
  (N'MT101', 1), (N'MT101', 2), (N'MT101', 3), (N'MT101', 4), (N'MT101', 5),
  (N'MT116', 1), (N'MT116', 2), (N'MT116', 3), (N'MT116', 4), (N'MT116', 5),
  (N'MT117', 2), (N'MT117', 3), (N'MT117', 4), (N'MT117', 5),
  (N'MT125', 1), (N'MT125', 2), (N'MT125', 3), (N'MT125', 4),
  (N'MT126', 1), (N'MT126', 2), (N'MT126', 3), (N'MT126', 4), (N'MT126', 5),
  (N'MT128', 1), (N'MT128', 2), (N'MT128', 3), (N'MT128', 4),
  (N'MT129', 1), (N'MT129', 2), (N'MT129', 3), (N'MT129', 4),
  (N'MT130', 1), (N'MT130', 2), (N'MT130', 3), (N'MT130', 4);
