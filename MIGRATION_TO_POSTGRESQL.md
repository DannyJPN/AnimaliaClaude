# Database Migration: MSSQL → PostgreSQL

This document describes the complete migration process from Microsoft SQL Server to PostgreSQL for the PZI project.

## Overview

The PZI (Prague Zoo Information System) project has been successfully migrated from Microsoft SQL Server to PostgreSQL. This migration affects multiple microservices and involves comprehensive changes to database configurations, ORM setup, and schema definitions.

## Services Affected

### 1. pzi-api (Main API Service)
- **Framework**: .NET 8 with Entity Framework Core
- **Previous**: Microsoft.EntityFrameworkCore.SqlServer 9.0.5
- **Current**: Npgsql.EntityFrameworkCore.PostgreSQL 9.0.5

### 2. pzi-data-import (Data Import Service)
- **Framework**: .NET 8 console application
- **Previous**: Microsoft.Data.SqlClient 5.2.2
- **Current**: Npgsql 8.0.3

### 3. pzi-data-export (Data Export Service)
- **Framework**: .NET 8 console application
- **Previous**: Microsoft.Data.SqlClient 5.2.2
- **Current**: Npgsql 8.0.3

### 4. pzi-login (Authentication Service)
- **Framework**: .NET 8
- **Status**: No database dependencies - no changes required

### 5. pzi-webapp (Frontend)
- **Framework**: React + TypeScript with React Router v7
- **Status**: No database dependencies - no changes required

## Changes Made

### Package Dependencies

#### pzi-api/PziApi/PziApi.csproj
```diff
- <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.5" />
+ <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.5" />
```

#### pzi-data-import/Pzi.Data.Import/Pzi.Data.Import.csproj
```diff
- <PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.2" />
+ <PackageReference Include="Npgsql" Version="8.0.3" />
```

#### pzi-data-import/Pzi.Data.Export/Pzi.Data.Export.csproj
```diff
- <PackageReference Include="Microsoft.Data.SqlClient" Version="5.2.2" />
+ <PackageReference Include="Npgsql" Version="8.0.3" />
```

### Configuration Changes

#### Connection Strings
**Before (MSSQL):**
```json
{
  "ConnectionStrings": {
    "Default": "Data Source=host.containers.internal,1433;Initial Catalog=pzi;User ID=SA;Password=Xserver@101;Persist Security Info=False;Encrypt=False"
  }
}
```

**After (PostgreSQL):**
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=Xserver@101"
  }
}
```

#### DbContext Configuration (Program.cs)
**Before:**
```csharp
builder.Services.AddDbContext<PziDbContext>((provider, options) =>
{
  options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), sqlServerOptionsAction: sqlOptions =>
  {
    sqlOptions.CommandTimeout(240);
  });
});
```

**After:**
```csharp
builder.Services.AddDbContext<PziDbContext>((provider, options) =>
{
  options.UseNpgsql(builder.Configuration.GetConnectionString("Default"), npgsqlOptionsAction: npgsqlOptions =>
  {
    npgsqlOptions.CommandTimeout(240);
  });
});
```

### Code Changes

#### Data Import/Export Services
All instances of `SqlConnection` have been replaced with `NpgsqlConnection`:

```csharp
// Before
using Microsoft.Data.SqlClient;
using (var connection = new SqlConnection(_connectionString))

// After
using Npgsql;
using (var connection = new NpgsqlConnection(_connectionString))
```

### Database Schema Migration

#### New PostgreSQL Schema
Created a new PostgreSQL-compatible schema at:
- `database/new-schema/db/migrations/postgres/V0_0_1__initial_setup_postgres.sql`

#### Key Schema Changes
1. **Identity Columns**: `INT IDENTITY(1,1)` → `SERIAL`
2. **Data Types**:
   - `NVARCHAR` → `VARCHAR` / `TEXT`
   - `DATETIME` → `TIMESTAMP`
   - `GETDATE()` → `CURRENT_TIMESTAMP`
3. **Schema References**: Removed `[dbo].` prefixes
4. **Triggers**: SQL Server triggers converted to PostgreSQL functions
5. **Views**: Converted MSSQL-specific syntax to PostgreSQL equivalents

### Docker Configuration

#### New docker-compose.yml
```yaml
services:
  postgresql:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pzi
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Xserver@101
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/new-schema/db/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pzi"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
```

## Database Setup

### 1. Start PostgreSQL
```bash
docker-compose up -d postgresql
```

### 2. Verify Database Connection
```bash
docker-compose exec postgresql psql -U postgres -d pzi -c "\dt"
```

### 3. Run Initial Migration
The PostgreSQL schema will be automatically created when the container starts due to the volume mount of migration scripts.

## Running the Services

### 1. API Service
```bash
cd pzi-api
dotnet restore
dotnet run
```

### 2. Data Import Service
```bash
cd pzi-data-import/Pzi.Data.Import
dotnet restore
dotnet run
# Enter PostgreSQL connection string when prompted
```

### 3. Web Application
```bash
cd pzi-webapp
npm install
npm run dev
```

## Migration Validation

### 1. Entity Framework Core
- All EF Core entities should work without changes
- Views and complex queries remain functional
- Foreign key relationships preserved

### 2. Data Import/Export
- Direct SQL operations converted to PostgreSQL syntax
- Bulk insert operations use PostgreSQL-specific approaches
- Transaction handling remains intact

### 3. Testing
Run the test suite to ensure all functionality works:
```bash
cd pzi-api
dotnet test
```

## Performance Considerations

### 1. Indexes
All critical indexes have been ported to PostgreSQL with equivalent functionality.

### 2. Query Optimization
PostgreSQL's query planner differs from SQL Server. Monitor query performance and adjust as needed.

### 3. Connection Pooling
Npgsql provides built-in connection pooling optimized for PostgreSQL.

## Rollback Plan

If rollback to SQL Server is needed:
1. Revert all package references to SQL Server versions
2. Update connection strings back to SQL Server format
3. Change `UseNpgsql` back to `UseSqlServer`
4. Restore SQL Server database from backup

## Benefits of PostgreSQL Migration

1. **Open Source**: No licensing costs
2. **Performance**: Generally better performance for complex queries
3. **Standards Compliance**: Better SQL standards compliance
4. **Advanced Features**: Support for JSON, arrays, and advanced data types
5. **Extensibility**: Rich ecosystem of extensions
6. **Cross-Platform**: Better Docker and Linux support

## Post-Migration Tasks

1. Monitor application performance
2. Update any documentation referencing SQL Server
3. Train team on PostgreSQL-specific features and differences
4. Set up PostgreSQL-specific monitoring and backup procedures
5. Consider PostgreSQL-specific optimizations

## Troubleshooting

### Common Issues

1. **Case Sensitivity**: PostgreSQL is case-sensitive for identifiers by default
2. **Data Type Differences**: Some implicit conversions may behave differently
3. **Function Names**: PostgreSQL uses different function names (e.g., `LENGTH` vs `LEN`)

### Logs
Check application logs for any database-related errors:
```bash
docker-compose logs postgresql
dotnet run --verbosity detailed
```

## Contact

For issues or questions about this migration, please contact the development team or create an issue in the repository.