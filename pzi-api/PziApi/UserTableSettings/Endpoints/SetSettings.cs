using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.UserTableSettings.Endpoints;

public class SetSettings
{
  public static async Task<Results<Ok, BadRequest>> Handle([FromBody] Dtos.SetSettingsRequest viewModel, PziDbContext dbContext)
  {
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.UserName == viewModel.UserName);

    if (user == null)
    {
      return TypedResults.BadRequest();
    }

    var existingSettings = await dbContext.UserTableSettings
          .FirstOrDefaultAsync(s => s.TableId == viewModel.TableId && s.UserId == user.Id);

    if (existingSettings == null)
    {
      var newSettings = new UserTableSetting()
      {
        TableId = viewModel.TableId,
        UserId = user.Id,
        Settings = viewModel.Settings
      };

      dbContext.UserTableSettings.Add(newSettings);

      await dbContext.SaveChangesAsync();
    }
    else
    {
      existingSettings.Settings = viewModel.Settings;

      await dbContext.SaveChangesAsync();
    }

    return TypedResults.Ok();
  }
}
