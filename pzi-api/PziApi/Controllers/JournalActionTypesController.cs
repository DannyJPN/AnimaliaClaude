using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using PziApi.CrossCutting.Database;

namespace PziApi.Controllers;

public class JournalActionTypesController : ODataController
{
  private readonly PziDbContext _dbContext;

  public JournalActionTypesController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  public IActionResult Get()
  {
    return Ok(_dbContext.JournalActionTypes);
  }
}
