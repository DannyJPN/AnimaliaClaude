# PZI - API

## Overview

API project that powers PZI backend.

## Database connection in local environment

- To configure database connection for local development, it is preferred to use `user-secrets` provided by .net framework. They can be set from Vistual Stuio UI or from command line:
  - `dotnet user-secrets set "ConnectionStrings:Default" "<<VALUE>>"`
- We generally use shared instance of database (managing imported data is quite difficult to have per-user DBs), value for connection string can be provided on-demand.

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
