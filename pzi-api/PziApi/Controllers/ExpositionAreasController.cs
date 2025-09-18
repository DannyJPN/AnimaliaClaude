using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Controllers;

public class ExpositionAreasController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ExpositionAreasController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  public IActionResult Get()
  {
    return Ok(_dbContext.ExpositionAreas);
  }
}
