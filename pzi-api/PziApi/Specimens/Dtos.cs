using PziApi.CrossCutting;

namespace PziApi.Specimens;

public class Dtos
{
  public record Specimen(
    int Id,
    int? SpeciesId,
    int? AccessionNumber,
    string? GenderTypeCode,
    string ClassificationTypeCode,
    string? Zims,
    string? StudBookNumber,
    string? StudBookName,
    string? Name,
    string? Notch,
    string? Chip,
    string? RingNumber,
    string? OtherMarking,
    bool IsHybrid,
    string? Location,
    string? BirthDate,
    string? BirthPlace,
    string? BirthMethod,
    string? Rearing,
    int? FatherId,
    int? MotherId,
    string? Note,
    string? OtherDetails,
    string? RegisteredDate,
    string? RegisteredTo,
    string? RegistrationNumber,
    string? CadaverDate,
    string? CadaverPlace,
    string? EuPermit,
    string? CzechRegistrationNumber,
    string? FatherZims,
    string? MotherZims,
    string? RingNumberSecondary,
    string? OtherMarkingSecondary,
    string? ChipSecondary,
    string? NotchSecondary,
    string? Documentation,
    string? Ueln,
    string ModifiedBy
  );

  public record SpecimenUpdate(
    int? SpeciesId,
    int? AccessionNumber,
    string? GenderTypeCode,
    string ClassificationTypeCode,
    string? Zims,
    string? StudBookNumber,
    string? StudBookName,
    string? Name,
    string? Notch,
    string? Chip,
    string? RingNumber,
    string? OtherMarking,
    bool IsHybrid,
    string? Location,
    string? BirthDate,
    string? BirthPlace,
    string? BirthMethod,
    string? Rearing,
    int? FatherId,
    int? MotherId,
    string? Note,
    string? RegisteredDate,
    string? RegisteredTo,
    string? RegistrationNumber,
    string? EuPermit,
    string? CzechRegistrationNumber,
    string? FatherZims,
    string? MotherZims,
    string? ChipSecondary,
    string? NotchSecondary,
    string? Documentation,
    string? Ueln,
    string ModifiedBy
  );

  public record SpecimenGridItem(
    int Id,
    int? AccessionNumber,
    string? GenderTypeCode,
    string ClassificationTypeCode,
    string? Zims,
    string? StudBookNumber,
    string? StudBookName,
    string? Name,
    string? Notch,
    string? Chip,
    string? RingNumber,
    string? OtherMarking,
    bool IsHybrid,
    string? Location,
    string? BirthDate,
    string? BirthPlace,
    string? BirthMethod,
    string? Rearing,
    int? FatherId,
    int? MotherId,
    string? Note,
    string? OtherDetails,
    string? RegisteredDate,
    string? RegisteredTo,
    string? RegistrationNumber,
    string? CadaverDate,
    string? CadaverPlace,
    string? EuPermit,
    string? CzechRegistrationNumber,
    string? FatherZims,
    string? MotherZims,
    string? Documentation,
    string? Ueln,
    string? ModifiedBy,
    DateTime? ModifiedAt,

    // Movement data
    string? InDate,
    string? InReasonCode,
    int? InLocationId,
    string? OutDate,
    string? OutReasonCode,
    int? OutLocationId,
    decimal? Price,

    // Quantity data
    int QuantityOwned,
    int QuantityInZoo,
    int QuantityDeponatedFrom,
    int QuantityDeponatedTo,

    // Placement data
    int? PlacementLocationId,
    int? OrganizationLevelId,

    // Species
    int SpeciesId,
    string? SpeciesNameCz,
    string? SpeciesNameLat,


    // Taxonomy Genus
    int GenusId,
    string? GenusNameCz,
    string? GenusNameLat,

    // Taxonomy Family
    int FamilyId,
    string? FamilyNameCz,
    string? FamilyNameLat,

    // Taxonomy Order
    int OrderId,
    string? OrderNameCz,
    string? OrderNameLat,

    // Taxonomy Class
    int ClassId,
    string? ClassNameCz,
    string? ClassNameLat,

    // Taxonomy Phylum
    int? PhylumId,
    string? PhylumNameCz,
    string? PhylumNameLat,

    // EXP hierarchy
    string? LocationName,
    int? ExpositionSetId,
    string? ExpositionSetName,
    int? ExpositionAreaId,
    string? ExpositionAreaName,

    // ORG HIERARCHY
    int? DistrictId,
    string? DistrictName,
    int? WorkplaceId,
    string? WorkplaceName,
    int? DepartmentId,
    string? DepartmentName
  );

  public record SpecimenParent(
    int Id,
    int? AccessionNumber,
    string? GenderTypeCode,
    string? Name,
    string? Zims,
    string? BirthDate
  );

  public record SpecimenTaxonomy(
    int GenusId,
    string GenusNameCz,
    string GenusNameLat,
    int GenusQuantityOwned,
    int GenusQuantityInZoo,

    int FamilyId,
    string FamilyNameCz,
    string FamilyNameLat,
    string FamilySynonyms,
    int FamilyQuantityOwned,
    int FamilyQuantityInZoo,

    int OrderId,
    string OrderCode,
    string OrderNameCz,
    string OrderNameEn,
    string OrderNameLat,
    string OrderSynonyms,
    int OrderQuantityOwned,
    int OrderQuantityInZoo,

    int ClassId,
    string ClassNameCz,
    string ClassNameLat,
    int ClassQuantityOwned,
    int ClassQuantityInZoo,

    int? PhylumId,
    string PhylumNameCz,
    string PhylumNameLat,
    int PhylumQuantityOwned,
    int PhylumQuantityInZoo
  );

  public record SpecimentsListViewRequest(
    string UserName,
    CommonDtos.Paging Paging,
    List<CommonDtos.Sorting> Sorting,
    List<CommonDtos.Filtering> Filtering
  );
}
