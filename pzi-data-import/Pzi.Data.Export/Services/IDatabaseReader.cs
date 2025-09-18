using System.Data;

namespace Pzi.Data.Export.Services
{
  public interface IDatabaseReader
  {
    public string SchemaName { get; }

    Task<List<string>> GetTablesAsync();
    Task<DataTable> LoadDataAsync(string tableName);
  }
}
