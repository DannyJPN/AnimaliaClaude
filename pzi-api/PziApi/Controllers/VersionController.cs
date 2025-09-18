using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace PziApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VersionController : ControllerBase
    {
        [HttpGet("full")]
        public IActionResult GetFullVersion()
        {
            var version = Environment.GetEnvironmentVariable("APP_VERSION_FULL");
            if (string.IsNullOrEmpty(version))
            {
                version = Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? "N/A";
            }
            return Ok(new { version });
        }

        [HttpGet("short")]
        public IActionResult GetShortVersion()
        {
            var version = Environment.GetEnvironmentVariable("APP_VERSION_SHORT");
            if (string.IsNullOrEmpty(version))
            {
                version = Assembly.GetEntryAssembly()?.GetName().Version?.ToString() ?? "N/A";
            }
            return Ok(new { version });
        }
    }
}