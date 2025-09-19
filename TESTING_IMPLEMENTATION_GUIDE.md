# Implementační průvodce testování

## Rychlý start

### 1. Lokální spuštění testů

#### API testy (.NET)
```bash
cd pzi-api
dotnet restore
dotnet test --configuration Release --logger trx --collect:"XPlat Code Coverage"
```

#### WebApp testy (React)
```bash
cd pzi-webapp
npm install
npm run test              # Unit testy
npm run test:coverage     # S pokrytím kódu
npm run test:e2e          # E2E testy
```

#### Database testy
```bash
# Spuštění PostgreSQL
docker-compose up -d postgres

# Spuštění testů migrace
cd database
PGPASSWORD=Xserver@101 psql -h localhost -U postgres -d pzi -f tests/migration-tests.sql
```

### 2. Úplná testovací sada
```bash
# Spuštění všech služeb
docker-compose -f docker-compose.test.yml up -d

# Čekání na inicializaci
sleep 60

# Spuštění health check
node monitoring/health-checks.js

# Performance testy
k6 run performance/k6-load-test.js

# Security scan
python3 security/zap-baseline-scan.py http://localhost:3000
```

## Testovací infrastruktura

### Struktura adresářů
```
AnimaliaClaude/
├── pzi-api/
│   └── PziApi.Tests/
│       ├── Controllers/         # Unit testy kontrollerů
│       ├── Integration/         # Integrační testy
│       ├── MultiTenant/         # Multi-tenant testy
│       ├── Auth/               # Autentizační testy
│       └── TestBase.cs         # Společná testovací třída
├── pzi-webapp/
│   ├── tests/
│   │   ├── unit/               # Unit testy komponent
│   │   └── e2e/               # E2E testy
│   ├── vitest.config.ts       # Konfigurace Vitest
│   └── playwright.config.ts   # Konfigurace Playwright
├── database/
│   └── tests/
│       └── migration-tests.sql # Database testy
├── performance/
│   └── k6-load-test.js        # Performance testy
├── security/
│   ├── zap-baseline-scan.py   # DAST scan
│   └── penetration-testing/   # Pentest checklist
├── monitoring/
│   ├── health-checks.js       # Health check monitoring
│   └── config.json           # Konfigurace monitoringu
└── .github/workflows/
    └── comprehensive-testing.yml # CI/CD pipeline
```

### Testovací frameworks

#### .NET API (xUnit)
- **xUnit**: Hlavní testing framework
- **FluentAssertions**: Čitelnější assertions
- **Moq**: Mocking framework
- **AutoFixture**: Generování test dat
- **TestContainers**: Integration testing s Docker
- **Microsoft.AspNetCore.Mvc.Testing**: API testing

#### React WebApp (Vitest + Playwright)
- **Vitest**: Rychlý unit testing
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW (Mock Service Worker)**: API mocking
- **jsdom**: Browser environment simulation

#### Database (PostgreSQL)
- **Vlastní SQL skripty**: Migration testy
- **TestContainers**: Izolované DB prostředí
- **pg (node-postgres)**: Database connection testing

## Typy testů

### 1. Unit testy

#### API Controllers
```csharp
[Fact]
public async Task GetTenants_WithValidAuth_ReturnsTenants()
{
    // Arrange
    var token = await GetValidAuthToken();
    Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    // Act
    var response = await Client.GetAsync("/api/tenants");

    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}
```

#### React Components
```typescript
test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
});
```

### 2. Integration testy

#### API + Database
- TestContainers pro PostgreSQL
- Reálné HTTP požadavky
- Transaction rollback pro izolaci

#### Multi-tenant isolace
```csharp
[Fact]
public async Task MultiTenant_DataIsolation_PreventsCrossTenantAccess()
{
    var tenant1Token = await GetValidAuthToken(tenant1Id);
    var response = await Client.GetAsync($"/api/tenants/{tenant2Id}/records");
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}
```

### 3. E2E testy

#### Playwright automatizace
```typescript
test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*\/dashboard/);
});
```

### 4. Performance testy

