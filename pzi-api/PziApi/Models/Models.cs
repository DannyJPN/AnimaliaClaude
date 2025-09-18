using System.ComponentModel.DataAnnotations;

namespace PziApi.Models;

public class SpecimenImage
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string Label { get; set; } = null!;
  public string? Description { get; set; }
  public byte[] Image { get; set; } = null!;
  public string ContentType { get; set; } = null!;
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
}

public class CadaverPartner
{
  public int Id { get; set; }
  public string Keyword { get; set; } = null!;
  public string? Name { get; set; }
  public string? City { get; set; }
  public string? StreetAndNumber { get; set; }
  public string? PostalCode { get; set; }
  public string? Country { get; set; }
  public string? Phone { get; set; }
  public string? Email { get; set; }
  public string? LastName { get; set; }
  public string? FirstName { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
}

public class Cadaver
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string? Date { get; set; }
  public string? Location { get; set; }
  public string? Note { get; set; }
  public byte[]? Photo { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
}

public class ClassificationType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class ContractActionInitiator
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class ContractActionType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class ContractAction
{
  public int Id { get; set; }
  public int ContractId { get; set; }
  public string? Date { get; set; }
  public string? ActionTypeCode { get; set; }
  public string? ActionInitiatorCode { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Contract? Contract { get; set; }
  public ContractActionType? ActionType { get; set; }
  public ContractActionInitiator? ActionInitiator { get; set; }
}

public class ContractMovementReason
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class ContractType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Contract
{
  public int Id { get; set; }
  public string Number { get; set; } = null!;
  public string Date { get; set; } = null!;
  public string? MovementReasonCode { get; set; }
  public string? ContractTypeCode { get; set; }
  public int? PartnerId { get; set; }
  public string? Note { get; set; }
  public string? NotePrague { get; set; }
  public string? NotePartner { get; set; }
  public int? Year { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Partner? Partner { get; set; }
  public ContractMovementReason? MovementReason { get; set; }
  public ContractType? ContractType { get; set; }
  public ICollection<ContractAction>? ContractActions{ get; set; }
}

public class DecrementReason
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class DocumentSpecies
{
  public int Id { get; set; }
  public int SpeciesId { get; set; }
  public string DocumentTypeCode { get; set; } = null!;
  public string? Date { get; set; }
  public string Number { get; set; } = null!;
  public string? Note { get; set; }
  public bool IsValid { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Species Species { get; set; } = null!;
  public SpeciesDocumentType? DocumentType { get; set; }
}

public class DocumentSpecimen
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string DocumentTypeCode { get; set; } = null!;
  public string Number { get; set; } = null!;
  public string? Date { get; set; }
  public string? Partner { get; set; }
  public string? Note { get; set; }
  public bool IsValid { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
  public SpecimenDocumentType? DocumentType { get; set; }
}

public class EuCode
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class GenderType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class IncrementReason
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class BirthMethod
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Rearing
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Marking
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string MarkingTypeCode { get; set; } = string.Empty;
  public string? RingNumber { get; set; }
  public string? Color { get; set; }
  public string? Side { get; set; }
  public string? LocatedOn { get; set; }
  public bool IsValid { get; set; } = true;
  public string? MarkingDate { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
  public MarkingType? MarkingType { get; set; }
}

public class MarkingType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Movement
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string Date { get; set; } = null!;
  public int Quantity { get; set; }
  public int QuantityActual { get; set; }
  public string? IncrementReasonCode { get; set; }
  public string? DecrementReasonCode { get; set; }
  public int? LocationId { get; set; }
  public string? CitesImport { get; set; } // TODO: Is this used? Only ~190 records have this
  public string? CitesExport { get; set; } // TODO: Is this used? Only ~190 records have this
  public decimal? Price { get; set; }
  public string? Note { get; set; }
  public string? Gender { get; set; } // TODO: What is this?
  public string? AccountingDate { get; set; }
  public decimal? PriceFinal { get; set; }
  public string? DepType { get; set; }
  public string? ContractNumber { get; set; }
  public string? ContractNote { get; set; }
  public int? ContractId { get; set; }
  public string SourceType { get; set; } = null!;
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
  public Partner? Partner { get; set; }
  public IncrementReason? IncrementReason { get; set; }
  public DecrementReason? DecrementReason { get; set; }
  public Contract? Contract { get; set; }
}

public class OriginType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Partner
{
  public int Id { get; set; }
  public string Keyword { get; set; } = null!;
  public string? Name { get; set; }
  public string? Status { get; set; }
  public string? City { get; set; }
  public string? StreetAddress { get; set; }
  public string? PostalCode { get; set; }
  public string? Country { get; set; }
  public string? Phone { get; set; }
  public string? Email { get; set; }
  public string? PartnerType { get; set; }
  public string? LastName { get; set; }
  public string? FirstName { get; set; }
  public string? Note { get; set; }
}

public class Placement
{
  public int Id { get; set; }
  public int? SpecimenId { get; set; }
  public int? OriginSpecimenId { get; set; }
  public int RegionId { get; set; }
  public string Date { get; set; } = null!;
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Specimen { get; set; }
  public Region? Region { get; set; }
}

public class RdbCode
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class RecordActionType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class RecordSpecies
{
  public int Id { get; set; }
  public int SpeciesId { get; set; }
  public string Date { get; set; } = null!;
  public string? ActionTypeCode { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public RecordActionType? ActionType { get; set; }
  public Species Species { get; set; } = null!;
}

public class RecordSpecimen
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string Date { get; set; } = null!;
  public string? ActionTypeCode { get; set; }
  public string? Note { get; set; }
  public int? PartnerId { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public Specimen? Partner { get; set; }
  public Specimen? Specimen { get; set; }

  public RecordActionType? ActionType { get; set; }
}

public class Region
{
  public int Id { get; set; }
  public int SectionId { get; set; }
  public string Name { get; set; } = null!;
  public string? Code { get; set; }
  public string? OperationNote { get; set; }
  public Section? Section { get; set; }
  public ICollection<Species>? Species { get; set; }
}

public class Section
{
  public int Id { get; set; }
  public string SectionName { get; set; } = null!;
  public string? Code { get; set; }
}

public class Species
{
  public int Id { get; set; } // Primary Key, not nullable
  public int TaxonomyGenusId { get; set; } // Foreign Key, not nullable
  public string? Code { get; set; }
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameGe { get; set; }
  public string? NameSk { get; set; }
  public string? Card { get; set; }
  public string? RdbCode { get; set; }
  public string? CiteTypeCode { get; set; }
  public string? ProtectionTypeCode { get; set; }
  public bool IsEep { get; set; }
  public bool IsEsb { get; set; }
  public bool IsIsb { get; set; }
  public bool IsGenePool { get; set; }
  public string ClassificationTypeCode { get; set; } = null!;
  public string? ZooStatus { get; set; }
  public decimal? Price { get; set; }
  public int? RegionId { get; set; }
  public string? Note { get; set; }
  public string? Synonyms { get; set; }
  public string? Description { get; set; }
  public string? FeedingRate { get; set; }
  public byte[]? Photo { get; set; }
  public string? UcszCoef { get; set; }
  public string? EuCode { get; set; }
  public bool IsRegulationRequirement { get; set; }
  public string? GroupType { get; set; }
  public bool IsEuFauna { get; set; }
  public string? EuFaunaRefNumber { get; set; }
  public string? CrExceptionRefNumber { get; set; }
  public string? RdbCodePrevious { get; set; }
  public string? AvgMinDepositInk { get; set; }
  public string? AvgMaxDepositInk { get; set; }
  public string? AvgDurationInk { get; set; }
  public int? GroupId { get; set; }
  public string? Documentation { get; set; }
  public char SourceType { get; set; } // Not nullable
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }

  public TaxonomyGenus? TaxonomyGenus { get; set; }
  public Region? Region { get; set; }
  public ICollection<Specimen>? Specimens { get; set; }
}

public class SpeciesCiteTypes
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class SpeciesDocumentType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class SpeciesProtectionType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class SpecimenDocumentType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Specimen
{
  public int Id { get; set; }
  public int SpeciesId { get; set; }
  public int? AccessionNumber { get; set; }
  public string? GenderTypeCode { get; set; }
  public string ClassificationTypeCode { get; set; } = null!;
  public string? Zims { get; set; }
  public string? StudBookNumber { get; set; }
  public string? StudBookName { get; set; }
  public string? Name { get; set; }
  public string? Notch { get; set; }
  public string? Chip { get; set; }
  public string? RingNumber { get; set; }
  public string? OtherMarking { get; set; }
  public bool IsHybrid { get; set; }
  public string? Location { get; set; }
  public string? BirthDate { get; set; }
  public string? BirthPlace { get; set; }
  public string? BirthMethod { get; set; }
  public string? Rearing { get; set; }
  public int? FatherId { get; set; }
  public int? MotherId { get; set; }
  public string? Note { get; set; }
  public string? OtherDetails { get; set; }
  public byte[]? Photo { get; set; }
  public string? RegisteredDate { get; set; }
  public string? RegisteredTo { get; set; }
  public string? RegistrationNumber { get; set; }
  public string? CadaverDate { get; set; }
  public string? CadaverPlace { get; set; }
  public string? EuPermit { get; set; }
  public string? CzechRegistrationNumber { get; set; }
  public string? FatherZims { get; set; }
  public string? MotherZims { get; set; }
  public string? RingNumberSecondary { get; set; }
  public string? OtherMarkingSecondary { get; set; }
  public string? ChipSecondary { get; set; }
  public string? NotchSecondary { get; set; }
  public string? Documentation { get; set; }
  public string? Ueln { get; set; }
  public char SourceType { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  // CALCULATED VALUES
  public string? InDate { get; set; }
  public string? InReasonCode { get; set; }
  public int? InLocationId { get; set; }
  public string? OutDate { get; set; }
  public string? OutReasonCode { get; set; }
  public int? OutLocationId { get; set; }
  public decimal? Price { get; set; }
  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }
  public string? PlacementDate { get; set; }
  public int? RegionId { get; set; }
  public int? PlacementLocationId { get; set; }
  public int? OrganizationLevelId { get; set; }
  public Species? Species { get; set; }
  public Specimen? Father { get; set; }
  public Specimen? Mother { get; set; }
  public GenderType? GenderType { get; set; }
  public ClassificationType? ClassificationType { get; set; }
  public Partner? InLocation { get; set; }
  public Partner? OutLocation { get; set; }
  public IncrementReason? InReason { get; set; }
  public DecrementReason? OutReason { get; set; }
  public Region? Region { get; set; }
  public OrganizationLevel? OrganizationLevel { get; set; }
  public Location? PlacementLocation { get; set; }
  public ICollection<SpecimenImage>? Images { get; set; }
  public ICollection<Movement>? Movements { get; set; }
  public ICollection<Cadaver>? Cadavers { get; set; }
  public ICollection<DocumentSpecimen>? SpecimenDocuments { get; set; }
  public ICollection<Marking>? Markings { get; set; }
  public ICollection<Placement>? Placements { get; set; }
  public ICollection<RecordSpecimen>? Records { get; set; }
  public ICollection<JournalMovementEntrySpecimen>? JournalMovementEntries { get; set; }
  public ICollection<JournalBioEntrySpecimen>? JournalBioEntries { get; set; }


  // NOTE: Following items are based on views
  public TaxonomyHierarchyViewItem? TaxonomyHierarchyView { get; set; }
  public OrganizationHierarchyViewItem? OrgHierarchyView { get; set; }
  public ExpositionHierarchyViewItem? ExpositionHierarchyView { get; set; }
}

public class TaxonomyClass
{
  public int Id { get; set; } // Primary Key, not nullable
  public int? TaxonomyPhylumId { get; set; } // Foreign Key, not nullable
  public string? Code { get; set; }
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameSk { get; set; }
  public string? Cryptogram { get; set; }
  public string? ImageName { get; set; }
  public string? Note { get; set; }
  public string? Synonyms { get; set; }
  public string? ZooStatus { get; set; }
  public string? Shortcut { get; set; }
  public char SourceType { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }

  public TaxonomyPhylum? TaxonomyPhylum { get; set; }
}

public class TaxonomyFamily
{
  public int Id { get; set; } // Primary Key, not nullable
  public int TaxonomyOrderId { get; set; } // Foreign Key, not nullable
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameSk { get; set; }
  public string? Code { get; set; }
  public string? Note { get; set; }
  public string? Synonyms { get; set; }
  public string? ZooStatus { get; set; }
  public char SourceType { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }

  public TaxonomyOrder? TaxonomyOrder { get; set; }
}

public class TaxonomyGenus
{
  public int Id { get; set; } // Primary Key, not nullable
  public int TaxonomyFamilyId { get; set; } // Foreign Key, not nullable
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameSk { get; set; }
  public string? Code { get; set; }
  public string? ZooStatus { get; set; } // Nullable NVARCHAR(1)
  public char SourceType { get; set; } // Not nullable
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }

  public TaxonomyFamily? TaxonomyFamily { get; set; } // Navigation property to parent TaxonomyFamily
}

public class TaxonomyOrder
{
  public int Id { get; set; } // Primary Key, not nullable
  public int TaxonomyClassId { get; set; } // Foreign Key, not nullable
  public string? Code { get; set; }
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameSk { get; set; }
  public string? Note { get; set; }
  public string? Synonyms { get; set; }
  public string? ZooStatus { get; set; } // Nullable CHAR(1)
  public char SourceType { get; set; } // Not nullable
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }

  public TaxonomyClass? TaxonomyClass { get; set; }
}

public class TaxonomyPhylum
{
  public int Id { get; set; } // Primary Key, not nullable
  public string? Code { get; set; }
  public string? NameCz { get; set; }
  public string? NameLat { get; set; }
  public string? NameEn { get; set; }
  public string? NameSk { get; set; }
  public string? ZooStatus { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public int QuantityOwned { get; set; }
  public int QuantityInZoo { get; set; }
  public int QuantityDeponatedFrom { get; set; }
  public int QuantityDeponatedTo { get; set; }
  public bool IsVertebrate { get; set; } // Flag indicating if this phylum contains vertebrates
}

public class ZooStatus
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class Zoo
{
  public string Id { get; set; } = null!;
  public string Keyword { get; set; } = null!;
  public string? Name { get; set; }
  public string? City { get; set; }
  public string? StreetNumber { get; set; }
  public string? PostalCode { get; set; }
  public string? Country { get; set; }
  public string? Phone { get; set; }
  public string? Email { get; set; }
  public string? Website { get; set; }
  public string? LastName { get; set; }
  public string? FirstName { get; set; }
  public string? Note { get; set; }
}

public class User
{
  public int Id { get; set; }
  public string UserName { get; set; } = null!;
  public string? VisibleTaxonomyStatuses { get; set; }
  public bool TaxonomySearchByCz { get; set; }
  public bool TaxonomySearchByLat { get; set; }
  public ICollection<UserRole>? UserRoles { get; set; }
  public ICollection<UserFlaggedDistrict>? FlaggedDistricts { get; set; }
  public ICollection<UserFlaggedSpecies>? FlaggedSpecies { get; set; }
}

public class UserRole
{
  public int Id { get; set; }
  public int UserId { get; set; }
  public string RoleName { get; set; } = null!;
  public User? User { get; set; }
}

public class UserTableSetting
{
  public int Id { get; set; }
  public int UserId { get; set; }
  public string TableId { get; set; } = null!;
  public string Settings { get; set; } = null!;
  public User? User { get; set; }
}

public class ColorType
{
  [Key]
  public string Code { get; set; } = null!;
  public string ColorEn { get; set; } = null!;
  public int Sort { get; set; }
}

public class ExpositionArea
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public ICollection<ExpositionSet>? ExpositionSets { get; set; }
}

public class ExpositionSet
{
  public int Id { get; set; }
  public int ExpositionAreaId { get; set; }
  public string Name { get; set; } = null!;
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public ExpositionArea? ExpositionArea { get; set; }
  public ICollection<Location>? Locations { get; set; }
}

public class Location
{
  public int Id { get; set; }
  public int? OrganizationLevelId { get; set; }
  public int? ExpositionSetId { get; set; }
  public string Name { get; set; } = null!;
  public int? ObjectNumber { get; set; }
  public int? RoomNumber { get; set; }
  public bool AvailableForVisitors { get; set; } = true;
  public int LocationTypeCode { get; set; }
  public decimal? AreaM2 { get; set; }
  public decimal? CapacityM3 { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public OrganizationLevel? OrganizationLevel { get; set; }
  public ExpositionSet? ExpositionSet { get; set; }
}

public class OrganizationLevel
{
  public int Id { get; set; }
  public int? ParentId { get; set; }
  public string Level { get; set; } = null!;
  public string Name { get; set; } = null!;
  public string? Director { get; set; }
  public string? JournalApproversGroup { get; set; }
  public string? JournalReadGroup { get; set; }
  public string? JournalContributorGroup { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public OrganizationLevel? Parent { get; set; }
  public ICollection<PziApi.Models.Journal.JournalActionTypesToOrganizationLevels>? JournalActionTypes { get; set; }
}

public class SpecimenPlacement
{
  public int Id { get; set; }
  public int SpecimenId { get; set; }
  public string ValidSince { get; set; } = null!;
  public int? LocationId { get; set; }
  public int? OrganizationLevelId { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }
  public OrganizationLevel? OrganizationLevel { get; set; }
  public Location? Location { get; set; }
  public string? Note { get; set; }
  public Specimen? Specimen { get; set; }
}

public class JournalMovementEntryType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class JournalMovementEntry
{
  public int Id { get; set; }
  public string EntryTypeCode { get; set; } = null!;
  public string AuthorUserName { get; set; } = null!;
  public DateTime EntryDate { get; set; }
  public int OrganizationLevelId { get; set; }
  public int SpeciesId { get; set; }
  public string Status { get; set; } = null!;
  public string? Note { get; set; }
  public string? LastApproverUserName { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalMovementEntryType? EntryType { get; set; }
  public OrganizationLevel? OrganizationLevel { get; set; }
  public Species? Species { get; set; }
  public ICollection<JournalMovementEntryAttribute>? Attributes { get; set; }
  public ICollection<JournalMovementEntrySpecimen>? Specimens { get; set; }
}

public class JournalMovementEntrySpecimen
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public int SpecimenId { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalMovementEntry? Entry { get; set; }
  public Specimen? Specimen { get; set; }
  public ICollection<JournalMovementEntrySpecimenAttribute>? Attributes { get; set; }
}

public class UserFlaggedDistrict
{
  public int Id { get; set; }
  public int UserId { get; set; }
  public int DistrictId { get; set; }
  public DateTime ModifiedAt { get; set; }
  public string? ModifiedBy { get; set; }

