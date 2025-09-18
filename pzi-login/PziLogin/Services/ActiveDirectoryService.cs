using System.DirectoryServices.Protocols;
using System.Net;
using PziLogin.Models;

namespace PziLogin.Services;

public class ActiveDirectoryService
{
  private const int ERROR_LOGON_FAILURE = 0x31;

  private readonly string adAddress;
  private readonly string adLogin;
  private readonly string adPassword;
  private readonly string adSearchBase;
  private readonly ILogger logger;

  public ActiveDirectoryService(string adAddress, string adLogin, string adPassword, string adSearchBase, ILogger logger)
  {
    this.adAddress = adAddress;
    this.adLogin = adLogin;
    this.adPassword = adPassword;
    this.adSearchBase = adSearchBase;
    this.logger = logger;
  }

  public bool VerifyUser(string userName, string password)
  {
    var credentials = new NetworkCredential(userName, password, this.adAddress);
    var adIdentifier = new LdapDirectoryIdentifier(this.adAddress);

    using (var connection = new LdapConnection(adIdentifier, credentials, AuthType.Kerberos))
    {
      connection.SessionOptions.Sealing = true;
      connection.SessionOptions.Signing = true;

      try
      {
        connection.Bind();
      }
      catch (LdapException lEx)
      {
        if (ERROR_LOGON_FAILURE == lEx.ErrorCode)
        {
          logger.LogInformation("Cannot verify user, details {LoginDetails}", new
          {
            VerifyError = lEx.Message,
            VerifyUser = userName
          });

          return false;
        }

        throw;
      }
    }

    return true;
  }

  public AdUserData LoadUserData(string userName)
  {
    var userGroups = new List<string>();

    var credentials = new NetworkCredential(adLogin, adPassword, adAddress);
    var id = new LdapDirectoryIdentifier(adAddress);

    using (LdapConnection connection = new LdapConnection(id, credentials, AuthType.Kerberos))
    {
      connection.SessionOptions.Sealing = true;
      connection.SessionOptions.Signing = true;
      connection.Bind();

      var searchFilter = $"(samAccountName={userName})";

      var searchRequest = new SearchRequest(
          adSearchBase,
          searchFilter,
          SearchScope.Subtree,
          new[] { "memberOf" }
      );

      var searchResponse = (SearchResponse)connection.SendRequest(searchRequest);

      foreach (SearchResultEntry entry in searchResponse.Entries)
      {
        if (entry.Attributes.Contains("memberOf"))
        {
          var groups = entry.Attributes["memberOf"];

          foreach (var group in groups)
          {
            var groupBytes = group as System.Byte[];
            if (groupBytes == null)
            {
              continue;
            }

            var groupName = System.Text.Encoding.UTF8.GetString(groupBytes);

            userGroups.Add(groupName);
          }
        }
      }
    }

    return new AdUserData
    {
      UserName = userName,
      Groups = userGroups.ToArray()
    };
  }
}
