using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Formatter;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Controllers;

public class OrganizationLevelsController : ODataController
{
  private readonly PziDbContext _dbContext;

  public OrganizationLevelsController(PziDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  [EnableQuery]
  [HttpGet]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrganizationLevel>))]
  public IActionResult Get()
  {
    return Ok(_dbContext.OrganizationLevels);
  }

  [HttpGet("odata/OrganizationLevels/ForUser")]
  [EnableQuery]
  [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<OrganizationLevel>))]
  public IActionResult GetForUser([FromODataUri] string userName)
  {
    if (string.IsNullOrEmpty(userName))
    {
      return Ok(_dbContext.OrganizationLevels.Take(0));
    }

    var user = _dbContext.Users
      .Include(u => u.UserRoles)
      .FirstOrDefault(u => u.UserName == userName);

    if (user == null)
    {
      return Ok(_dbContext.OrganizationLevels.Take(0));
    }

    var userRoleNames = user.UserRoles?.Select(r => r.RoleName).ToList() ?? [];

    var filteredLevels = _dbContext.OrganizationLevels
      .Where(ol => userRoleNames.Contains(ol.JournalApproversGroup!)
        || userRoleNames.Contains(ol.JournalContributorGroup!)
        || userRoleNames.Contains(ol.JournalReadGroup!)
        || userRoleNames.Contains(ol.Parent!.JournalApproversGroup!)
        || userRoleNames.Contains(ol.Parent.JournalContributorGroup!)
        || userRoleNames.Contains(ol.Parent.JournalReadGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalApproversGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalContributorGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalReadGroup!));

    return Ok(filteredLevels);
  }
}
