using PziApi.CrossCutting.Database;
using Microsoft.AspNetCore.OData;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;
using PziApi.CrossCutting.Auth;
using Microsoft.EntityFrameworkCore;
using PziApi.TaxonomyClasses;
using PziApi.TaxonomyOrders;
using PziApi.Specimens;
using PziApi.TaxonomyFamilies;
using PziApi.TaxonomyGenera;
using PziApi.Species;
using PziApi.Users;
using PziApi.Movements;
using PziApi.UserTableSettings;
using PziApi.SpeciesRecords;
using PziApi.SpeciesDocuments;
using PziApi.SpecimensRecords;
using Serilog;
using PziApi.SpecimensMarkings;
using PziApi.SpecimensCadavers;
using PziApi.SpecimensDocuments;
using PziApi.PrintExports;
using PziApi.Search;
using PziApi.Contracts;
using PziApi.OrganizationLevels;
using PziApi.Partners;
using PziApi.CadaverPartners;
using PziApi.Locations;
using PziApi.SpecimenPlacements;
using PziApi.TaxonomyPhyla;
using PziApi.CrossCutting.OData;
using PziApi.JournalCommon;
using PziApi.CrossCutting.Settings;
using PziApi.ExpositionAreas;
using PziApi.ExpositionSets;
using PziApi.SpecimenImages;
using PziApi.CrossCutting.Filters;
using PziApi.ContractActionss;
using PziApi.JournalEntries;
using PziApi.BirthMethods;
using PziApi.Zoos;
using PziApi.Rearings;

internal class Program
{
  static IEdmModel GetEdmModel()
  {
    var builder = new ODataConventionModelBuilder();

    builder.EntitySet<PziApi.Models.CadaverPartner>("CadaverPartners");
    builder.EntitySet<PziApi.Models.Cadaver>("Cadavers");
    builder.EntitySet<PziApi.Models.ClassificationType>("ClassificationTypes");
    builder.EntitySet<PziApi.Models.ContractActionInitiator>("ContractActionInitiators");
    builder.EntitySet<PziApi.Models.ContractActionType>("ContractActionTypes");
    builder.EntitySet<PziApi.Models.ContractAction>("ContractActions");
    builder.EntitySet<PziApi.Models.ContractMovementReason>("ContractMovementReasons");
    builder.EntitySet<PziApi.Models.ContractType>("ContractTypes");
    builder.EntitySet<PziApi.Models.Contract>("Contracts");
    builder.EntitySet<PziApi.Models.DecrementReason>("DecrementReasons");
    builder.EntitySet<PziApi.Models.DocumentSpecies>("DocumentSpecies");
    builder.EntitySet<PziApi.Models.DocumentSpecimen>("DocumentSpecimens");
    builder.EntitySet<PziApi.Models.EuCode>("EuCodes");
    builder.EntitySet<PziApi.Models.GenderType>("GenderTypes");
    builder.EntitySet<PziApi.Models.IncrementReason>("IncrementReasons");
    builder.EntitySet<PziApi.Models.BirthMethod>("BirthMethods");
    builder.EntitySet<PziApi.Models.Rearing>("Rearings");
    builder.EntitySet<PziApi.Models.MarkingType>("MarkingTypes");
    builder.EntitySet<PziApi.Models.Marking>("Markings");
    builder.EntitySet<PziApi.Models.Movement>("Movements");
    builder.EntitySet<PziApi.Models.Partner>("Partners");
    builder.EntitySet<PziApi.Models.Placement>("Placements");
    builder.EntitySet<PziApi.Models.RdbCode>("RdbCodes");
    builder.EntitySet<PziApi.Models.RecordActionType>("RecordActionTypes");
    builder.EntitySet<PziApi.Models.RecordSpecimen>("RecordSpecimens");
    builder.EntitySet<PziApi.Models.RecordSpecies>("RecordSpecies");
    builder.EntitySet<PziApi.Models.Region>("Regions");
    builder.EntitySet<PziApi.Models.Section>("Sections");
    builder.EntitySet<PziApi.Models.Species>("Species");
    builder.EntitySet<PziApi.Models.SpeciesCiteTypes>("SpeciesCiteTypes");
    builder.EntitySet<PziApi.Models.SpeciesDocumentType>("SpeciesDocumentTypes");
    builder.EntitySet<PziApi.Models.SpeciesProtectionType>("SpeciesProtectionTypes");
    builder.EntitySet<PziApi.Models.SpecimenDocumentType>("SpecimenDocumentTypes");
    builder.EntitySet<PziApi.Models.Specimen>("Specimens");
    builder.EntitySet<PziApi.Models.TaxonomyClass>("TaxonomyClasses");
    builder.EntitySet<PziApi.Models.TaxonomyOrder>("TaxonomyOrders");
    builder.EntitySet<PziApi.Models.TaxonomyFamily>("TaxonomyFamilies");
    builder.EntitySet<PziApi.Models.TaxonomyGenus>("TaxonomyGenera");
    builder.EntitySet<PziApi.Models.TaxonomyPhylum>("TaxonomyPhyla");
    builder.EntitySet<PziApi.Models.ZooStatus>("ZooStatuses");
    builder.EntitySet<PziApi.Models.Zoo>("Zoos");
    builder.EntitySet<PziApi.Models.UserTableSetting>("UserTableSettings");
    builder.EntitySet<PziApi.Models.ColorType>("ColorTypes");
    builder.EntitySet<PziApi.Models.Location>("Locations");
    builder.EntitySet<PziApi.Models.OrganizationLevel>("OrganizationLevels");
    builder.EntitySet<PziApi.Models.SpecimenPlacement>("SpecimenPlacements");
    builder.EntitySet<PziApi.Models.Journal.JournalActionType>("JournalActionTypes");
    builder.EntitySet<PziApi.Models.ExpositionArea>("ExpositionAreas");
    builder.EntitySet<PziApi.Models.ExpositionSet>("ExpositionSets");
    builder.EntitySet<PziApi.Models.UserFlaggedDistrict>("UserFlaggedDistricts");
    builder.EntitySet<PziApi.Models.UserFlaggedSpecies>("UserFlaggedSpecies");
    builder.EntitySet<PziApi.Models.SpecimenImage>("SpecimenImages");
    builder.EntitySet<PziApi.Models.OriginType>("OriginTypes");

    builder.EntityType<PziApi.Models.OrganizationLevel>()
        .Collection
        .Function("ForUser")
        .ReturnsCollectionFromEntitySet<PziApi.Models.OrganizationLevel>("OrganizationLevels");

    builder.EnableLowerCamelCase();

    return builder.GetEdmModel();
  }

