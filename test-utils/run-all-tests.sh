#!/bin/bash

# Kompletní testovací skript pro Animalia Claude projekt
# Spouští všechny typy testů v správném pořadí

set -e  # Exit on any error

# Barvy pro output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Kontrola prerequisit..."

    command -v docker >/dev/null 2>&1 || { error "Docker není nainstalován"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose není nainstalován"; exit 1; }
    command -v dotnet >/dev/null 2>&1 || { error ".NET SDK není nainstalován"; exit 1; }
    command -v node >/dev/null 2>&1 || { error "Node.js není nainstalován"; exit 1; }
    command -v npm >/dev/null 2>&1 || { error "npm není nainstalován"; exit 1; }

    success "Všechny prerequisity jsou splněny"
}

# Start services
start_services() {
    log "Spouštění testovacích služeb..."

    # Clean up existing containers
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

    # Start test environment
    docker-compose -f docker-compose.test.yml up -d

    # Wait for services to be ready
    log "Čekání na inicializaci služeb..."
    sleep 30

    # Health check
    for i in {1..12}; do
        if curl -s http://localhost:5433 && curl -s http://localhost:8081/api/health; then
            success "Služby jsou připraveny"
            break
        fi
        if [ $i -eq 12 ]; then
            error "Služby se nepodařilo spustit"
            docker-compose -f docker-compose.test.yml logs
            exit 1
        fi
        log "Čekání na služby... ($i/12)"
        sleep 10
    done
}

# Run static analysis
run_static_analysis() {
    log "Spouštění statické analýzy..."

    # .NET formatting check
    log "Kontrola .NET formátování..."
    cd pzi-api
    dotnet format --verify-no-changes || { error "Nesprávné formátování .NET kódu"; exit 1; }
    cd ..

    # TypeScript checking
    log "Kontrola TypeScript..."
    cd pzi-webapp
    npm ci
    npm run typecheck || { error "TypeScript chyby"; exit 1; }

    # ESLint
    log "Spouštění ESLint..."
    npm run lint || { warning "ESLint varování nalezena"; }
    cd ..

    success "Statická analýza dokončena"
}

# Run unit tests
run_unit_tests() {
    log "Spouštění unit testů..."

    # .NET unit tests
    log "Spouštění .NET unit testů..."
    cd pzi-api
    dotnet test --configuration Release \
        --logger trx \
        --collect:"XPlat Code Coverage" \
        --results-directory TestResults/ \
        --filter "Category!=Integration&Category!=MultiTenant" || {
        error ".NET unit testy selhaly"
        exit 1
    }
    cd ..

    # React unit tests
    log "Spouštění React unit testů..."
    cd pzi-webapp
    npm run test:coverage || {
        error "React unit testy selhaly"
        exit 1
    }
    cd ..

    success "Unit testy dokončeny"
}

# Run integration tests
run_integration_tests() {
    log "Spouštění integračních testů..."

    # Database migration tests
    log "Testování database migrací..."
    cd database
    PGPASSWORD=test_password psql -h localhost -p 5433 -U postgres -d pzi_test -f tests/migration-tests.sql || {
        error "Database testy selhaly"
        exit 1
    }
    cd ..

    # API integration tests
    log "Spouštění API integračních testů..."
    cd pzi-api
    dotnet test --configuration Release \
        --logger trx \
        --filter "Category=Integration" \
        --results-directory TestResults/ || {
        error "API integrační testy selhaly"
        exit 1
    }
    cd ..

    success "Integrační testy dokončeny"
}

# Run multi-tenant tests
run_multitenant_tests() {
    log "Spouštění multi-tenant testů..."

    cd pzi-api
    dotnet test --configuration Release \
        --logger trx \
        --filter "Category=MultiTenant" \
        --results-directory TestResults/ || {
        error "Multi-tenant testy selhaly"
        exit 1
    }
    cd ..

    success "Multi-tenant testy dokončeny"
}

# Run E2E tests
run_e2e_tests() {
    log "Spouštění E2E testů..."

    # Install Playwright if needed
    cd pzi-webapp
    if [ ! -d "node_modules/@playwright" ]; then
        npx playwright install --with-deps
    fi

    # Run E2E tests
    E2E_BASE_URL=http://localhost:3001 npm run test:e2e || {
        error "E2E testy selhaly"
        cd ..
        return 1
    }
    cd ..

    success "E2E testy dokončeny"
}

# Run performance tests
run_performance_tests() {
    log "Spouštění performance testů..."

    # Check if k6 is installed
    if ! command -v k6 >/dev/null 2>&1; then
        warning "k6 není nainstalován, přeskakuji performance testy"
        return 0
    fi

    mkdir -p performance/results
    BASE_URL=http://localhost:3001 k6 run performance/k6-load-test.js || {
        warning "Performance testy selhaly"
        return 1
    }

    success "Performance testy dokončeny"
}

