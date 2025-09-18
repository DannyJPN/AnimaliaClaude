namespace PziApi.CrossCutting.Auth;

public class ApiKeyValidationMiddleware : IMiddleware
{
  private readonly IConfiguration _configuration;

  public ApiKeyValidationMiddleware(IConfiguration configuration) => _configuration = configuration;

  public async Task InvokeAsync(HttpContext context, RequestDelegate next)
  {
    var apiKey = context.Request.Headers["X-API-Key"].ToString();
    var apiKeys = _configuration.GetSection("Pzi:ApiKeys").Get<string[]>();

    var isApiKeyvalid = !string.IsNullOrEmpty(apiKey)
      && apiKeys != null
      && apiKeys.Contains(apiKey);

    if (!isApiKeyvalid)
    {
      context.Response.StatusCode = 401;
      return;
    }

    await next(context);
  }
}