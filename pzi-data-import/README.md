
# Database Export

Exporting data and schema 1:1 from the legacy Firebird DB to the target MSSQL server database. As the source can be used hosted remote/local database or the .fbd file directly.


## Remote Configuration

Firebird Db server connection string example: Server=;Database=zoo_pra.fdb;User=;Password=;Charset=UTF8;Dialect=3;
MSSQL LocalDb connection string example: Server=(localdb)\\MSSQLLocalDB;Integrated Security=true;Database=Animalia;
MSSQL Remote DB - access possible only from the RDP: Server=;Integrated Security=true;Database=Animalia;Encrypt=True;TrustServerCertificate=True;
AZURE Sql DB: Server=tcp:metazoa.database.windows.net,1433;Initial Catalog=Metazoa;Persist Security Info=False;User ID=animalia;Password=;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=600;


## FDB source file configuration

Because of exporting data from the remote firebird server is too slow, we decided to support also migration from the local firebird database file. To achieve that we have to reference fbembed dlls See -> https://github.com/anion0278/FireBirdEmbeddedNet8Example/tree/main

firebird local db connection string example: ServerType=1;Database=C:\\sources\\zoo_pra.fdb;User=SYSDBA;Password=masterkey;


## How to create database from backup file (gbk)

1. Install firebird database (v2.5)
2. Locate (e.g. C:\Program Files\Firebird\Firebird_2_5\bin)
3. gbak -c -v C:\Temp\zoo\2025-07-13\animalia_db-2025-07-12-Sat.gbk  C:\Temp\zoo\2025-07-13\zoo_pra_new.fdb -user SYSDBA -password masterkey


## How to create database and import data from the provided script file

1. Install same version (2.5) of firebird database (https://www.firebirdsql.org/en/server-packages/). In case you do will install lates version you will have to amed script and change BLOB type. Sub_Type Text => Sub_Type 1 and Sub_Type 5 => Sub_type 0
2. Locate (e.g. C:\Program Files\Firebird\Firebird_2_5) and run isql.exe
3. Create database
      SQL>CREATE DATABASE 'C:\temp\zoo\zoo_pra_new.fdb' page_size 8192
      CON>user 'SYSDBA' password 'masterkey'
      CON>DEFAULT CHARACTER SET WIN1250;
4. Connect to fdb database and run script (Scripts\original_animalia_definitions.sql contains only table definitions)
  a)  SQL>CONNECT 'localhost:C:\temp\zoo\zoo_pra_new.fdb' USER 'SYSDBA' PASSWORD 'masterkey';
      SQL>INPUT 'C:\temp\zoo\{script}.sql';

IMPORTANT:
- DO NOT SAVE FILE BEFORE ENCODING FIX!
- Ensure the source file has the correct encoding:
  - The provided script is typically encoded in Windows-1250, but Visual Studio Code may misinterpret it as UTF-8.
  - If you save the file in UTF-8 without correcting the encoding, it may corrupt the data and the script won't work.
  - To fix this, use "Reopen with Encoding" → "Windows-1250", and then "Save with encoding" as "Windows-1250".
- Remove header part from the script especially "SET CLIENTLIB ... and CREATE DATABASE"
- If your script contains errors, replace the "Create Tables" section with the definitions from "Scripts\original-animalia-def.sql".
- Find and replace all instances of "SUB_TYPE TEXT" with "SUB_TYPE 1" (only 0 and 1 values are supported in the v 2.5 — 0 for binary).