  private static void RegisterEndpoints(WebApplication app)
  {
    app.RegisterTaxonomyPhylaEndpoints();
    app.RegisterTaxonomyClassesEndpoints();
    app.RegisterTaxonomyOrdersEndpoints();
    app.RegisterTaxonomyFamiliesEndpoints();
    app.RegisterTaxonomyGeneraEndpoints();
    app.RegisterSpecimensEndpoints();
    app.RegisterSpeciesEndpoints();
    app.RegisterUsersEndpoints();
    app.RegisterMovementsEndpoints();
    app.RegisterUserTableSettingsEndpoints();
    app.RegisterRecordSpeciesEndpoints();
    app.RegisterDocumentSpeciesEndpoints();
    app.RegisterSpecimensRecordsEndpoints();
    app.RegisterSpecimensMarkingsEndpoints();
    app.RegisterSpecimensCadaversEndpoints();
    app.RegisterSpecimensDocumentsEndpoints();
    app.RegisterPrintExportsEndpoints();
    app.RegisterPrintSearchEndpoints();
    app.RegisterContractsExportsEndpoints();
    app.RegisterOrganizationLevelsEndpoints();
    app.RegisterPartnersEndpoints();
    app.RegisterBirthMethodsEndpoints();
    app.RegisterZoosEndpoints();
    app.RegisterRearingsEndpoints();
    app.RegisterCadaverPartnersEndpoints();
    app.RegisterLocationsEndpoints();
    app.RegisterSpecimenPlacementsEndpoints();
    app.RegisterJournalCommonEndpoints();
    app.RegisterExpositionAreasEndpoints();
    app.RegisterExpositionSetsEndpoints();
    app.RegisterSpecimenImagesEndpoints();
    app.RegisterContractActionsExportsEndpoints();
    app.RegisterJournaEntriesEndpoints();
  }

  private static void Main(string[] args)
  {
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, configuration) =>
    {
      configuration.MinimumLevel.Information();
      configuration.WriteTo.Console();
    });

    builder.Services.AddDbContext<PziDbContext>((provider, options) =>
    {
      options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), sqlServerOptionsAction: sqlOptions =>
      {
        sqlOptions.CommandTimeout(240);
      });
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddOpenApiDocument(config =>
    {
      config.DocumentName = "PziAPI";
      config.Title = "PziApi v1";
      config.Version = "v1";

      config.AddSecurity("ApiKey", Enumerable.Empty<string>(), new NSwag.OpenApiSecurityScheme()
      {
        Type = NSwag.OpenApiSecuritySchemeType.ApiKey,
        Description = "ApiKey Authentication",
        Name = "X-API-Key",
        In = NSwag.OpenApiSecurityApiKeyLocation.Header
      });

      config.OperationProcessors.Add(new ODataOperationProcessor());
      config.OperationProcessors.Add(new RemoveODataQueryOptionsProcessor());
    });

    builder.Services.AddTransient<ApiKeyValidationMiddleware>();

    builder.Services.Configure<PermissionOptions>(builder.Configuration.GetSection(PermissionOptions.SectionName));

    builder.Services
      .AddControllers()
      .AddOData(options => options
        .Select()
        .Filter()
        .OrderBy()
        .SetMaxTop(1024)
        .Expand()
        .Count()
        .AddRouteComponents("odata", GetEdmModel()));

    var app = builder.Build();

    var swaggerEnabled = builder.Environment.IsDevelopment()
      || builder.Configuration.GetSection("Pzi:SwaggerEnabled").Get<bool>();
    var swaggerApiHost = builder.Configuration.GetSection("Pzi:SwaggerApiHost").Get<string>();

    if (swaggerEnabled)
    {
      app.UseOpenApi(options =>
      {
        if (!string.IsNullOrEmpty(swaggerApiHost))
        {
          options.PostProcess = (doc, httpRequest) =>
          {
            doc.Servers.Clear();

            doc.Servers.Add(new NSwag.OpenApiServer
            {
              Url = swaggerApiHost
            });
          };
        }
      });

      app.UseSwaggerUi(config =>
      {
        config.DocumentTitle = "PziAPI";
        config.Path = "/swagger";
        config.DocumentPath = "/swagger/{documentName}/swagger.json";
        config.DocExpansion = "list";

        config.ServerUrl = "https://metazoa-t.api.zoopraha.cz";
      });
    }

    app.UseMiddleware<ApiKeyValidationMiddleware>();

    RegisterEndpoints(app);

    app.MapControllers();

    app.Run();
  }
}