# PZI - API

## Overview

API project that powers PZI backend.

## Database connection in local environment

⚠️ **SECURITY**: Never commit database passwords to version control!

### Option 1: User Secrets (Recommended for local development)

Configure database connection using .NET User Secrets:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=YOUR_PASSWORD"
```

User secrets are stored locally and never committed to git.

### Option 2: Environment Variables

Set environment variable before running the application:

```bash
# Linux/macOS
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=YOUR_PASSWORD"

# Windows PowerShell
$env:ConnectionStrings__Default="Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=YOUR_PASSWORD"
```

### Option 3: .env file (for Docker)

Copy `.env.example` to `.env` in the project root and set your password:

```bash
cp ../.env.example ../.env
# Edit .env and set POSTGRES_PASSWORD
```

📖 For detailed security and secrets management, see [SECURITY_SECRETS.md](../SECURITY_SECRETS.md)

## Configuration values for container

- `Pzi__SwaggerEnabled` - specify `true` / `false` to enable / disable swagger for the interaction. When running in dev mode, swagger is always active.
- `Pzi__SwaggerApiHost` - optional parameter, when set override default API url showin in Swagger UI
- `Pzi__ApiKeys__[index]` - list of API keys allowed for the application
- `ConnectionStrings__Default` - Connection string to backing database
- Configuration sections for user permissions
  - `Pzi__Permissions__GrantAllPermissions` - When set to `true`, all users will have all permissions regardless of their AD groups
  - `Pzi__Permissions__RecordsRead__[index]` - List of AD groups that have RECORDS:VIEW permission
  - `Pzi__Permissions__RecordsEdit__[index]` - List of AD groups that have RECORDS:EDIT permission
  - `Pzi__Permissions__ListsView__[index]` - List of AD groups that have LISTS:VIEW permission
  - `Pzi__Permissions__ListsEdit__[index]` - List of AD groups that have LISTS:EDIT permission
  - `Pzi__Permissions__DocumentationDepartment__[index]` - List of AD groups that have DOCUMENTATION_DEPARTMENT permission
  - `Pzi__Permissions__JournalAccess__[index]` - List of AD groups that have JOURNAL:ACCESS permission

## Swagger

Application expose SwaggerUI, when running in dev mode or when configured with specific setting. Swagger is available on address `[host]:[port]/swagger` (by default on `http://localhost:5230`).

## CLI Commands

### Build locally

`dotnet build`

### Running tests locally

`dotnet test`

### Start project locally from commandline

Executed from root folder of `pzi-api`

`dotnet run --project PziApi`

### Publishing local version

Following command will publish release version to `out` folder:

`dotnet publish -c Release -o out`
