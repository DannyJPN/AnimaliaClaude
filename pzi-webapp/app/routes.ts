import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login-callback", "./routes/auth/login-callback.tsx"),
  route("logout", "./routes/auth/logout.tsx"),
  route("test-login", "./routes/auth/test-login.tsx"),

  route("api/set-table-settings", "./routes/api/set-table-settings.tsx"),
  route("api/taxonomy-species-context-search", "./routes/api/taxonomy-species-context-search.tsx"),
  route("api/partners-context-search", "./routes/api/partners-context-search.tsx"),
  route("api/species-by-ids", "./routes/api/species-by-ids.tsx"),
  route("api/org-levels-by-ids", "./routes/api/org-levels-by-ids.tsx"),
  route("api/locations-by-ids", "./routes/api/locations-by-ids.tsx"),
  route("api/exposition-sets-by-ids", "./routes/api/exposition-sets-by-ids.tsx"),
  route("api/exposition-areas-by-ids", "./routes/api/exposition-areas-by-ids.tsx"),
  route("api/phyla-by-ids", "./routes/api/phyla-by-ids.tsx"),
  route("api/classes-by-ids", "./routes/api/classes-by-ids.tsx"),
  route("api/orders-by-ids", "./routes/api/orders-by-ids.tsx"),
  route("api/families-by-ids", "./routes/api/families-by-ids.tsx"),
  route("api/genera-by-ids", "./routes/api/genera-by-ids.tsx"),
  route("api/record-action-types", "./routes/api/record-action-types.tsx"),
  route("api/origin-types", "./routes/api/origin-types.tsx"),
  route("api/specimen-image/:imageId", "./routes/api/specimen-image.tsx"),

  route('print-reports/specimen/specimen-registered-eu-permit', './routes/print-reports/exports/specimen/specimen-registered-eu-permit.tsx'),
  route('print-reports/specimen/specimen-registration', './routes/print-reports/exports/specimen/specimen-registration.tsx'),
  route('print-reports/specimen/specimen-card', "./routes/print-reports/exports/specimen/specimen-card-export.tsx"),
  route('print-reports/specimen/specimen-card-cr-evidence', "./routes/print-reports/exports/specimen/specimen-card-cr-evidence-export.tsx"),
  route('print-reports/specimen/specimen-descendants', "./routes/print-reports/exports/specimen/specimen-descendants-export.tsx"),
  route('print-reports/specimen/specimen-genealogy', "./routes/print-reports/exports/specimen/specimen-genealogy-export.tsx"),
  route('print-reports/species/species-history/:speciesId', "./routes/print-reports/exports/species/species-history-export.tsx"),
  route('print-reports/species/species-note/:speciesId', "./routes/print-reports/exports/species/species-note.tsx"),
  route('print-reports/species/species-in-zoo/:speciesId', "./routes/print-reports/exports/species/species-in-zoo-export.tsx"),
  route('print-reports/species/species-in-region-owned/:regionId', "./routes/print-reports//exports/species/species-in-region-b.tsx"),
  route('print-reports/economy/feeding-days', "./routes/print-reports/exports/economy/feeding-days-export.tsx"),
  route('print-reports/economy/feeding-days-for-donation', "./routes/print-reports/exports/economy/feeding-days-for-donation-export.tsx"),
  route('print-reports/economy/inventory-deponated-export', "./routes/print-reports/exports/economy/inventory-deponated-export.tsx"),
  route('print-reports/economy/feeding-days-seized', "./routes/print-reports/exports/economy/feeding-days-seized-export.tsx"),
  route('print-reports/economy/region-inventory', "./routes/print-reports/exports/economy/region-inventory-export.tsx"),
  route('print-reports/economy/region-inventory-all', "./routes/print-reports/exports/economy/region-inventory-all-export.tsx"),
  route('print-reports/economy/contracts-by-number-mask', "./routes/print-reports/exports/economy/contracts-by-number-mask-export.tsx"),
  route('print-reports/economy/contracts-by-date', "./routes/print-reports/exports/economy/contracts-by-date-export.tsx"),
  route('print-reports/economy/section-inventory', "./routes/print-reports/exports/economy/section-inventory-export.tsx"),
  route('print-reports/economy/economy-of-movement-overview', "./routes/print-reports/exports/economy/economy-of-movement-overview-export.tsx"),
  route('print-reports/economy/economy-of-movement-recap', "./routes/print-reports/exports/economy/economy-of-movement-recap-export.tsx"),
  route('print-reports/economy/economy-of-movement-transactions', "./routes/print-reports/exports/economy/economy-of-movement-transactions-export.tsx"),
  route('print-reports/economy/seized-species', "./routes/print-reports/exports/economy/seized-species.tsx"),
  route('print-reports/economy/seized-species-b', "./routes/print-reports/exports/economy/seized-species-b.tsx"),
  route('print-reports/economy/seized-specimens-export', "./routes/print-reports/exports/economy/seized-specimens-export.tsx"),
  route('print-reports/economy/economy-of-movement-summary', "./routes/print-reports/exports/economy/economy-of-movement-summary-export.tsx"),
  route('print-reports/economy/seized-specimens-all-export', "./routes/print-reports/exports/economy/seized-specimens-all-export.tsx"),
  route('print-reports/exports/economy/deposit-inquiry-export', "./routes/print-reports/exports/economy/deposit-inquiry-export.tsx"),
  route('print-reports/economy/envelope-export', "./routes/print-reports/exports/economy/envelope-export.tsx"),
  route('print-reports/zoology/eu-fauna', "./routes/print-reports/exports/zoology/eu-fauna-export.tsx"),
  route('print-reports/zoology/cr-protected', "./routes/print-reports/exports/zoology/cr-protected-export.tsx"),
  route('print-reports/zoology/cr-decision-by-movement-date', "./routes/print-reports/exports/zoology/cr-decision-by-movement-date-export.tsx"),
  route('print-reports/zoology/cr-evidence-by-movement-date', "./routes/print-reports/exports/zoology/cr-evidence-by-movement-date-export.tsx"),
  route('print-reports/zoology/full-list-by-zims-export', "./routes/print-reports/exports/zoology/full-list-by-zims-export.tsx"),
  route('print-reports/zoology/in-zoo-status', "./routes/print-reports/exports/zoology/in-zoo-status-export.tsx"),
  route('print-reports/zoology/in-zoo-bulk/:classId', "./routes/print-reports/exports/zoology/in-zoo-bulk-export.tsx"),
  route('print-reports/zoology/in-zoo-bulk-not-in-state/:classId', "./routes/print-reports/exports/zoology/in-zoo-bulk-not-in-state-export.tsx"),
  route('print-reports/zoology/in-zoo-bulk-by-decision', "./routes/print-reports/exports/zoology/in-zoo-bulk-by-decision-export.tsx"),
  route('print-reports/zoology/in-zoo-bulk-no-eu-permit', './routes/print-reports/exports/zoology/in-zoo-bulk-no-eu-permit-export.tsx'),
  route('print-reports/zoology/in-zoo-bulk-no-eu-reg-only', './routes/print-reports/exports/zoology/in-zoo-bulk-no-eu-permit-reg-only-export.tsx'),
  route('print-reports/zoology/in-zoo-bulk-eu-fauna', './routes/print-reports/exports/zoology/in-zoo-bulk-eu-fauna-export.tsx'),
  route('print-reports/zoology/species-in-region', "./routes/print-reports/exports/zoology/species-in-region.tsx"),
  route('print-reports/zoology/statistic-births', "./routes/print-reports/exports/zoology/statistic-births-export.tsx"),
  route('print-reports/zoology/statistics-by-order', "./routes/print-reports/exports/zoology/statistics-by-order-export.tsx"),
  route('print-reports/zoology/statistics-cadavers-in-period', "./routes/print-reports/exports/zoology/statistics-cadavers-in-period-export.tsx"),
  route('print-reports/zoology/statistics-as-of-date', "./routes/print-reports/exports/zoology/statistics-as-of-date-export.tsx"),
  route('print-reports/zoology/inventory-movements', "./routes//print-reports/exports/zoology/inventory-movements-export.tsx"),
  route('print-reports/zoology/movement-in-zoo-by-date', "./routes/print-reports/exports/zoology/movement-in-zoo-by-date-export.tsx"),
  route('print-reports/zoology/movement-in-zoo-by-species', "./routes/print-reports/exports/zoology/movement-in-zoo-by-species-export.tsx"),
  route('print-reports/zoology/movement-in-zoo-by-region', "./routes/print-reports/exports/zoology/movement-in-zoo-by-region-export.tsx"),
  route('print-reports/zoology/movement-in-zoo-by-partner', "./routes/print-reports/exports/zoology/movement-in-zoo-by-partner-export.tsx"),
  route("print-reports/zoology/species-inventory", "./routes/print-reports/exports/zoology/species-inventory-export.tsx"),
  route("print-reports/zoology/registrations-list-by-number", "./routes/print-reports/exports/zoology/registrations-list-by-number-export.tsx"),
  route("print-reports/zoology/registrations-list-by-date", "./routes/print-reports/exports/zoology/registrations-list-by-date-export.tsx"),
  route("print-reports/zoology/registrations-list-by-eu-permit", "./routes/print-reports/exports/zoology/registrations-list-by-eu-permit-export.tsx"),
  route("print-reports/zoology/eu-divergence-export", "./routes/print-reports/exports/zoology/eu-divergence-export.tsx"),
  route("print-reports/zoology/specimens-for-zims-at-date-range-export", "./routes/print-reports/exports/zoology/specimens-for-zims-at-date-range-export.tsx"),
  route("print-reports/zoology/births-in-period-export", "./routes/print-reports/exports/zoology/births-in-period-export.tsx"),
  route("print-reports/zoology/zoology-statistics-eep", "./routes/print-reports/exports/zoology/zoology-statistics-eep.tsx"),
  route("print-reports/zoology/zoology-statistics-eep-mzp", "./routes/print-reports/exports/zoology/zoology-statistics-eep-mzp.tsx"),
  route("print-reports/zoology/in-zoo-by-region-export", "./routes/print-reports/exports/zoology/in-zoo-by-region-export.tsx"),

  route('autocompletes/autocomplete-partner', './routes/autocompletes/autocomplete-partner.tsx'),
  route('autocompletes/autocomplete-zoo-partner', './routes/autocompletes/autocomplete-zoo-partner.tsx'),
  route('autocompletes/autocomplete-zoos', './routes/autocompletes/autocomplete-zoos.tsx'),
  route('autocompletes/autocomplete-species', './routes/autocompletes/autocomplete-species.tsx'),
  route('autocompletes/autocomplete-org-levels', './routes/autocompletes/autocomplete-org-levels.tsx'),
  route('autocompletes/autocomplete-taxonomy-class', './routes/autocompletes/autocomplete-taxonomy-class.tsx'),
  route('autocompletes/autocomplete-genera', './routes/autocompletes/autocomplete-genera.tsx'),
  route('autocompletes/autocomplete-families', './routes/autocompletes/autocomplete-families.tsx'),
  route('autocompletes/autocomplete-orders', './routes/autocompletes/autocomplete-orders.tsx'),
  route('autocompletes/autocomplete-classes', './routes/autocompletes/autocomplete-classes.tsx'),
  route('autocompletes/autocomplete-phyla', './routes/autocompletes/autocomplete-phyla.tsx'),
  route('autocompletes/autocomplete-exposition-sets', './routes/autocompletes/autocomplete-exposition-sets.tsx'),
  route('autocompletes/autocomplete-exposition-areas', './routes/autocompletes/autocomplete-exposition-areas.tsx'),
  route('autocompletes/autocomplete-locations', './routes/autocompletes/autocomplete-locations.tsx'),
  route('autocompletes/autocomplete-regions', './routes/autocompletes/autocomplete-regions.tsx'),

  layout("./routes/app-layout.tsx", { id: 'app-layout' }, [
    index("./routes/index.tsx"),

    route("user-settings", "./routes/user-settings.tsx"),

    route("journal", "./routes/journal.tsx"),

    route("print-exports", "./routes/print-exports.tsx"),
    route("print-exports/reports-list", "./routes/print-reports/index.tsx", [
      route("economy/feeding-days", "./routes/print-reports/pages/economy/feeding-days.tsx"),
      route("economy/feeding-days-for-donation", "./routes/print-reports/pages/economy/feeding-days-for-donation.tsx"),
      route("economy/inventory-deponated", "./routes/print-reports/pages/economy/inventory-deponated.tsx"),
      route("economy/feeding-days-seized", "./routes/print-reports/pages/economy/feeding-days-seized.tsx"),
      route("economy/region-inventory", "./routes/print-reports/pages/economy/region-inventory.tsx"),
      route("economy/region-inventory-all", "./routes/print-reports/pages/economy/region-inventory-all.tsx"),
      route("economy/section-inventory", "./routes/print-reports/pages/economy/section-inventory.tsx"),
      route("economy/contracts-by-number-mask", "./routes/print-reports/pages/economy/contracts-by-number-mask.tsx"),
      route("economy/contracts-by-date", "./routes/print-reports/pages/economy/contracts-by-date.tsx"),
      route("economy/economy-of-movement-overview", "./routes/print-reports/pages/economy/economy-of-movement-overview.tsx"),
      route("economy/economy-of-movement-recap", "./routes/print-reports/pages/economy/economy-of-movement-recap.tsx"),
      route("economy/economy-of-movement-transactions", "./routes/print-reports/pages/economy/economy-of-movement-transactions.tsx"),
      route("economy/seized-specimens", "./routes/print-reports/pages/economy/seized-specimens.tsx"),
      route("economy/seized-specimens-all", "./routes/print-reports/pages/economy/seized-specimens-all.tsx"),
      route("economy/seized-species", "./routes/print-reports/pages/economy/seized-species.tsx"),
      route("economy/seized-species-b", "./routes/print-reports/pages/economy/seized-species-b.tsx"),
      route("economy/economy-of-movement-summary", "./routes/print-reports/pages/economy/economy-of-movement-summary.tsx"),
      route("economy/deposit-inquiry-cz", "./routes/print-reports/pages/economy/deposit-inquiry-cz.tsx"),
      route("economy/deposit-inquiry-eng", "./routes/print-reports/pages/economy/deposit-inquiry-eng.tsx"),
      route("economy/envelope", "./routes/print-reports/pages/economy/envelope.tsx"),
      route("specimen/specimen-card-by-id", "./routes/print-reports/pages/specimen/specimen-card-by-id.tsx"),
      route("specimen/specimen-card-by-cz", "./routes/print-reports/pages/specimen/specimen-card-by-cz.tsx"),
      route("specimen/specimen-card-by-lat", "./routes/print-reports/pages/specimen/specimen-card-by-lat.tsx"),
      route("specimen/specimen-card-cr-evidence", "./routes/print-reports/pages/specimen/specimen-card-cr-evidence.tsx"),
      route("specimen/specimen-registered-eu-permit", "./routes/print-reports/pages/specimen/specimen-registered-eu-permit.tsx"),
      route("specimen/specimen-registration", "./routes/print-reports/pages/specimen/specimen-registration.tsx"),
      route("species/in-zoo", "./routes/print-reports/pages/species/in-zoo.tsx"),
      route("species/species-history", "./routes/print-reports/pages/species/species-history.tsx"),
      route("species/species-history-in-period", "./routes/print-reports/pages/species/species-history-in-period.tsx"),
      route("zoology/in-zoo-status", "./routes/print-reports/pages/zoology/in-zoo-status.tsx"),
      route("zoology/in-zoo-bulk", "./routes/print-reports/pages/zoology/in-zoo-bulk.tsx"),
      route("zoology/in-zoo-bulk-by-decision", "./routes/print-reports/pages/zoology/in-zoo-bulk-by-decision.tsx"),
      route("zoology/in-zoo-bulk-cr", "./routes/print-reports/pages/zoology/in-zoo-bulk-cr.tsx"),
      route("zoology/in-zoo-bulk-eu-fauna", "./routes/print-reports/pages/zoology/in-zoo-bulk-eu-fauna.tsx"),
      route("zoology/in-zoo-bulk-no-eu-reg-only", "./routes/print-reports/pages/zoology/in-zoo-bulk-no-eu-reg-only.tsx"),
      route("zoology/in-zoo-bulk-not-in-state", "./routes/print-reports/pages/zoology/in-zoo-bulk-not-in-state.tsx"),
      route("zoology/in-zoo-bulk-no-eu", "./routes/print-reports/pages/zoology/in-zoo-bulk-no-eu.tsx"),
      route("zoology/in-zoo-bulk-reg-only", "./routes/print-reports/pages/zoology/in-zoo-bulk-reg-only.tsx"),
      route("zoology/inventory-movements-with-influence", "./routes/print-reports/pages/zoology/inventory-movements-with-influence.tsx"),
      route("zoology/inventory-movements-no-influence", "./routes/print-reports/pages/zoology/inventory-movements-no-influence.tsx"),
      route("zoology/eu-fauna", "./routes/print-reports/pages/zoology/eu-fauna.tsx"),
      route("zoology/cr-protected", "./routes/print-reports/pages/zoology/cr-protected.tsx"),
      route("zoology/cr-decision-by-movement-date", "./routes/print-reports/pages/zoology/cr-decision-by-movement-date.tsx"),
      route("zoology/cr-evidence-by-movement-date", "./routes/print-reports/pages/zoology/cr-evidence-by-movement-date.tsx"),
      route("zoology/species-inventory", "./routes/print-reports/pages/zoology/species-inventory.tsx"),
      route("zoology/species-in-region", "./routes/print-reports/pages/zoology/species-in-region.tsx"),
      route("zoology/species-in-department", "./routes/print-reports/pages/zoology/species-in-department.tsx"),
      route("zoology/statistic-births", "./routes/print-reports/pages/zoology/statistic-births.tsx"),
      route("zoology/statistics-as-of-date", "./routes/print-reports/pages/zoology/statistics-as-of-date.tsx"),
      route("zoology/statistics-by-order", "./routes/print-reports/pages/zoology/statistics-by-order.tsx"),
      route("zoology/statistics-cadavers-table", "./routes/print-reports/pages/zoology/statistics-cadavers-table.tsx"),
      route("zoology/statistics-cadavers-overview", "./routes/print-reports/pages/zoology/statistics-cadavers-overview.tsx"),
      route("zoology/in-zoo-by-region", "./routes/print-reports/pages/zoology/in-zoo-by-region.tsx"),
      route("zoology/statistics-cadavers-by-species", "./routes/print-reports/pages/zoology/statistics-cadavers-by-species.tsx"),
      route("zoology/statistics-cadavers-by-location", "./routes/print-reports/pages/zoology/statistics-cadavers-by-location.tsx"),
      route("zoology/movement-in-zoo-by-date", "./routes/print-reports/pages/zoology/movement-in-zoo-by-date.tsx"),
      route("zoology/movement-in-zoo-by-species", "./routes/print-reports/pages/zoology/movement-in-zoo-by-species.tsx"),
      route("zoology/movement-in-zoo-by-region", "./routes/print-reports/pages/zoology/movement-in-zoo-by-region.tsx"),
      route("zoology/movement-in-zoo-by-partner", "./routes/print-reports/pages/zoology/movement-in-zoo-by-partner.tsx"),
      route("zoology/registrations-list-by-date", "./routes/print-reports/pages/zoology/registrations-list-by-date.tsx"),
      route("zoology/registrations-list-by-number", "./routes/print-reports/pages/zoology/registrations-list-by-number.tsx"),
      route("zoology/registrations-list-by-eu-permit", "./routes/print-reports/pages/zoology/registrations-list-by-eu-permit.tsx"),
      route("zoology/eu-divergence", "./routes/print-reports/pages/zoology/eu-divergence.tsx"),
      route("zoology/specimens-for-zims-at-date-range", "./routes/print-reports/pages/zoology/specimens-for-zims-at-date-range.tsx"),
      route("zoology/full-list-by-zims", "./routes/print-reports/pages/zoology/full-list-by-zims.tsx"),
      route("zoology/births-in-period", "./routes/print-reports/pages/zoology/births-in-period.tsx"),
      route("zoology/zoology-statistics-eep", "./routes/print-reports/pages/zoology/zoology-statistics-eep.tsx"),
      route("zoology/zoology-statistics-eep-mzp", "./routes/print-reports/pages/zoology/zoology-statistics-eep-mzp.tsx"),
      route("*", "./routes/print-reports/pages/dynamic-print-report.tsx")
    ]),

    route("exemplar-list", "./routes/exemplar-list/exemplar-list.tsx"),
    route("exemplar-list/export-xls", "./routes/exemplar-list/exemplar-list-export-xls.tsx"),

    route("lists/contracts", "./routes/lists/contracts/list.tsx", [
      route(":actionParam", "./routes/lists/contracts/detail.tsx")
    ]),

    route("lists/contracts/:contractId/movements", "./routes/lists/contracts/documents/movements-list.tsx", [
      route(":actionParam", "./routes/lists/contracts/documents/movements-detail.tsx")
    ]),

    route("lists/contracts/:contractId/actions", "./routes/lists/contracts/documents/actions-list.tsx", [
      route(":actionParam", "./routes/lists/contracts/documents/actions-detail.tsx")
    ]),

    route("lists/contracts/export-xls", "./routes/lists/contracts/contracts-export-xls.tsx"),
    route("lists/contracts/:contractId/movements-export-xls", "./routes/lists/contracts/documents/movements-export-xls.tsx"),
    route("lists/contracts/:contractId/actions-export-xls", "./routes/lists/contracts/documents/actions-export-xls.tsx"),

    route("lists/cadaver", "./routes/lists/cadaver/list.tsx", [
      route(":actionParam", "./routes/lists/cadaver/detail.tsx")
    ]),

    route("lists/cadaver/export-xls", "./routes/lists/cadaver/cadaver-export-xls.tsx"),

    route("lists/partners", "./routes/lists/partners/list.tsx", [
      route(":actionParam", "./routes/lists/partners/detail.tsx")
    ]),
    route("lists/partners/export-xls", "./routes/lists/partners/partners-export-xls.tsx"),

    route("lists/zoos", "./routes/lists/zoos/list.tsx", [
      route(":actionParam", "./routes/lists/zoos/detail.tsx")
    ]),
    route("lists/zoos/export-xls", "./routes/lists/zoos/zoos-export-xls.tsx"),

    // Enum lookups
    route("lists/birthmethods", "./routes/lists/birthmethods/list.tsx", [
      route(":actionParam", "./routes/lists/birthmethods/detail.tsx")
    ]),
    route("lists/rearings", "./routes/lists/rearings/list.tsx", [
      route(":actionParam", "./routes/lists/rearings/detail.tsx")
    ]),

    route("records", "./routes/records.tsx"),

    route("records/species-search", "./routes/records/taxonomy-hierarchy/species-search-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/species-search-detail.tsx")
    ]),

    route("records/phyla", "./routes/records/taxonomy-hierarchy/phyla/list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/phyla/detail.tsx")
    ]),

    route("records/phyla/export-xls", "./routes/records/taxonomy-hierarchy/phyla/export-xls.tsx"),

    route("records/phyla/:parentId/classes", "./routes/records/taxonomy-hierarchy/classes/classes-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/classes/classes-detail.tsx")
    ]),
    route("records/phyla/:parentId/classes/export-xls", "./routes/records/taxonomy-hierarchy/classes/export-xls.tsx"),
    route("records/classes/operations/move-classes", "./routes/records/taxonomy-hierarchy/classes/operations/move-classes.tsx"),

    route("records/classes/:parentId/orders", "./routes/records/taxonomy-hierarchy/orders/orders-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/orders/orders-detail.tsx")
    ]),
    route("records/classes/:parentId/orders/export-xls", "./routes/records/taxonomy-hierarchy/orders/export-xls.tsx"),
    route("records/orders/operations/move-orders", "./routes/records/taxonomy-hierarchy/orders/operations/move-orders.tsx"),

    route("records/orders/:parentId/families", "./routes/records/taxonomy-hierarchy/families/families-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/families/families-detail.tsx")
    ]),

    route("records/orders/:parentId/families/export-xls", "./routes/records/taxonomy-hierarchy/families/export-xls.tsx"),
    route("records/families/operations/move-families", "./routes/records/taxonomy-hierarchy/families/operations/move-families.tsx"),

    route("records/families/:parentId/genera", "./routes/records/taxonomy-hierarchy/genera/genera-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/genera/genera-detail.tsx")
    ]),

    route("records/families/:parentId/genera/export-xls", "./routes/records/taxonomy-hierarchy/genera/export-xls.tsx"),

    route('/records/genera/operations/move-genera', './routes/records/taxonomy-hierarchy/genera/operations/move-genera.tsx'),

    route("records/genera/:parentId/species", "./routes/records/taxonomy-hierarchy/species/species-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/species/species-detail.tsx")
    ]),

    route("records/genera/:parentId/species/export-xls", "./routes/records/taxonomy-hierarchy/species/export-xls.tsx"),

    route("records/species/operations/move-species", "./routes/records/taxonomy-hierarchy/species/operations/move-species.tsx"),
    route("records/species/operations/create-mass-specimen-records", "./routes/records/taxonomy-hierarchy/species/operations/create-mass-specimen-records.tsx"),

    route("records/species/:parentId/documents-export-xls", "./routes/records/taxonomy-hierarchy/species/export-documents.tsx"),
    route("records/species/:parentId/records-export-xls", "./routes/records/taxonomy-hierarchy/species/export-records.tsx"),
    
    route("records/species/:parentId/records", "./routes/records/taxonomy-hierarchy/species/records/list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/species/records/detail.tsx")
    ]),
    
    route("records/species/:parentId/documents", "./routes/records/taxonomy-hierarchy/species/documents/list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/species/documents/detail.tsx")
    ]),

    route("records/species/:parentId/specimens", "./routes/records/taxonomy-hierarchy/specimens/specimen-list.tsx", { id: 'records/species/specimens' }, [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/specimen-detail.tsx")
    ]),

    route("records/species/:parentId/specimens/export-xls", "./routes/records/taxonomy-hierarchy/specimens/export-xls.tsx"),

    route("records/specimens/operations/move-specimens", "./routes/records/taxonomy-hierarchy/specimens/operations/move-specimens.tsx"),
    route("records/specimens/operations/copy-specimen", "./routes/records/taxonomy-hierarchy/specimens/operations/copy-specimen.tsx"),
    route("records/specimens/operations/partial-copy-specimen", "./routes/records/taxonomy-hierarchy/specimens/operations/partial-copy-specimen.tsx"),

    route("records/specimens/autocomplete-specimen", "./routes/records/taxonomy-hierarchy/specimens/autocomplete-specimen.tsx"),
    route("records/specimens/autocomplete-species", "./routes/records/taxonomy-hierarchy/specimens/autocomplete-species.tsx"),
    route("records/specimens/autocomplete-contract", "./routes/records/taxonomy-hierarchy/specimens/autocomplete-contract.tsx"),

    route("records/specimens/:parentId/movements", "./routes/records/taxonomy-hierarchy/specimens/movements-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/movements-detail.tsx")      
    ]),

    route("records/specimens/:parentId/specimen-placements", "./routes/records/taxonomy-hierarchy/specimens/specimen-placements-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/specimen-placements-detail.tsx")
    ]),

    route("records/specimens/:parentId/records", "./routes/records/taxonomy-hierarchy/specimens/records-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/records-detail.tsx")
    ]),

    route("records/specimens/:parentId/markings", "./routes/records/taxonomy-hierarchy/specimens/markings-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/markings-detail.tsx")
    ]),

    route("records/specimens/:parentId/cadavers", "./routes/records/taxonomy-hierarchy/specimens/cadavers/list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/cadavers/detail.tsx")
    ]),

    route("records/specimens/:parentId/documents", "./routes/records/taxonomy-hierarchy/specimens/documents/list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/documents/detail.tsx")
    ]),
    
    route("records/specimens/:parentId/export-movements-xls", "./routes/records/taxonomy-hierarchy/specimens/export-movements-xls.tsx"),
    route("records/specimens/:parentId/export-records-xls", "./routes/records/taxonomy-hierarchy/specimens/export-records-xls.tsx"),
    route("records/specimens/:parentId/export-specimen-placements-xls", "./routes/records/taxonomy-hierarchy/specimens/export-specimen-placements-xls.tsx"),
    route("records/specimens/:parentId/export-markings-xls", "./routes/records/taxonomy-hierarchy/specimens/export-markings-xls.tsx"),
    route("records/specimens/:parentId/export-cadavers-xls", "./routes/records/taxonomy-hierarchy/specimens/export-cadavers-xls.tsx"),
    route("records/specimens/:parentId/export-documents-xls", "./routes/records/taxonomy-hierarchy/specimens/export-documents-xls.tsx"),

    route("records/specimens/:parentId/images", "./routes/records/taxonomy-hierarchy/specimens/images-list.tsx", [
      route(":actionParam", "./routes/records/taxonomy-hierarchy/specimens/images-detail.tsx")
    ]),

    route("records/org-hierarchy/districts-search-api", "./routes/records/organization-hierarchy/districts-search-api.tsx"),
    route("records/org-hierarchy/districts-search", "./routes/records/organization-hierarchy/districts-search-list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/districts-search-detail.tsx")
    ]),    

    route("records/org-hierarchy/departments", "./routes/records/organization-hierarchy/departments/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/departments/detail.tsx")
    ]),
    route("records/org-hierarchy/departments/export-xls", "./routes/records/organization-hierarchy/departments/export-xls.tsx"),

    route("records/workplaces/operations/move-workplaces", "./routes/records/organization-hierarchy/workplaces/operations/move-workplaces.tsx"),

    route("records/org-hierarchy/departments/:parentId/workplaces", "./routes/records/organization-hierarchy/workplaces/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/workplaces/detail.tsx")
    ]),
    route("records/org-hierarchy/departments/:parentId/workplaces/export-xls", "./routes/records/organization-hierarchy/workplaces/export-xls.tsx"),
    
    route("records/org-hierarchy/workplaces/:parentId/districts", "./routes/records/organization-hierarchy/districts/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/districts/detail.tsx")
    ]),
    route("records/districts/operations/move-districts", "./routes/records/organization-hierarchy/districts/operations/move-districts.tsx"),

    route("records/org-hierarchy/workplaces/:parentId/districts/export-xls", "./routes/records/organization-hierarchy/districts/export-xls.tsx"),

    route("records/org-hierarchy/districts/:parentId/locations", "./routes/records/organization-hierarchy/locations/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/locations/detail.tsx")
    ]),

    route("records/locations/operations/move-locations", "./routes/records/organization-hierarchy/locations/operations/move-locations.tsx"),

    route("records/org-hierarchy/districts/:parentId/locations/export-xls", "./routes/records/organization-hierarchy/locations/locations-export-xls.tsx"),

    route("records/org-hierarchy/locations/:parentId/species", "./routes/records/organization-hierarchy/species/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/species/detail.tsx")
    ]),
    
    route("records/org-hierarchy/locations/:parentId/species/export-xls", "./routes/records/organization-hierarchy/species/export-xls.tsx"),

    route("records/org-hierarchy/locations/:locationId/species/:speciesId/specimens", "./routes/records/organization-hierarchy/specimens/list.tsx", [
      route(":actionParam", "./routes/records/organization-hierarchy/specimens/detail.tsx")
    ]),

    route("records/org-hierarchy/locations/:locationId/species/:speciesId/specimens/export-xls", "./routes/records/organization-hierarchy/specimens/export-xls.tsx"),

    route("journal/journal-entries", "./routes/journal/journal-entries-list.tsx", [
      route("new", "./routes/journal/journal-entries-new.tsx"),
      route("detail/:id", "./routes/journal/journal-entries-detail.tsx")
    ]),

    route("journal/journal-entries-process-multiple", "./routes/journal/journal-entries-process-multiple.tsx"),

    route("journal/journal-base-data", "./routes/journal/journal-base-data.tsx"),
    route("journal/journal-species-by-district", "./routes/journal/journal-species-by-district.tsx"),
    route("journal/journal-specimens", "./routes/journal/journal-specimens.tsx"),

    route("journal/journal-export-xls", "./routes/journal/journal-export-xls.tsx"),

    route("records/exposition-hierarchy/locations-search-api", "./routes/records/exposition-hierarchy/locations-search-api.tsx"),
    route("records/exposition-hierarchy/locations-search", "./routes/records/exposition-hierarchy/locations-search-list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/locations-search-detail.tsx")
    ]),   

    route("records/exposition-hierarchy/areas", "./routes/records/exposition-hierarchy/areas/list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/areas/detail.tsx")
    ]),

    route("records/exposition-hierarchy/areas/export-xls", "./routes/records/exposition-hierarchy/areas/export-xls.tsx"),

    route("records/exposition-hierarchy/areas/:parentId/sets", "./routes/records/exposition-hierarchy/sets/list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/sets/detail.tsx")
    ]),

    route("records/exposition-hierarchy/areas/:parentId/sets/export-xls", "./routes/records/exposition-hierarchy/sets/export-xls.tsx"),

    route("records/exposition-hierarchy/sets/:parentId/locations", "./routes/records/exposition-hierarchy/locations/list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/locations/detail.tsx")
    ]),

    route("records/exposition-hierarchy/sets/:parentId/locations/export-xls", "./routes/records/exposition-hierarchy/locations/export-xls.tsx"),

    route("records/locations/operations/move-locations-exposition", "./routes/records/exposition-hierarchy/locations/operations/move-locations.tsx"),
    route("records/sets/operations/move-exposition-sets", "./routes/records/exposition-hierarchy/sets/operations/move-exposition-sets.tsx"),

    route("records/exposition-hierarchy/locations/:parentId/species", "./routes/records/exposition-hierarchy/species/list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/species/detail.tsx")
    ]),
    
    route("records/exposition-hierarchy/locations/:parentId/species/export-xls", "./routes/records/exposition-hierarchy/species/export-xls.tsx"),

    route("records/exposition-hierarchy/locations/:locationId/species/:speciesId/specimens", "./routes/records/exposition-hierarchy/specimens/list.tsx", [
      route(":actionParam", "./routes/records/exposition-hierarchy/specimens/detail.tsx")
    ]),

    route("records/exposition-hierarchy/locations/:locationId/species/:speciesId/specimens/export-xls", "./routes/records/exposition-hierarchy/specimens/export-xls.tsx"),
  ])
] satisfies RouteConfig;