  public User? User { get; set; }
  public OrganizationLevel? District { get; set; }
}

public class UserFlaggedSpecies
{
  public int Id { get; set; }
  public int UserId { get; set; }
  public int SpeciesId { get; set; }
  public DateTime ModifiedAt { get; set; }
  public string? ModifiedBy { get; set; }

  public User? User { get; set; }
  public Species? Species { get; set; }
}

public class JournalMovementEntryAttribute
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public string TypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalMovementEntry? Entry { get; set; }
}

public class JournalBioEntryType
{
  [Key]
  public string Code { get; set; } = null!;
  public int Sort { get; set; }
  public string DisplayName { get; set; } = null!;
  public string? Note { get; set; }
}

public class JournalBioEntry
{
  public int Id { get; set; }
  public string EntryTypeCode { get; set; } = null!;
  public string AuthorUserName { get; set; } = null!;
  public int OrganizationLevelId { get; set; }
  public int SpeciesId { get; set; }
  public DateTime EntryDate { get; set; }
  public string Status { get; set; } = null!;
  public string? Note { get; set; }
  public string? LastApproverUserName { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalBioEntryType? EntryType { get; set; }
  public OrganizationLevel? OrganizationLevel { get; set; }
  public Species? Species { get; set; }
  public ICollection<JournalBioEntryAttribute>? Attributes { get; set; }
  public ICollection<JournalBioEntrySpecimen>? Specimens { get; set; }
}

public class JournalBioEntrySpecimen
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public int SpecimenId { get; set; }
  public string? Note { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalBioEntry? Entry { get; set; }
  public Specimen? Specimen { get; set; }
  public ICollection<JournalBioEntrySpecimenAttribute>? Attributes { get; set; }
}

public class JournalBioEntryAttribute
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public string TypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalBioEntry? Entry { get; set; }
}

public class JournalBioEntrySpecimenAttribute
{
  public int Id { get; set; }
  public int EntrySpecimenId { get; set; }
  public string TypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalBioEntrySpecimen? EntrySpecimen { get; set; }
}

public class JournalMovementEntrySpecimenAttribute
{
  public int Id { get; set; }
  public int EntrySpecimenId { get; set; }
  public string TypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime? ModifiedAt { get; set; }

