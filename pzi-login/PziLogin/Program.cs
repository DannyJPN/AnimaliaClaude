using System.Runtime.ConstrainedExecution;
using Microsoft.AspNetCore.Authentication.Negotiate;
using PziLogin.Services;
using Serilog;

// NOTE: Test code to verify AD connection
if (args.Length > 0)
{
  int ERROR_LOGON_FAILURE = 0x31;

  var authType = Enum.Parse(typeof(System.DirectoryServices.Protocols.AuthType), args[3]);
  var credentials = new System.Net.NetworkCredential(args[1], args[2], args[0]);
  var adIdentifier = new System.DirectoryServices.Protocols.LdapDirectoryIdentifier(args[0]);

  using (var connection = new System.DirectoryServices.Protocols.LdapConnection(adIdentifier, credentials, System.DirectoryServices.Protocols.AuthType.Digest))
  {
    connection.SessionOptions.Sealing = true;
    connection.SessionOptions.Signing = true;

    try
    {
      connection.Bind();
    }
    catch (System.DirectoryServices.Protocols.LdapException lEx)
    {
      if (ERROR_LOGON_FAILURE == lEx.ErrorCode)
      {
        Console.WriteLine("Bad credentials");
      }

      throw;
    }
  }

  Console.WriteLine("OK");

  return;
}

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, configuration) => {
  configuration.MinimumLevel.Information();
  configuration.WriteTo.Console();
});

builder.Services.Configure<IISOptions>(options =>
{
  options.ForwardClientCertificate = true;
  options.AutomaticAuthentication = false;
});

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
  .AddNegotiate(options =>
  {
  });

builder.Services.AddAuthorization((options) =>
{
  options.FallbackPolicy = options.DefaultPolicy;
});

builder.Services.AddTransient((provider) =>
{
  var configuration = provider.GetRequiredService<IConfiguration>();

  return new ActiveDirectoryService(
    configuration.GetSection("Pzi:AdAddress").Get<string>()!,
    configuration.GetSection("Pzi:AdLogin").Get<string>()!,
    configuration.GetSection("Pzi:AdPassword").Get<string>()!,
    configuration.GetSection("Pzi:AdSearchBase").Get<string>()!,
    provider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<ActiveDirectoryService>>()
  );
});

builder.Services.AddTransient((provider) =>
{
  var configuration = provider.GetRequiredService<IConfiguration>();

  return new TokenService(
    configuration.GetSection("Pzi:TokenSecret").Get<string>()!,
    configuration.GetSection("Pzi:TokenIssuer").Get<string>()!,
    configuration.GetSection("Pzi:TokenAudience").Get<string>()!,
    36000,
    60
  );
});

var app = builder.Build();

app.UseDeveloperExceptionPage();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
  // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
  app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller}/{action}/{id?}");

app.Run();
