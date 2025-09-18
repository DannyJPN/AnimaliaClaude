using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using PziApi.CrossCutting.Database;
using PziApi.Models;
using PziApi.Models.Journal;

namespace PziApi.Controllers;

public class SpecimenImagesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpecimenImagesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SpecimenImage>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpecimenImages);
  }
}

public class BirthMethodsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public BirthMethodsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<BirthMethod>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.BirthMethods);
  }
}

public class RearingsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RearingsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Rearing>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Rearings);
  }
}

public class CadaverPartnersController : ODataController
{
  private readonly PziDbContext _dbContext;

  public CadaverPartnersController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<CadaverPartner>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.CadaverPartners);
  }
}

public class CadaversController : ODataController
{
  private readonly PziDbContext _dbContext;

  public CadaversController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Cadaver>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Cadavers);
  }
}

public class ClassificationTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ClassificationTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ClassificationType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ClassificationTypes);
  }
}

public class ContractActionInitiatorsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractActionInitiatorsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ContractActionInitiator>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ContractActionInitiators);
  }
}

public class ContractActionTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractActionTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ContractActionType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ContractActionTypes);
  }
}

public class ContractActionsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractActionsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ContractAction>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ContractActions);
  }
}

public class ContractMovementReasonsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractMovementReasonsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ContractMovementReason>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ContractMovementReasons);
  }
}

public class ContractTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ContractType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ContractTypes);
  }
}

public class ContractsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ContractsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Contract>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Contracts);
  }
}

public class DecrementReasonsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public DecrementReasonsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DecrementReason>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.DecrementReasons);
  }
}

public class DocumentSpeciesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public DocumentSpeciesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DocumentSpecies>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.DocumentSpecies);
  }
}

public class DocumentSpecimensController : ODataController
{
  private readonly PziDbContext _dbContext;

  public DocumentSpecimensController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<DocumentSpecimen>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.DocumentSpecimens);
  }
}


public class EuCodesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public EuCodesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<EuCode>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.EuCodes);
  }
}

public class GenderTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public GenderTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<GenderType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.GenderTypes);
  }
}

public class IncrementReasonsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public IncrementReasonsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<IncrementReason>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.IncrementReasons);
  }
}

public class MarkingsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public MarkingsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Marking>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Markings);
  }
}

public class MarkingTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public MarkingTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<MarkingType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.MarkingTypes);
  }
}

public class MovementsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public MovementsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Movement>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Movements);
  }
}

public class PartnersController : ODataController
{
  private readonly PziDbContext _dbContext;

  public PartnersController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Partner>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Partners);
  }
}

public class PlacementsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public PlacementsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Placement>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Placements);
  }
}

public class RdbCodesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RdbCodesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<RdbCode>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.RdbCodes);
  }
}

public class RecordActionTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RecordActionTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<RecordActionType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.RecordActionTypes);
  }
}

public class RecordSpecimensController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RecordSpecimensController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<RecordSpecimen>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.RecordSpecimens);
  }
}

public class RecordSpeciesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RecordSpeciesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<RecordSpecies>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.RecordSpecies);
  }
}

public class RegionsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public RegionsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Region>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Regions);
  }
}

public class SectionsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SectionsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Section>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Sections);
  }
}

public class SpeciesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpeciesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<PziApi.Models.Species>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Species);
  }
}

public class SpeciesCiteTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpeciesCiteTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<PziApi.Models.SpeciesCiteTypes>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpeciesCiteTypes);
  }
}


public class SpeciesDocumentTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpeciesDocumentTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SpeciesDocumentType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpeciesDocumentTypes);
  }
}

public class SpeciesProtectionTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpeciesProtectionTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SpeciesProtectionType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpeciesProtectionTypes);
  }
}

public class SpecimensController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpecimensController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Specimen>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Specimens);
  }
}

public class SpecimenDocumentTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpecimenDocumentTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SpecimenDocumentType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpecimenDocumentTypes);
  }
}

public class TaxonomyPhylaController : ODataController
{
  private readonly PziDbContext _dbContext;

  public TaxonomyPhylaController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaxonomyPhylum>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.TaxonomyPhyla);
  }
}

public class TaxonomyClassesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public TaxonomyClassesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaxonomyClass>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.TaxonomyClasses);
  }
}

public class TaxonomyOrdersController : ODataController
{
  private readonly PziDbContext _dbContext;

  public TaxonomyOrdersController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaxonomyOrder>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.TaxonomyOrders);
  }
}

public class TaxonomyFamiliesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public TaxonomyFamiliesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaxonomyFamily>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.TaxonomyFamilies);
  }
}

public class TaxonomyGeneraController : ODataController
{
  private readonly PziDbContext _dbContext;

  public TaxonomyGeneraController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<TaxonomyGenus>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.TaxonomyGenera);
  }
}

public class ZooStatusesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ZooStatusesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ZooStatus>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ZooStatuses);
  }
}

public class ZoosController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ZoosController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Zoo>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Zoos);
  }
}

public class UserTableSettingsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public UserTableSettingsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserTableSetting>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.UserTableSettings);
  }
}

public class ColorTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ColorTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<ColorType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.ColorTypes);
  }
}

public class LocationsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public LocationsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Location>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.Locations);
  }
}

public class SpecimenPlacementsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public SpecimenPlacementsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<SpecimenPlacement>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.SpecimenPlacements);
  }
}

public class JournalEntriesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public JournalEntriesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<JournalEntry>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.JournalEntries);
  }
}

public class UserFlaggedDistrictsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public UserFlaggedDistrictsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserFlaggedDistrict>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.UserFlaggedDistricts);
  }
}

public class UserFlaggedSpeciesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public UserFlaggedSpeciesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserFlaggedSpecies>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.UserFlaggedSpecies);
  }
}

public class OriginTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public OriginTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OriginType>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.OriginTypes);
  }
}
