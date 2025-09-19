# Claude Development Guidelines

## Branch Management Rules

### 1 Issue = 1 Branch Rule
- Every GitHub issue should have its own dedicated feature branch
- Branch naming convention: `claude/issue-{issue-number}-{YYYYMMDD}-{HHMM}`
- Example: `claude/issue-9-20250919-0937` for issue #9
- All related changes for an issue should be committed to the same branch
- Do not create multiple branches for a single issue
- Do not mix changes from different issues in the same branch

### PR Branch Consistency Rule
- Once a Pull Request is created, all subsequent changes must remain on the same branch
- Never create new branches for fixes, updates, or improvements to an existing PR
- All commits, reviews, and iterations should stay on the original PR branch
- This ensures clear tracking of changes and maintains PR history integrity

## Development Workflow

### Setup Instructions
1. Install dependencies for each component:
   - API: `dotnet restore` in `pzi-api/`
   - WebApp: `npm install` in `pzi-webapp/`
   - Database: PostgreSQL setup as per `MIGRATION_TO_POSTGRESQL.md`

### Testing & Quality
- Run tests before committing changes
- Follow existing code style and conventions
- Ensure security best practices, especially for multi-tenant architecture

### Multi-Tenant Architecture Rules
- All database entities must include `TenantId` for data isolation
- API endpoints must validate tenant context
- No cross-tenant data access allowed
- Use EF Core global query filters for automatic tenant filtering

## Repository Structure
- `pzi-api/` - .NET Core API backend
- `pzi-webapp/` - React frontend application
- `database/` - Database schemas and migrations
- `pzi-login/` - Authentication service
- `pzi-data-import/` - Data import utilities