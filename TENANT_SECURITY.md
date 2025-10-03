# Multi-Tenant Security Architecture

## Overview
This document describes the comprehensive tenant isolation and security measures implemented in the PZI API to prevent cross-tenant data access.

## 🔒 Security Layers

### 1. Tenant Resolution & Validation
The `TenantMiddleware` resolves and validates tenant context for every API request.

#### Resolution Strategy (in order of priority):
1. **JWT Claims** - `custom:tenant`, `tenant`, `org_name`, or `organization` claims
2. **Email Domain** - Extract domain from user's email and match to tenant
3. **Host/Subdomain** - Extract subdomain from request host

#### Validation Rules:
- ✅ Tenant must exist in database
- ✅ Tenant must be active (`IsActive = true`)
- ❌ **No fallback to "default"** - requests without valid tenant are rejected with 403 Forbidden
- ❌ **Bypass only for**: `/health`, `/swagger`, `/api/auth`, `/.well-known` endpoints

**Error Response** (when tenant validation fails):
```json
{
  "error": "Forbidden",
  "message": "Valid tenant context is required. Please ensure your authentication token contains valid tenant information.",
  "code": "TENANT_REQUIRED"
}
```

### 2. EF Core Global Query Filters
All tenant entities automatically filter data by `TenantId` at the database query level.

**Affected Entities:**
- Core: `Specimen`, `Species`, `SpecimenImage`
- Movement: `Movement`, `Placement`, `SpecimenPlacement`
- Contracts: `Contract`, `ContractAction`, `Partner`
- Documents: `DocumentSpecimen`, `DocumentSpecies`
- Cadavers: `Cadaver`, `CadaverPartner`
- Markings: `Marking`
- Journal: `JournalEntry`, `JournalEntryAudit`, `JournalEntrySpecimen`, etc.
- Records: `RecordSpecimen`, `RecordSpecies`
- User Preferences: `UserFlaggedSpecies`, `UserFlaggedDistrict`

**Security Behavior:**
- If `CurrentTenantId` is null/empty → filter returns `string.Empty` → **no data returned** (defensive)
- Query filters applied automatically to all EF queries
- Cannot be bypassed except with explicit `IgnoreQueryFilters()` call (should never be used in tenant entities)

### 3. Automatic TenantId Assignment
On `SaveChanges()` / `SaveChangesAsync()`, the DbContext automatically:
1. Validates tenant context exists
2. Assigns `TenantId` to all new `TenantEntity` records
3. **Throws exception** if no valid tenant context

**Exception Thrown:**
```csharp
InvalidOperationException: "Cannot save changes without valid tenant context. Ensure the request has proper tenant information in JWT claims or request headers."
```

## 🛡️ Security Guarantees

### Read Operations
- ✅ Users can **ONLY** query data belonging to their tenant
- ✅ Cross-tenant queries return empty results (never throw exceptions)
- ✅ Global filters cannot be accidentally bypassed

### Write Operations
- ✅ New records **MUST** have valid tenant context
- ✅ Attempts to save without tenant context **fail immediately**
- ✅ TenantId automatically assigned - no manual intervention needed

### Tenant Switching (SuperAdmin)
SuperAdmin users can potentially switch tenant context, but:
- ⚠️ Must be explicitly implemented in `TenantContext.SetCurrentTenant()`
- ⚠️ Must validate SuperAdmin permissions before allowing switch
- ⚠️ Audit logging required for all tenant switches

## 🔍 Testing Tenant Isolation

### Manual Testing

1. **Create test tenants:**
```sql
INSERT INTO public."Tenants" ("Id", "Name", "DisplayName", "IsActive", "Domain")
VALUES
  ('tenant-a', 'Tenant A', 'Tenant A', true, 'tenant-a.example.com'),
  ('tenant-b', 'Tenant B', 'Tenant B', true, 'tenant-b.example.com');
```

2. **Create test data for each tenant:**
```sql
INSERT INTO public."Species" ("TenantId", "Name", ...)
VALUES
  ('tenant-a', 'Species A1', ...),
  ('tenant-b', 'Species B1', ...);
```

3. **Test with different JWT tokens:**
```bash
# Token with tenant-a claim
curl -H "Authorization: Bearer $TOKEN_TENANT_A" https://api.example.com/odata/Species
# Should return only Species A1

# Token with tenant-b claim
curl -H "Authorization: Bearer $TOKEN_TENANT_B" https://api.example.com/odata/Species
# Should return only Species B1

# Token with no tenant claim
curl -H "Authorization: Bearer $TOKEN_NO_TENANT" https://api.example.com/odata/Species
# Should return 403 Forbidden
```

### Automated Testing

