# Claude Development Guidelines

## Branch Management Rules

### 1 Issue = 1 Branch Rule
- **MANDATORY**: For every GitHub issue created, a new dedicated feature branch MUST be created immediately
- Branch naming convention: `claude/issue-{issue-number}-{YYYYMMDD}-{HHMM}`
- Example: `claude/issue-9-20250919-0937` for issue #9
- All related changes for an issue should be committed to the same branch
- Do not create multiple branches for a single issue
- Do not mix changes from different issues in the same branch
- **IMPORTANT**: Never work on issues without first creating the corresponding branch

### PR Branch Consistency Rule
- Once a Pull Request is created, all subsequent changes must remain on the same branch
- Never create new branches for fixes, updates, or improvements to an existing PR
- All commits, reviews, and iterations should stay on the original PR branch
- This ensures clear tracking of changes and maintains PR history integrity

## Development Workflow

### Change Implementation Process

**MANDATORY: Follow this exact sequence for all changes:**

1. **Create Issue-Specific Branch**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b claude/issue-{number}-{YYYYMMDD}-{HHMM}
   ```

2. **Make Single, Focused Commits**
   - **One commit per logical change** (must be compilable and functional)
   - **Each commit should represent a complete, working state**
   - Write descriptive commit messages explaining the "why", not just the "what"
   - Example good commits:
     - "Add user authentication validation to login endpoint"
     - "Fix null reference exception in tenant filtering"
     - "Update database schema to support multi-tenant isolation"

3. **Test Before Commit**
   - Ensure code compiles without errors
   - Run relevant tests and verify they pass
   - Test functionality manually if automated tests don't exist
   - **Never commit broken or non-compilable code**

4. **Create Pull Request**
   - Push branch to remote: `git push -u origin claude/issue-{number}-{YYYYMMDD}-{HHMM}`
   - Create PR with descriptive title and summary
   - Link to the original GitHub issue
   - Include test plan and verification steps

5. **PR Review and Merge**
   - Address review feedback with additional commits on the same branch
   - **Never create new branches for PR fixes**
   - Once approved, merge via GitHub interface
   - Delete feature branch after merge

### Setup Instructions

1. Install dependencies for each component:
   - **API**: `dotnet restore` in `pzi-api/`
   - **WebApp**: `npm install` in `pzi-webapp/`
   - **Database**: PostgreSQL setup as per `MIGRATION_TO_POSTGRESQL.md`

### Testing & Quality

- Run tests before committing changes
- Follow existing code style and conventions (see [CODING_STANDARDS.md](CODING_STANDARDS.md))
- Ensure security best practices, especially for multi-tenant architecture
- Run linting and formatting tools before committing:
  - Frontend: `npm run lint` and `npm run format` in `pzi-webapp/`
  - Backend: Code analyzers run automatically during build

#### Running Tests

**Backend (.NET)**
```bash
cd pzi-api
dotnet test
```

**Frontend (React)**
```bash
cd pzi-webapp
npm test
```

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