  public JournalMovementEntrySpecimen? EntrySpecimen { get; set; }
}

// MODELS FROM VIEWS
public class TaxonomyHierarchyViewItem
{
  public int SpeciesId { get; set; }
  public string? SpeciesNameCz { get; set; }
  public string? SpeciesNameLat { get; set; }
  public int GenusId { get; set; }
  public string? GenusNameCz { get; set; }
  public string? GenusNameLat { get; set; }
  public int FamilyId { get; set; }
  public string? FamilyNameCz { get; set; }
  public string? FamilyNameLat { get; set; }
  public int OrderId { get; set; }
  public string? OrderNameCz { get; set; }
  public string? OrderNameLat { get; set; }
  public int ClassId { get; set; }
  public string? ClassNameCz { get; set; }
  public string? ClassNameLat { get; set; }
  public int PhylumId { get; set; }
  public string? PhylumNameCz { get; set; }
  public string? PhylumNameLat { get; set; }
  public bool IsVertebrate { get; set; }
}

public class ExpositionHierarchyViewItem
{
  public int LocationId { get; set; }
  public string? LocationName { get; set; }
  public int? ExpositionSetId { get; set; }
  public string? ExpositionSetName { get; set; }
  public int? ExpositionAreaId { get; set; }
  public string? ExpositionAreaName { get; set; }
}

public class OrganizationHierarchyViewItem
{
  public int Id { get; set; }
  public int? DistrictId { get; set; }
  public string? DistrictName { get; set; }
  public int? WorkplaceId { get; set; }
  public string? WorkplaceName { get; set; }
  public int? DepartmentId { get; set; }
  public string? DepartmentName { get; set; }
}
