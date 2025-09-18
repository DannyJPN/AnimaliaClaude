using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PziLogin.Models;
using PziLogin.Services;
using System.Security.Claims;

namespace PziLogin.Controllers;

[AllowAnonymous]
public class AuthenticateController : Controller
{
  private readonly ActiveDirectoryService adSvc;
  private readonly TokenService tokenSvc;

  public AuthenticateController(ActiveDirectoryService adSvc, TokenService tokenSvc)
  {
    this.adSvc = adSvc;
    this.tokenSvc = tokenSvc;
  }

  //[HttpGet]
  //[Obsolete("SSO login")]
  //public async Task<IActionResult> Sso(string callback, string returnUrl)
  //{
  //  var userName = string.Join("\\", User.Claims.FirstOrDefault(c => c.Type.EndsWith("name")).Value.Split("\\").Skip(1));

  //  var token = await tokenSvc.GetAccessToken(userName);
  //  var redirectUrl = BuildRedirectUrl(callback, token, returnUrl);

  //  return Ok(new
  //  {
  //    redirectUrl = redirectUrl
  //  });
  //}

  [HttpGet, AllowAnonymous]
  public async Task<IActionResult> Login(string callback, string returnUrl)
  {
    try
    {
      var authResult = await HttpContext.AuthenticateAsync(NegotiateDefaults.AuthenticationScheme);
      if (authResult.Succeeded && authResult.Principal?.Identity?.IsAuthenticated == true)
      {
        var userName = string.Join("\\", User.Claims.FirstOrDefault(c => c.Type.EndsWith("name"))?.Value.Split("\\").Skip(1));
        if (!string.IsNullOrEmpty(userName))
        {
          var token = await tokenSvc.GetAccessToken(userName);
          var redirectUrl = BuildRedirectUrl(callback, token, returnUrl);

          return Redirect(redirectUrl);
        }
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"SSO failed: {ex.Message}");
    }

    return View(new LoginViewModel()
    {
      Callback = callback,
      ReturnUrl = returnUrl
    });
  }

  [HttpPost, AllowAnonymous]
  public async Task<IActionResult> Login(LoginViewModel input)
  {
    if (string.IsNullOrEmpty(input.UserName) || string.IsNullOrEmpty(input.Password))
    {
      return View(input);
    }

    var isValid = adSvc.VerifyUser(input.UserName, input.Password);
    if (!isValid)
    {
      return View(input);
    }

    var token = await tokenSvc.GetAccessToken(input.UserName);

    return Redirect(BuildRedirectUrl(input.Callback, token, input.ReturnUrl));
  }

  [HttpPost, AllowAnonymous]
  public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
  {
    if (string.IsNullOrEmpty(request.Token))
    {
      return BadRequest("Token is required.");
    }

    var tokenClaims = tokenSvc.GetTokenClaims(request.Token);
    var userName = tokenClaims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
        ?? tokenClaims.FirstOrDefault(c => c.Type == "unique_name")?.Value;
    if (userName == null)
    {
      return BadRequest("Cannot retreive user name from the token.");
    }

    var userData = adSvc.LoadUserData(userName);

    var token = await tokenSvc.GetTokenFromUserData(userData);

    return Ok(new { token });
  }

  public static string BuildRedirectUrl(string callback, string token, string? returnUrl)
  {
    return $"{callback}?token={token}&returnUrl={returnUrl}";
  }
}
