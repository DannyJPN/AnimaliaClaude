namespace PziLogin.Models;

public class AdUserData
{
  public required string UserName { get; set; }
  public string[] Groups { get; set; } = [];
}
