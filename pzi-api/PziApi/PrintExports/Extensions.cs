using PziApi.PrintExports.Endpoints;

namespace PziApi.PrintExports;
public static class Extensions
{
  public static void RegisterPrintExportsEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/PrintExports")
      .WithTags("PrintExports");

    endpoints.MapPost("/InZooStatus", InZooStatus.Handle);
    endpoints.MapPost("/InZooBulk", InZooBulk.Handle);
    endpoints.MapPost("/InZooBulkNotInState", InZooBulkNotInState.Handle);
    endpoints.MapPost("/InZooBulkByDecision", InZooBulkByDecision.Handle);
    endpoints.MapPost("/InZooBulkNoEuPermit", InZooBulkNoEuPermit.Handle);
    endpoints.MapPost("/InZooBulkNoEuPermitRegOnly", InZooBulkNoEuPermitRegOnly.Handle);
    endpoints.MapPost("/InZooBulkEuFauna", InZooBulkEuFauna.Handle);
    endpoints.MapPost("/SpecimenCard", SpecimenCard.Handle);
    endpoints.MapPost("/SpecimenCardCrEvidence", SpecimenCardCrEvidence.Handle);
    endpoints.MapGet("/SpeciesHistory/{speciesId}", SpeciesHistory.Handle);
    endpoints.MapGet("/SpeciesNote/{speciesId}", SpeciesNote.Handle);
    endpoints.MapGet("/SpeciesInZoo/{speciesId}", SpeciesInZoo.Handle);
    endpoints.MapPost("/SpeciesInZooByOrgLevel", SpeciesInZooByOrgLevel.Handle);
    endpoints.MapPost("/FeedingDaysForFunding", FeedingDaysForFunding.Handle);
    endpoints.MapPost("/InventoryMovements", InventoryMovements.Handle);
    endpoints.MapPost("/FeedingDays", FeedingDays.Handle);
    endpoints.MapPost("/SeizedSpecies", SeizedSpecies.Handle);
    endpoints.MapPost("/SeizedSpecimens", SeizedSpecimens.Handle);
    endpoints.MapPost("/SeizedSpecimensAll", SeizedSpecimensAll.Handle);
    endpoints.MapPost("/FeedingDaysSeized", FeedingDaysSeized.Handle);
    endpoints.MapPost("/SpeciesInventory", SpeciesInventory.Handle);
    endpoints.MapPost("/InventoryDeponated", InventoryDeponated.Handle);
    endpoints.MapPost("/ProtectedAndEuFaunaSpeciesList", ProtectedAndEuFaunaSpeciesList.Handle);
    endpoints.MapPost("/RegionInventory", RegionInventory.Handle);
    endpoints.MapPost("/SpecimenRegisteredEUPermit", SpecimenRegisteredEUPermit.Handle);
    endpoints.MapPost("/StatisticBirths", StatisticBirths.Handle);
    endpoints.MapPost("/CRDecisionByMovementDate", CRDecisionByMovementDate.Handle);
    endpoints.MapPost("/CREvidenceByMovementDate", CREvidenceByMovementDate.Handle);
    endpoints.MapPost("/StatisticsByOrder", StatisticsByOrder.Handle);
    endpoints.MapPost("/StatistikaCadaversInPeriod", StatistikaCadaversInPeriod.Handle);
    endpoints.MapPost("/MovementInZooByDate", MovementInZooByDate.Handle);
    endpoints.MapPost("/MovementInZooByRegion", MovementInZooByRegion.Handle);
    endpoints.MapPost("/RegistrationExportByNumbers", RegistrationExportByNumbers.Handle);
    endpoints.MapPost("/RegistrationExportByDate", RegistrationExportByDate.Handle);
    endpoints.MapPost("/RegistrationExportByEuPermit", RegistrationExportByEuPermit.Handle);
    endpoints.MapPost("/EconomyMovementOverview", EconomyMovementOverview.Handle);
    endpoints.MapPost("/EconomyMovementRecap", EconomyMovementRecap.Handle);
    endpoints.MapPost("/EconomyMovementSummary", EconomyMovementSummary.Handle);
    endpoints.MapPost("/EconomyMovementTransactions", EconomyMovementTransactions.Handle);
    endpoints.MapPost("/ZoologySpeciesListEuDivergence", ZoologySpeciesListEuDivergence.Handle);
    endpoints.MapPost("/ZoologySpecimensForArksInTimeRange", ZoologySpecimensForArksInTimeRange.Handle);
    endpoints.MapPost("/SpecimensBornInTimeRange", SpecimensBornInTimeRange.Handle);
    endpoints.MapPost("/SpecimensByZimsRange", SpecimensByZimsRange.Handle);
    endpoints.MapPost("/MovementInZooByPartner", MovementInZooByPartner.Handle);
    endpoints.MapPost("/ContractsOverview", ContractsOverview.Handle);
    endpoints.MapPost("/MovementInZooBySpecies", MovementInZooBySpecies.Handle);
    endpoints.MapPost("/ZoologyStatisticsEep", ZoologyStatisticsEep.Handle);
    endpoints.MapPost("/InZooByRegion", InZooByRegion.Handle);
    endpoints.MapPost("/SpecimenDescendants", SpecimenDescendants.Handle);
    endpoints.MapPost("/SpecimenGenealogyTree", SpecimenGenealogyTree.Handle);
    endpoints.MapPost("/DepositInquiry", DepositInquiry.Handle);
    endpoints.MapPost("/CorrespondenceEnvelope", CorrespondenceEnvelope.Handle);
  }
}
