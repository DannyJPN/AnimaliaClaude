namespace Pzi.Data.Import.Services.Entities;

public class Movement
{
    public int SpecimenId { get; set; }
    public string Date { get; set; } = null!;
    public int Quantity { get; set; }
    public int QuantityActual { get; set; }
    public string? IncrementReasonCode { get; set; }
    public string? DecrementReasonCode { get; set; }
}

