namespace PziApi.UserTableSettings;

public class Dtos
{
  public record SetSettingsRequest(
    string UserName,
    string TableId,
    string Settings
  );
}
