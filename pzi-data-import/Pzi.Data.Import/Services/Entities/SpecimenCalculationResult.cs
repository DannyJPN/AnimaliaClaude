namespace Pzi.Data.Import.Services.Entities
{
    public class SpecimenCalculationResult
    {
        public SpecimenCalculationResult()
        {

        }

        public SpecimenCalculationResult(int specimenId, int quantityOwned, int quantityInZoo, int quantityDeponatedFrom, int quantityDeponatedTo)
        {
            SpecimenId = specimenId;
            QuantityOwned = quantityOwned;
            QuantityInZoo = quantityInZoo;
            QuantityDeponatedFrom = quantityDeponatedFrom;
            QuantityDeponatedTo = quantityDeponatedTo;
        }

        public int SpecimenId { get; set; }
        public int QuantityOwned { get; set; }
        public int QuantityInZoo { get; set; }
        public int QuantityDeponatedFrom { get; set; }
        public int QuantityDeponatedTo { get; set; }
    }
}