#### Unit Test Example
```csharp
[Fact]
public async Task GlobalQueryFilter_FiltersDataByTenantId()
{
    // Arrange
    var tenantA = "tenant-a";
    var tenantB = "tenant-b";

    var tenantContext = new Mock<ITenantContext>();
    tenantContext.Setup(x => x.CurrentTenantId).Returns(tenantA);

    // Act
    var speciesA = await dbContext.Species.ToListAsync();

    tenantContext.Setup(x => x.CurrentTenantId).Returns(tenantB);
    var speciesB = await dbContext.Species.ToListAsync();

    // Assert
    Assert.All(speciesA, s => Assert.Equal(tenantA, s.TenantId));
    Assert.All(speciesB, s => Assert.Equal(tenantB, s.TenantId));
    Assert.DoesNotContain(speciesA, s => speciesB.Contains(s));
}
```

#### Integration Test Example
```csharp
[Fact]
public async Task SaveChanges_RequiresValidTenantContext()
{
    // Arrange
    var species = new Species { Name = "Test Species" };
    dbContext.Species.Add(species);

    // Mock null tenant context
    var tenantContext = new Mock<ITenantContext>();
    tenantContext.Setup(x => x.CurrentTenantId).Returns((string)null);

    // Act & Assert
    var exception = await Assert.ThrowsAsync<InvalidOperationException>(
        async () => await dbContext.SaveChangesAsync()
    );

    Assert.Contains("Cannot save changes without valid tenant context", exception.Message);
}
```

## 🔧 Implementation Checklist

### For New Entities
When adding a new entity that requires tenant isolation:

- [ ] Inherit from `TenantEntity` base class
- [ ] Add to global query filters in `SetupGlobalQueryFilters()`:
  ```csharp
  modelBuilder.Entity<YourEntity>().HasQueryFilter(e => e.TenantId == currentTenantId);
  ```
- [ ] Verify `TenantId` foreign key configured properly
- [ ] Write unit tests for tenant isolation
- [ ] Test cross-tenant access attempts

### For New API Endpoints
When adding new API endpoints:

- [ ] Ensure endpoint path not in bypass list (unless health/auth endpoint)
- [ ] Verify JWT token contains tenant claim
- [ ] Test with multiple tenant contexts
- [ ] Verify 403 response when tenant missing
- [ ] Add integration tests

## 📊 Monitoring & Auditing

### Logging
The system logs the following tenant-related events:
```
[INFO] Tenant resolved and validated: {TenantId}
[WARN] Tenant {TenantId} not found or inactive
[ERROR] Request rejected: No valid tenant context. Path: {Path}, User: {User}
```

### Recommended Metrics
- Count of 403 Forbidden responses (TENANT_REQUIRED)
- Tenant resolution failures by resolution method
- Cross-tenant access attempts (should be 0)
- Tenant context null/empty occurrences

### Security Audit
Regularly audit:
1. All `IgnoreQueryFilters()` calls in codebase → should be **ZERO** for tenant entities
2. Direct SQL queries → must include `WHERE TenantId = @tenantId`
3. SuperAdmin operations → must have audit trail
4. Tenant bypass paths → should be minimal and documented

## ⚠️ Common Pitfalls

### ❌ DON'T: Use IgnoreQueryFilters()
```csharp
// NEVER DO THIS for tenant entities!
await dbContext.Species
    .IgnoreQueryFilters()  // ❌ Bypasses tenant isolation
    .ToListAsync();
```

### ❌ DON'T: Manually set TenantId to null
```csharp
// DON'T - will cause save to fail
var species = new Species
{
    Name = "Test",
    TenantId = null  // ❌ Will throw exception on save
};
```

### ✅ DO: Trust automatic TenantId assignment
```csharp
// Correct - TenantId automatically assigned
var species = new Species { Name = "Test" };
dbContext.Species.Add(species);
await dbContext.SaveChangesAsync();  // TenantId set automatically
```

### ✅ DO: Include tenant in JWT claims
```json
{
  "sub": "user123",
  "email": "user@tenant-a.example.com",
  "custom:tenant": "tenant-a",
  "exp": 1234567890
}
```

## 📚 References

- [TenantMiddleware.cs](pzi-api/PziApi/CrossCutting/Tenant/TenantMiddleware.cs)
- [TenantContext.cs](pzi-api/PziApi/CrossCutting/Tenant/TenantContext.cs)
- [PziDbContext.cs](pzi-api/PziApi/CrossCutting/Database/PziDbContext.cs) - See `SetupGlobalQueryFilters()` and `SetTenantId()`
- [TenantEntity.cs](pzi-api/PziApi/Models/Tenant.cs)
- [CLAUDE.md](CLAUDE.md) - Multi-Tenant Architecture Rules

## 🔐 Security Contact

For security issues related to tenant isolation:
1. **DO NOT** create public GitHub issues
2. Contact project maintainers directly
3. Report suspected cross-tenant access vulnerabilities immediately
