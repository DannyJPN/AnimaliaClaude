using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PziApi.CrossCutting.Database;
using PziApi.Models.SuperAdmin;
using System.Text.Csv;
using OfficeOpenXml;

namespace PziApi.Services.SuperAdmin;

public class SuperAdminAuditService : ISuperAdminAuditService
{
    private readonly PziDbContext _dbContext;
    private readonly ILogger<SuperAdminAuditService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly string _integritySecret;

    public SuperAdminAuditService(
        PziDbContext dbContext,
        ILogger<SuperAdminAuditService> logger,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _integritySecret = configuration["SuperAdmin:AuditIntegritySecret"] ?? "default-secret-change-in-production";
    }

    public async Task LogOperationAsync(
        string operation,
        string entityType,
        string? entityId,
        string performedBy,
        string correlationId,
        object? beforeData = null,
        object? afterData = null,
        string? context = null,
        string severity = "Info",
        string? tenantId = null,
        string? impersonatedTenantId = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var auditLog = new SuperAdminAuditLog
            {
                Operation = operation,
                EntityType = entityType,
                EntityId = entityId,
                PerformedBy = performedBy,
                UserAgent = httpContext?.Request.Headers["User-Agent"].ToString() ?? "unknown",
                IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                CorrelationId = correlationId,
                TenantId = tenantId,
                ImpersonatedTenantId = impersonatedTenantId,
                BeforeData = beforeData != null ? JsonSerializer.Serialize(beforeData) : null,
                AfterData = afterData != null ? JsonSerializer.Serialize(afterData) : null,
                AdditionalContext = context,
                Severity = severity,
                Timestamp = DateTime.UtcNow
            };

            // Compute integrity hash
            auditLog.IntegrityHash = ComputeIntegrityHash(auditLog);

            _dbContext.Set<SuperAdminAuditLog>().Add(auditLog);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Audit log created: {Operation} by {PerformedBy} for {EntityType}:{EntityId}",
                operation, performedBy, entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create audit log for operation: {Operation}", operation);
            // Audit logging failure should not break the main operation
        }
    }

    public async Task<(IEnumerable<SuperAdminAuditLog> logs, int totalCount)> GetAuditLogsAsync(
        string? operation = null,
        string? entityType = null,
        string? performedBy = null,
        string? tenantId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? severity = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _dbContext.Set<SuperAdminAuditLog>().AsQueryable();

        if (!string.IsNullOrEmpty(operation))
            query = query.Where(l => l.Operation.Contains(operation));

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(l => l.EntityType == entityType);

        if (!string.IsNullOrEmpty(performedBy))
            query = query.Where(l => l.PerformedBy.Contains(performedBy));

        if (!string.IsNullOrEmpty(tenantId))
            query = query.Where(l => l.TenantId == tenantId || l.ImpersonatedTenantId == tenantId);

        if (fromDate.HasValue)
            query = query.Where(l => l.Timestamp >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(l => l.Timestamp <= toDate.Value);

        if (!string.IsNullOrEmpty(severity))
            query = query.Where(l => l.Severity == severity);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (logs, totalCount);
    }

    public async Task<string> ExportAuditLogsAsync(
        string format,
        string? operation = null,
        string? entityType = null,
        string? performedBy = null,
        string? tenantId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? severity = null)
    {
        var (logs, _) = await GetAuditLogsAsync(
            operation, entityType, performedBy, tenantId,
            fromDate, toDate, severity, 1, int.MaxValue);

        var fileName = $"audit-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}";

        switch (format.ToLower())
        {
            case "csv":
                return await ExportToCsvAsync(logs, $"{fileName}.csv");
            case "json":
                return await ExportToJsonAsync(logs, $"{fileName}.json");
            case "excel":
                return await ExportToExcelAsync(logs, $"{fileName}.xlsx");
            default:
                throw new ArgumentException($"Unsupported export format: {format}");
        }
    }

    public async Task<bool> ValidateAuditIntegrityAsync(long logId)
    {
        var log = await _dbContext.Set<SuperAdminAuditLog>()
            .FirstOrDefaultAsync(l => l.Id == logId);

        if (log == null)
            return false;

        var computedHash = ComputeIntegrityHash(log);
        return computedHash == log.IntegrityHash;
    }

    public async Task<Dictionary<string, object>> GetAuditStatisticsAsync(
        DateTime fromDate,
        DateTime toDate,
        string? tenantId = null)
    {
        var query = _dbContext.Set<SuperAdminAuditLog>()
            .Where(l => l.Timestamp >= fromDate && l.Timestamp <= toDate);

        if (!string.IsNullOrEmpty(tenantId))
            query = query.Where(l => l.TenantId == tenantId || l.ImpersonatedTenantId == tenantId);

        var totalOperations = await query.CountAsync();

        var operationsByType = await query
            .GroupBy(l => l.Operation)
            .Select(g => new { Operation = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        var operationsBySeverity = await query
            .GroupBy(l => l.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync();

        var operationsByUser = await query
            .GroupBy(l => l.PerformedBy)
            .Select(g => new { User = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        var dailyActivity = await query
            .GroupBy(l => l.Timestamp.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var securityAlerts = await query
            .Where(l => l.Severity == "Critical" || l.Severity == "Warning")
            .CountAsync();

        return new Dictionary<string, object>
        {
            ["totalOperations"] = totalOperations,
            ["operationsByType"] = operationsByType,
            ["operationsBySeverity"] = operationsBySeverity,
            ["operationsByUser"] = operationsByUser,
            ["dailyActivity"] = dailyActivity,
            ["securityAlerts"] = securityAlerts,
            ["periodStart"] = fromDate,
            ["periodEnd"] = toDate
        };
    }

    private string ComputeIntegrityHash(SuperAdminAuditLog log)
    {
        var dataToHash = $"{log.Operation}|{log.EntityType}|{log.EntityId}|{log.PerformedBy}|" +
                        $"{log.Timestamp:yyyy-MM-ddTHH:mm:ss.fffZ}|{log.BeforeData}|{log.AfterData}|{_integritySecret}";

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(dataToHash));
        return Convert.ToBase64String(hashBytes);
    }

    private async Task<string> ExportToCsvAsync(IEnumerable<SuperAdminAuditLog> logs, string fileName)
    {
        var filePath = Path.Combine(Path.GetTempPath(), fileName);

        using var writer = new StreamWriter(filePath);
        using var csv = new CsvWriter(writer, System.Globalization.CultureInfo.InvariantCulture);

        // Write headers
        csv.WriteHeader<SuperAdminAuditLog>();
        await csv.NextRecordAsync();

        // Write records
        foreach (var log in logs)
        {
            csv.WriteRecord(log);
            await csv.NextRecordAsync();
        }

        return filePath;
    }

    private async Task<string> ExportToJsonAsync(IEnumerable<SuperAdminAuditLog> logs, string fileName)
    {
        var filePath = Path.Combine(Path.GetTempPath(), fileName);

        var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await File.WriteAllTextAsync(filePath, json);
        return filePath;
    }

    private async Task<string> ExportToExcelAsync(IEnumerable<SuperAdminAuditLog> logs, string fileName)
    {
        var filePath = Path.Combine(Path.GetTempPath(), fileName);

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Audit Logs");

        // Headers
        worksheet.Cells[1, 1].Value = "ID";
        worksheet.Cells[1, 2].Value = "Operation";
        worksheet.Cells[1, 3].Value = "Entity Type";
        worksheet.Cells[1, 4].Value = "Entity ID";
        worksheet.Cells[1, 5].Value = "Performed By";
        worksheet.Cells[1, 6].Value = "Timestamp";
        worksheet.Cells[1, 7].Value = "IP Address";
        worksheet.Cells[1, 8].Value = "Tenant ID";
        worksheet.Cells[1, 9].Value = "Severity";
        worksheet.Cells[1, 10].Value = "Context";

        // Data
        var row = 2;
        foreach (var log in logs)
        {
            worksheet.Cells[row, 1].Value = log.Id;
            worksheet.Cells[row, 2].Value = log.Operation;
            worksheet.Cells[row, 3].Value = log.EntityType;
            worksheet.Cells[row, 4].Value = log.EntityId;
            worksheet.Cells[row, 5].Value = log.PerformedBy;
            worksheet.Cells[row, 6].Value = log.Timestamp;
            worksheet.Cells[row, 7].Value = log.IpAddress;
            worksheet.Cells[row, 8].Value = log.TenantId;
            worksheet.Cells[row, 9].Value = log.Severity;
            worksheet.Cells[row, 10].Value = log.AdditionalContext;
            row++;
        }

        // Style headers
        using (var range = worksheet.Cells[1, 1, 1, 10])
        {
            range.Style.Font.Bold = true;
            range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
        }

        worksheet.Cells.AutoFitColumns();

        await package.SaveAsAsync(filePath);
        return filePath;
    }
}