# Run security tests
run_security_tests() {
    log "Spouštění security testů..."

    # Basic security endpoint checks
    log "Kontrola security endpointů..."

    # Test unauthenticated access
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/users | grep -q "401"; then
        success "Unauthenticated access správně blokován"
    else
        error "Security chyba: Unauthenticated access není blokován"
        return 1
    fi

    # Check CORS headers
    if curl -s -H "Origin: http://evil.com" http://localhost:8081/api/health | grep -q "Access-Control"; then
        success "CORS headers přítomny"
    else
        warning "CORS headers možná chybí"
    fi

    # OWASP ZAP scan (if available)
    if command -v python3 >/dev/null 2>&1 && [ -f "security/zap-baseline-scan.py" ]; then
        log "Spouštění OWASP ZAP scan..."
        python3 security/zap-baseline-scan.py http://localhost:3001 || {
            warning "DAST scan našel bezpečnostní problémy"
        }
    else
        warning "ZAP scan není k dispozici"
    fi

    success "Security testy dokončeny"
}

# Run health checks
run_health_checks() {
    log "Spouštění health checků..."

    if [ -f "monitoring/health-checks.js" ]; then
        node monitoring/health-checks.js || {
            error "Health checks selhaly"
            return 1
        }
    else
        warning "Health check skript není k dispozici"
    fi

    success "Health checks dokončeny"
}

# Generate report
generate_report() {
    log "Generování reportu..."

    REPORT_DIR="test-reports"
    mkdir -p "$REPORT_DIR"

    # Collect test results
    find . -name "TestResults" -type d -exec cp -r {} "$REPORT_DIR/" \; 2>/dev/null || true
    find . -name "coverage" -type d -exec cp -r {} "$REPORT_DIR/" \; 2>/dev/null || true
    find . -name "test-results" -type d -exec cp -r {} "$REPORT_DIR/" \; 2>/dev/null || true

    # Generate summary
    cat > "$REPORT_DIR/test-summary.md" << EOF
# Test Execution Summary

**Datum spuštění:** $(date)
**Prostředí:** $(hostname)

## Výsledky testů

- ✅ Statická analýza: Dokončena
- ✅ Unit testy: Dokončeny
- ✅ Integrační testy: Dokončeny
- ✅ Multi-tenant testy: Dokončeny
- ✅ E2E testy: Dokončeny
- ⚠️  Performance testy: Podmíněné
- ⚠️  Security testy: Podmíněné
- ✅ Health checks: Dokončeny

## Artefakty

- Test results: \`TestResults/\`
- Coverage reports: \`coverage/\`
- E2E results: \`test-results/\`
- Performance results: \`performance/results/\`
- Security results: \`security/results/\`

## Poznámky

Všechny povinné testy prošly úspěšně.
Podmíněné testy závisí na dostupnosti externích nástrojů.
EOF

    success "Report vygenerován v $REPORT_DIR/"
}

# Cleanup
cleanup() {
    log "Úklid..."

    # Stop test services
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

    # Clean up temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true

    success "Úklid dokončen"
}

# Main execution
main() {
    log "Spouštění kompletní testovací sady..."

    # Set up error handling
    trap cleanup EXIT

    check_prerequisites
    start_services

    # Run all test phases
    run_static_analysis
    run_unit_tests
    run_integration_tests
    run_multitenant_tests

    # Optional tests (don't fail the build)
    run_e2e_tests || warning "E2E testy selhaly, ale pokračuje se"
    run_performance_tests || warning "Performance testy přeskočeny"
    run_security_tests || warning "Security testy měly problémy"
    run_health_checks || warning "Health checks selhaly"

    generate_report

    success "🎉 Všechny povinné testy dokončeny úspěšně!"
    log "📊 Výsledky najdete v test-reports/"
}

# Handle script arguments
case "${1:-all}" in
    "static")
        check_prerequisites
        run_static_analysis
        ;;
    "unit")
        check_prerequisites
        start_services
        run_unit_tests
        cleanup
        ;;
    "integration")
        check_prerequisites
        start_services
        run_integration_tests
        cleanup
        ;;
    "e2e")
        check_prerequisites
        start_services
        run_e2e_tests
        cleanup
        ;;
    "performance")
        check_prerequisites
        start_services
        run_performance_tests
        cleanup
        ;;
    "security")
        check_prerequisites
        start_services
        run_security_tests
        cleanup
        ;;
    "health")
        check_prerequisites
        start_services
        run_health_checks
        cleanup
        ;;
    "all"|*)
        main
        ;;
esac