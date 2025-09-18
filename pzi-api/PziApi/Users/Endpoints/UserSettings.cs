using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Users.Endpoints;

public class UserSettings
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, BadRequest, NotFound>> HandleUpdate([FromBody] Dtos.UserSettingsUpdateModel viewModel, PziDbContext dbContext)
  {
    if (viewModel.VisibleTaxonomyStatuses.Length == 0)
    {
      return TypedResults.BadRequest();
    }

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var user = await dbContext.Users
            .Include(u => u.FlaggedDistricts)
            .Include(u => u.FlaggedSpecies)
            .FirstOrDefaultAsync(u => u.UserName == viewModel.UserName);

      if (user == null)
      {
        return TypedResults.NotFound();
      }

      var modifiedAt = DateTimeHelpers.GetLastModifiedAt();

      user.VisibleTaxonomyStatuses = string.Join(",", viewModel.VisibleTaxonomyStatuses);
      user.TaxonomySearchByCz = viewModel.TaxonomySearchByCz;
      user.TaxonomySearchByLat = viewModel.TaxonomySearchByLat;

      var userFlaggedDistricts = user.FlaggedDistricts ?? [];

      var flaggedDistrictToDelete = userFlaggedDistricts
            .Where(ufd => !viewModel.FlaggedDistricts.Contains(ufd.DistrictId))
            .ToArray();

      var flaggedDistrictToAdd = viewModel.FlaggedDistricts
            .Where(dId => !userFlaggedDistricts.Any(ufd => ufd.DistrictId == dId))
            .Select(dId =>
            {
              return new UserFlaggedDistrict()
              {
                DistrictId = dId,
                ModifiedAt = modifiedAt,
                ModifiedBy = viewModel.UserName,
                UserId = user.Id
              };
            })
            .ToArray();

      var userFlaggedSpecies = user.FlaggedSpecies ?? [];

      var flaggedSpeciesToDelete = userFlaggedSpecies
            .Where(ufs => !viewModel.FlaggedSpecies.Contains(ufs.SpeciesId))
            .ToArray();

      var flaggedSpeciesToAdd = viewModel.FlaggedSpecies
          .Where(sId => !userFlaggedSpecies.Any(ufd => ufd.SpeciesId == sId))
           .Select(sId =>
            {
              return new UserFlaggedSpecies()
              {
                SpeciesId = sId,
                ModifiedAt = modifiedAt,
                ModifiedBy = viewModel.UserName,
                UserId = user.Id
              };
            })
          .ToArray();

      dbContext.UserFlaggedDistricts.RemoveRange(flaggedDistrictToDelete);
      dbContext.UserFlaggedSpecies.RemoveRange(flaggedSpeciesToDelete);

      await dbContext.UserFlaggedDistricts.AddRangeAsync(flaggedDistrictToAdd);
      await dbContext.UserFlaggedSpecies.AddRangeAsync(flaggedSpeciesToAdd);

      await dbContext.SaveChangesAsync();
      await tx.CommitAsync();
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult.DefaultResult()
      );
  }
}
