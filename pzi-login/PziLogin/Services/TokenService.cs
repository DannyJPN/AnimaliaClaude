using Microsoft.IdentityModel.Tokens;
using PziLogin.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PziLogin.Services;

public class TokenService
{
  private readonly string secretKey;
  private readonly string issuer;
  private readonly string audience;
  private readonly int expirySeconds;
  private readonly byte[] encodedKey;
  private readonly int accessTokenExpirySeconds;

  public TokenService(
    string secretKey,
    string issuer,
    string audience,
    int expirySeconds,
    int accessTokenExpirySeconds
  )
  {
    this.secretKey = secretKey;
    this.issuer = issuer;
    this.audience = audience;
    this.expirySeconds = expirySeconds;
    this.encodedKey = Encoding.UTF8.GetBytes(secretKey);
    this.accessTokenExpirySeconds = accessTokenExpirySeconds;
  }

  public async Task<string> GetAccessToken(string userName)
  {
    var tokenHandler = new JwtSecurityTokenHandler();

    var claims = new List<Claim> {
          new Claim(ClaimTypes.Name, userName)
        };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims),
      Expires = DateTime.UtcNow.AddSeconds(this.accessTokenExpirySeconds),
      Issuer = issuer,
      Audience = audience,
      SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(this.encodedKey), SecurityAlgorithms.HmacSha256Signature)
    };

    var accessToken = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(accessToken);

    return await Task.FromResult(tokenString);
  }

  public async Task<string> GetTokenFromUserData(AdUserData userData)
  {
    var tokenHandler = new JwtSecurityTokenHandler();

    var claims = new List<Claim> {
          new Claim(ClaimTypes.Name, userData.UserName)
        };

    foreach (var group in userData.Groups)
    {
      claims.Add(new Claim(ClaimTypes.Role, group));
    }

    var tokenDescriptor = new SecurityTokenDescriptor
    {
      Subject = new ClaimsIdentity(claims),
      Expires = DateTime.UtcNow.AddSeconds(this.expirySeconds),
      Issuer = issuer,
      Audience = audience,
      SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(this.encodedKey), SecurityAlgorithms.HmacSha256Signature)
    };

    var securityToken = tokenHandler.CreateToken(tokenDescriptor);
    var tokenString = tokenHandler.WriteToken(securityToken);

    return await Task.FromResult(tokenString);
  }

  public List<Claim> GetTokenClaims(string token)
  {
    var tokenHandler = new JwtSecurityTokenHandler();

    var originToken = tokenHandler.ReadJwtToken(token);

    return originToken.Claims.ToList();
  }
}