#### k6 load testing
```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### 5. Security testy

#### OWASP ZAP baseline scan
```python
scanner = ZapBaselineScan('http://localhost:3000')
scanner.run_full_scan()
```

#### Penetrační testy
- OWASP Top 10 coverage
- Multi-tenant security
- Authentication bypass
- Authorization escalation

## CI/CD integrace

### GitHub Actions pipeline

```yaml
jobs:
  static-analysis:
    # Linting, formatting, security scan
  unit-tests:
    # Paralelní spouštění unit testů
  integration-tests:
    # Integration testy s databází
  e2e-tests:
    # End-to-end testy
  security-tests:
    # DAST skenování
  performance-tests:
    # Load testing (plánované)
```

### Quality gates
- **Code coverage**: Minimum 80%
- **Security**: Žádné high/critical zranitelnosti
- **Performance**: P95 < 500ms
- **Tests**: Všechny testy musí projít

## Multi-tenant testing

### Data isolace
```sql
-- Test RLS policies
SET SESSION pzi.current_tenant_id = '1';
SELECT * FROM users; -- Pouze tenant 1 data
```

### API isolace
```csharp
[Theory]
[InlineData("/api/tenants/{tenantId}/records")]
[InlineData("/api/tenants/{tenantId}/exports")]
public async Task API_ProtectedEndpoints_EnforceTenantIsolation(string endpointTemplate)
{
    var endpoint = endpointTemplate.Replace("{tenantId}", tenant2Id.ToString());
    var response = await Client.GetAsync(endpoint);
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}
```

## Security testování

### Automatizované SAST
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: 'javascript,csharp'
```

### DAST testing
```bash
# OWASP ZAP
python3 security/zap-baseline-scan.py http://localhost:3000

# Nikto web scanner
nikto -h localhost:3000
```

### Penetrační testy
1. **Information Gathering**: Technologie, endpoints
2. **Authentication Testing**: JWT, session management
3. **Authorization Testing**: RBAC, tenant isolation
4. **Input Validation**: SQL injection, XSS
5. **Business Logic**: Workflow bypass

## Monitoring a observabilita

### Health checks
```javascript
const healthCheck = new HealthCheckSuite();
await healthCheck.runAllChecks();
```

### Metriky
- Response time percentily
- Error rate
- Database connection pool
- Memory/CPU usage

### Alerting
```json
{
  "thresholds": {
    "responseTime": 5000,
    "errorRate": 0.01,
    "cpuUsage": 80
  }
}
```

## Troubleshooting

### Častá problémová místa

#### Database connection
```bash
# Test connection
PGPASSWORD=Xserver@101 psql -h localhost -U postgres -d pzi -c "SELECT 1"
```

#### Docker services
```bash
# Restart služeb
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml up -d
```

#### Port conflicts
```bash
# Check port usage
netstat -tulpn | grep :5432
lsof -i :5432
```

### Debug testy

#### .NET testy
```bash
dotnet test --logger "console;verbosity=detailed" --filter "Category=Integration"
```

#### React testy
```bash
npm run test -- --reporter=verbose --no-coverage
```

#### E2E testy
```bash
npx playwright test --debug --headed
```

## Maintenance

### Pravidelné úkoly

#### Týdně
- [ ] Aktualizace dependencies
- [ ] Review flaky testů
- [ ] Kontrola test coverage
- [ ] Performance trend analýza

#### Měsíčně
- [ ] Penetrační testy
- [ ] Security scan dependencies
- [ ] Test data cleanup
- [ ] Dokumentace update

#### Kvartálně
- [ ] Testing strategy review
- [ ] Framework updates
- [ ] Performance benchmarking
- [ ] Security policy review

### Optimalizace

#### Test performance
```bash
# Paralelní spouštění
dotnet test --parallel
npm run test -- --reporter=basic --run

# Selective testing
dotnet test --filter "Category!=Integration"
```

#### CI/CD optimalizace
```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/*.csproj') }}
```

## Best practices

### Test data
- Používejte factories pro test data
- Izolujte testy (no shared state)
- Cleanup po každém testu

### Test organization
- Groupování podle funkcionality
- Konzistentní naming conventions
- Clear test descriptions

### Performance
- Minimalizujte external dependencies
- Používejte mocking pro rychlé testy
- Paralelizujte kde možno

### Security
- Nikdy commitovat secrets
- Test pouze proti test prostředí
- Dodržovat ethical hacking guidelines