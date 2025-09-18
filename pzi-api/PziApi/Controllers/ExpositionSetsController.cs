using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Controllers;

public class ExpositionSetsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public ExpositionSetsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  public IActionResult Get()
  {
    return Ok(_dbContext.ExpositionSets.Include(x => x.ExpositionArea));
  }
}
