#How to create database and import data

1. Install same version (?) of firebird database (https://www.firebirdsql.org/en/server-packages/). In case you do will install lates version you will have to amed script and change BLOB type. Sub_Type Text => Sub_Type 1 and Sub_Type 5 => Sub_type 0
2. Locate (e.g. C:\Program Files\Firebird\Firebird_5_0) and run isql.exe
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
- Find and replace all instances of "SUB_TYPE TEXT" with "SUB_TYPE 1" (only 0 and 1 values are supported in some versions — 0 for binary).