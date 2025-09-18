namespace PziLogin.Models;

public class LoginViewModel
{
  public required string Callback { get; set; }
  public string? ReturnUrl { get; set; }
  public string? UserName { get; set; }
  public string? Password { get; set; }
}
