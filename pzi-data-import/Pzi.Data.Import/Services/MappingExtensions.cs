using System.Data;
using System.Reflection;

namespace Pzi.Data.Import.Services
{
    public static class MappingExtensions
    {
        public static DataTable ToDataTable<T>(this IEnumerable<T> items)
        {
            var tb = new DataTable(typeof(T).Name);

            PropertyInfo[] props = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

            foreach (var prop in props)
            {
              var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
              tb.Columns.Add(prop.Name, propType);
            }

            foreach (var item in items)
            {
                var values = new object[props.Length];
                for (var i = 0; i < props.Length; i++)
                {
                  var val = props[i].GetValue(item, null);
                  values[i] = val ?? DBNull.Value;
                }

                tb.Rows.Add(values);
            }

            return tb;
        }
    }
}
