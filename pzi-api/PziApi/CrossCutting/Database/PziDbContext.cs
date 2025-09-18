using Microsoft.EntityFrameworkCore;
using PziApi.Models;
using PziApi.Models.Journal;


namespace PziApi.CrossCutting.Database;

public class PziDbContext : DbContext
{
  public DbSet<SpecimenImage> SpecimenImages { get; set; } = null!;
  public DbSet<CadaverPartner> CadaverPartners { get; set; } = null!;
  public DbSet<Cadaver> Cadavers { get; set; } = null!;
  public DbSet<ClassificationType> ClassificationTypes { get; set; } = null!;
  public DbSet<ContractActionInitiator> ContractActionInitiators { get; set; } = null!;
  public DbSet<ContractActionType> ContractActionTypes { get; set; } = null!;
  public DbSet<ContractAction> ContractActions { get; set; } = null!;
  public DbSet<ContractMovementReason> ContractMovementReasons { get; set; } = null!;
  public DbSet<ContractType> ContractTypes { get; set; } = null!;
  public DbSet<Contract> Contracts { get; set; } = null!;
  public DbSet<DecrementReason> DecrementReasons { get; set; } = null!;
  public DbSet<DocumentSpecimen> DocumentSpecimens { get; set; } = null!;
  public DbSet<DocumentSpecies> DocumentSpecies { get; set; } = null!;
  public DbSet<EuCode> EuCodes { get; set; } = null!;
  public DbSet<GenderType> GenderTypes { get; set; } = null!;
  public DbSet<IncrementReason> IncrementReasons { get; set; } = null!;
  public DbSet<BirthMethod> BirthMethods { get; set; } = null!;
  public DbSet<Rearing> Rearings { get; set; } = null!;
  public DbSet<Marking> Markings { get; set; } = null!;
  public DbSet<MarkingType> MarkingTypes { get; set; } = null!;
  public DbSet<Movement> Movements { get; set; } = null!;
  public DbSet<OriginType> OriginTypes { get; set; } = null!;
  public DbSet<Partner> Partners { get; set; } = null!;
  public DbSet<Placement> Placements { get; set; } = null!;
  public DbSet<RdbCode> RdbCodes { get; set; } = null!;
  public DbSet<RecordActionType> RecordActionTypes { get; set; } = null!;
  public DbSet<RecordSpecies> RecordSpecies { get; set; } = null!;
  public DbSet<RecordSpecimen> RecordSpecimens { get; set; } = null!;
  public DbSet<Region> Regions { get; set; } = null!;
  public DbSet<Section> Sections { get; set; } = null!;
  public DbSet<Models.Species> Species { get; set; } = null!;
  public DbSet<SpeciesCiteTypes> SpeciesCiteTypes { get; set; } = null!;
  public DbSet<SpeciesDocumentType> SpeciesDocumentTypes { get; set; } = null!;
  public DbSet<SpeciesProtectionType> SpeciesProtectionTypes { get; set; } = null!;
  public DbSet<SpecimenDocumentType> SpecimenDocumentTypes { get; set; } = null!;
  public DbSet<Specimen> Specimens { get; set; } = null!;
  public DbSet<TaxonomyClass> TaxonomyClasses { get; set; } = null!;
  public DbSet<TaxonomyFamily> TaxonomyFamilies { get; set; } = null!;
  public DbSet<Models.TaxonomyGenus> TaxonomyGenera { get; set; } = null!;
  public DbSet<TaxonomyOrder> TaxonomyOrders { get; set; } = null!;
  public DbSet<TaxonomyPhylum> TaxonomyPhyla { get; set; } = null!;
  public DbSet<ZooStatus> ZooStatuses { get; set; } = null!;
  public DbSet<Zoo> Zoos { get; set; } = null!;
  public DbSet<User> Users { get; set; } = null!;
  public DbSet<UserRole> UserRoles { get; set; } = null!;
  public DbSet<UserTableSetting> UserTableSettings { get; set; } = null!;
  public DbSet<UserFlaggedDistrict> UserFlaggedDistricts { get; set; } = null!;
  public DbSet<UserFlaggedSpecies> UserFlaggedSpecies { get; set; } = null!;
  public DbSet<ColorType> ColorTypes { get; set; } = null!;
  public DbSet<Location> Locations { get; set; } = null!;
  public DbSet<OrganizationLevel> OrganizationLevels { get; set; } = null!;
  public DbSet<SpecimenPlacement> SpecimenPlacements { get; set; } = null!;
  public DbSet<ExpositionArea> ExpositionAreas { get; set; } = null!;
  public DbSet<ExpositionSet> ExpositionSets { get; set; } = null!;
  public DbSet<OrganizationHierarchyViewItem> OrgHierarchyView => Set<OrganizationHierarchyViewItem>();

  // New Journal entities
  public DbSet<PziApi.Models.Journal.JournalActionType> JournalActionTypes { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalEntry> JournalEntries { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalEntrySpecimen> JournalEntrySpecimens { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalEntryAttribute> JournalEntryAttributes { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalEntrySpecimenAttribute> JournalEntrySpecimenAttributes { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalEntryAudit> JournalEntryAudits { get; set; } = null!;
  public DbSet<PziApi.Models.Journal.JournalActionTypesToOrganizationLevels> JournalActionTypesToOrganizationLevels { get; set; } = null!;

  public PziDbContext(DbContextOptions<PziDbContext> options)
      : base(options)
  {
  }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    // Configure TaxonomyPhyla entity
    modelBuilder.Entity<TaxonomyPhylum>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ZooStatus)
            .HasMaxLength(1);
      entity.Property(e => e.Code)
           .HasMaxLength(3);
    });

    // Configure TaxonomyClass entity
    modelBuilder.Entity<TaxonomyClass>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ZooStatus)
            .HasMaxLength(1)
            .IsRequired();
      entity.HasOne(d => d.TaxonomyPhylum)
        .WithMany();
    });

    // Configure TaxonomyOrder entity
    modelBuilder.Entity<TaxonomyOrder>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ZooStatus)
            .HasMaxLength(1);
      entity.HasOne(d => d.TaxonomyClass)
            .WithMany()
            .HasForeignKey(d => d.TaxonomyClassId);
    });

    // Configure TaxonomyFamily entity
    modelBuilder.Entity<TaxonomyFamily>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ZooStatus)
            .HasMaxLength(1);
      entity.HasOne(d => d.TaxonomyOrder)
            .WithMany()
            .HasForeignKey(d => d.TaxonomyOrderId);
    });

    // Configure TaxonomyGenus entity
    modelBuilder.Entity<TaxonomyGenus>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ZooStatus)
            .HasMaxLength(1);
      entity.HasOne(d => d.TaxonomyFamily)
            .WithMany()
            .HasForeignKey(d => d.TaxonomyFamilyId);
    });

    // Configure Species entity
    modelBuilder.Entity<Models.Species>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.Property(e => e.ClassificationTypeCode)
            .IsRequired();

      entity.HasOne(d => d.TaxonomyGenus)
            .WithMany()
            .HasForeignKey(d => d.TaxonomyGenusId);

      entity.HasOne(d => d.Region)
          .WithMany(d => d.Species)
          .HasForeignKey(d => d.RegionId);

      entity.Property(e => e.CiteTypeCode).HasColumnName("CiteType");
      entity.Property(e => e.ClassificationTypeCode).HasColumnName("ClassificationType");
      entity.Property(e => e.ProtectionTypeCode).HasColumnName("ProtectionType");
    });

    // Configure Specimen entity
    modelBuilder.Entity<Specimen>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Species)
            .WithMany(s => s.Specimens)
            .HasForeignKey(d => d.SpeciesId);

      entity.HasOne(d => d.ClassificationType)
        .WithMany()
        .HasForeignKey(d => d.ClassificationTypeCode);

      entity.HasOne(d => d.GenderType)
        .WithMany()
        .HasForeignKey(d => d.GenderTypeCode);

      entity.HasOne(d => d.Father)
        .WithMany()
        .HasForeignKey(d => d.FatherId);

      entity.HasOne(d => d.Mother)
        .WithMany()
        .HasForeignKey(d => d.MotherId);

      entity.Property(e => e.ClassificationTypeCode).HasColumnName("ClassificationType");
      entity.Property(e => e.GenderTypeCode).HasColumnName("GenderType");
      entity.Property(e => e.InReasonCode).HasColumnName("InReason");
      entity.Property(e => e.OutReasonCode).HasColumnName("OutReason");

      entity.HasOne(d => d.InLocation)
        .WithMany()
        .HasForeignKey(d => d.InLocationId);

      entity.HasOne(d => d.OutLocation)
        .WithMany()
        .HasForeignKey(d => d.OutLocationId);

      entity.HasOne(s => s.OrganizationLevel)
        .WithMany()
        .HasForeignKey(s => s.OrganizationLevelId);

      entity.HasOne(s => s.PlacementLocation)
        .WithMany()
        .HasForeignKey(s => s.PlacementLocationId);

      // VIEWS
      entity.HasOne(s => s.TaxonomyHierarchyView)
        .WithMany()
        .HasForeignKey(s => s.SpeciesId);

      entity.HasOne(s => s.OrgHierarchyView)
        .WithMany()
        .HasForeignKey(s => s.OrganizationLevelId);

      entity.HasOne(s => s.ExpositionHierarchyView)
        .WithMany()
        .HasForeignKey(s => s.PlacementLocationId);
    });

    // Configure Partner entity
    modelBuilder.Entity<Partner>(entity =>
    {
      entity.HasKey(e => e.Id);
    });

    // Configure DocumentSpecies entity
    modelBuilder.Entity<DocumentSpecies>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.Species)
            .WithMany()
            .HasForeignKey(d => d.SpeciesId);

      entity.Property(d => d.DocumentTypeCode).HasColumnName("DocumentType");
    });

    // Configure DocumentSpecimen entity
    modelBuilder.Entity<DocumentSpecimen>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Specimen)
            .WithMany(s => s.SpecimenDocuments)
            .HasForeignKey(d => d.SpecimenId);

      entity.Property(d => d.DocumentTypeCode).HasColumnName("DocumentType");
    });

    // Configure Cadaver entity
    modelBuilder.Entity<Cadaver>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Specimen)
            .WithMany(d => d.Cadavers)
            .HasForeignKey(d => d.SpecimenId);
    });

    // Configure CadaverPartner entity
    modelBuilder.Entity<CadaverPartner>(entity =>
    {
      entity.HasKey(e => e.Id);
    });

    // Configure Section entity
    modelBuilder.Entity<Section>(entity =>
    {
      entity.HasKey(e => e.Id);
    });

    // Configure Region entity
    modelBuilder.Entity<Region>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Section)
            .WithMany()
            .HasForeignKey(d => d.SectionId);
    });

    // Configure Contract entity
    modelBuilder.Entity<Contract>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Partner)
            .WithMany()
            .HasForeignKey(d => d.PartnerId);

      entity.Property(p => p.ContractTypeCode).HasColumnName("ContractType");
      entity.Property(p => p.MovementReasonCode).HasColumnName("MovementReason");
    });

    modelBuilder.Entity<Marking>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(e => e.Specimen)
            .WithMany(s => s.Markings)
            .HasForeignKey(e => e.SpecimenId);

      entity.HasOne(e => e.MarkingType)
            .WithMany()
            .HasForeignKey(e => e.MarkingTypeCode);

      entity.Property(e => e.MarkingTypeCode).HasColumnName("MarkingType");
    });

    modelBuilder.Entity<MarkingType>(entity =>
    {
      entity.HasKey(e => e.Code);
    });

    // Configure Movement entity
    modelBuilder.Entity<Movement>(entity =>
    {
      entity.ToTable(tb => tb.HasTrigger("TRG_Movements_CalculateAggregations"));

      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.Specimen)
            .WithMany(s => s.Movements)
            .HasForeignKey(d => d.SpecimenId);

      entity.HasOne(d => d.Partner)
            .WithMany()
            .HasForeignKey(d => d.LocationId);

      entity.HasOne(d => d.Contract)
            .WithMany()
            .HasForeignKey(d => d.ContractId);

      entity.Property(d => d.IncrementReasonCode).HasColumnName("IncrementReason");
      entity.Property(d => d.DecrementReasonCode).HasColumnName("DecrementReason");
    });

    // Configure ContractAction entity
    modelBuilder.Entity<ContractAction>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.HasOne(d => d.Contract)
            .WithMany(c => c.ContractActions)
            .HasForeignKey(d => d.ContractId);

      entity.Property(e => e.ActionInitiatorCode).HasColumnName("ActionInitiator");
      entity.Property(e => e.ActionTypeCode).HasColumnName("ActionType");
    });

    // Configure Placement entity
    modelBuilder.Entity<Placement>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.Specimen)
            .WithMany(s => s.Placements)
            .HasForeignKey(d => d.SpecimenId);

      entity.HasOne(d => d.Region)
            .WithMany()
            .HasForeignKey(d => d.RegionId);
    });

    // Configure RecordSpecimen entity
    modelBuilder.Entity<RecordSpecimen>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.Partner)
            .WithMany()
            .HasForeignKey(d => d.PartnerId);

      entity.Property(e => e.ActionTypeCode).HasColumnName("ActionType");
    });

    // Configure RecordSpecies entity
    modelBuilder.Entity<RecordSpecies>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.Species)
            .WithMany()
            .HasForeignKey(d => d.SpeciesId);

      entity.Property(e => e.ActionTypeCode).HasColumnName("ActionType");
    });

    // Configure Zoo entity
    modelBuilder.Entity<Zoo>(entity =>
    {
      entity.HasKey(e => e.Id);
    });

    modelBuilder.Entity<GenderType>(entity =>
    {
      entity.HasKey(e => e.Code);
    });

    modelBuilder.Entity<BirthMethod>(entity =>
    {
      entity.HasKey(e => e.Code);
    });

    modelBuilder.Entity<Rearing>(entity =>
    {
      entity.HasKey(e => e.Code);
    });

    modelBuilder.Entity<User>(entity =>
    {
      entity.HasKey(e => e.Id);
    });

    modelBuilder.Entity<UserRole>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity
        .HasOne(e => e.User)
        .WithMany(u => u.UserRoles)
        .HasForeignKey(e => e.UserId);
    });

    modelBuilder.Entity<UserTableSetting>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity
      .HasOne(e => e.User)
      .WithMany()
      .HasForeignKey(e => e.UserId);
    });

    modelBuilder.Entity<Location>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
      entity.Property(e => e.Note).HasMaxLength(255);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);
      entity.HasOne(d => d.OrganizationLevel)
            .WithMany()
            .HasForeignKey(d => d.OrganizationLevelId);
    });

    modelBuilder.Entity<OrganizationLevel>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Level).IsRequired().HasMaxLength(10);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
      entity.Property(e => e.Director).HasMaxLength(255);
      entity.Property(e => e.JournalApproversGroup).HasMaxLength(1024);
      entity.Property(e => e.JournalReadGroup).HasMaxLength(1024);
      entity.Property(e => e.JournalContributorGroup).HasMaxLength(1024);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);
      entity.HasOne(d => d.Parent)
            .WithMany()
            .HasForeignKey(d => d.ParentId);
    });

    modelBuilder.Entity<SpecimenPlacement>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.SpecimenId).IsRequired();
      entity.Property(e => e.ValidSince).IsRequired().HasMaxLength(10);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);
      entity.Property(e => e.Note).HasMaxLength(255);
      entity.HasOne(d => d.Location)
            .WithMany()
            .HasForeignKey(d => d.LocationId);
      entity.HasOne(d => d.OrganizationLevel)
            .WithMany()
            .HasForeignKey(d => d.OrganizationLevelId);
    });

    modelBuilder.Entity<JournalActionType>(entity =>
    {
      entity.HasKey(e => e.Code);
      entity.Property(e => e.JournalEntryType).HasMaxLength(32);
      entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(32);
      entity.Property(e => e.Note).HasMaxLength(256);
    });

    modelBuilder.Entity<SpecimenImage>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Label).IsRequired().HasMaxLength(255);
      entity.Property(e => e.Description).HasMaxLength(1000);
      entity.Property(e => e.Image).IsRequired();
      entity.HasOne(e => e.Specimen)
            .WithMany(s => s.Images)
            .HasForeignKey(e => e.SpecimenId);
    });

    modelBuilder.Entity<ExpositionArea>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
      entity.Property(e => e.Note).HasMaxLength(1000);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);
    });

    modelBuilder.Entity<UserFlaggedDistrict>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt).IsRequired();

      entity.HasOne(d => d.User)
            .WithMany(u => u.FlaggedDistricts!)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(d => d.District)
            .WithMany()
            .HasForeignKey(d => d.DistrictId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<UserFlaggedSpecies>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt).IsRequired();

      entity.HasOne(d => d.User)
            .WithMany(u => u.FlaggedSpecies!)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

      entity.HasOne(d => d.Species)
            .WithMany()
            .HasForeignKey(d => d.SpeciesId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<ExpositionSet>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
      entity.Property(e => e.Note).HasMaxLength(1000);
      entity.Property(e => e.ModifiedBy).HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);

      entity.HasOne(d => d.ExpositionArea)
            .WithMany(a => a.ExpositionSets)
            .HasForeignKey(d => d.ExpositionAreaId)
            .OnDelete(DeleteBehavior.Restrict);
    });

    modelBuilder.Entity<Location>()
      .HasOne(l => l.ExpositionSet)
      .WithMany(s => s.Locations!)
      .HasForeignKey(l => l.ExpositionSetId)
      .OnDelete(DeleteBehavior.SetNull);

    modelBuilder.Entity<TaxonomyHierarchyViewItem>(entity =>
    {
      entity.ToView("TaxonomyHierarchyView", "dbo");

      entity.HasKey(e => e.SpeciesId);
    });

    modelBuilder.Entity<ExpositionHierarchyViewItem>(entity =>
    {
      entity.ToView("ExpositionHierarchyView", "dbo");

      entity.HasKey(e => e.LocationId);
    });

    modelBuilder.Entity<OrganizationHierarchyViewItem>(entity =>
    {
      entity.ToView("OrganizationHierarchyView", "dbo");

      entity.HasKey(e => e.Id);
    });

    // Configure Journal entities
    modelBuilder.Entity<JournalActionType>(entity =>
    {
      entity.HasKey(e => e.Code);
      entity.Property(e => e.JournalEntryType)
            .HasMaxLength(10);
      entity.Property(e => e.DisplayName)
            .HasMaxLength(50);
      entity.Property(e => e.Note)
            .HasMaxLength(255);
    });

    // modelBuilder.Entity<JournalActionTypeDefinition>(entity =>
    // {
    //   entity.HasKey(e => e.Id);
    //   entity.Property(e => e.ActionTypeCode)
    //         .IsRequired()
    //         .HasMaxLength(10);
    //   entity.Property(e => e.AttributeTypeCode)
    //         .HasMaxLength(10);
    //   entity.Property(e => e.DisplayName)
    //         .IsRequired()
    //         .HasMaxLength(100);
    //   entity.Property(e => e.IsRequired);
    //   entity.Property(e => e.IsSpecimenAttribute);
    //   entity.Property(e => e.Note)
    //         .HasMaxLength(255);

    //   entity.HasOne(d => d.ActionType)
    //         .WithMany()
    //         .HasForeignKey(d => d.ActionTypeCode);
    // });

    modelBuilder.Entity<JournalEntry>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.AuthorName).IsRequired().HasMaxLength(255);
      entity.Property(e => e.EntryDate);
      entity.Property(e => e.EntryType)
            .HasMaxLength(10);
      entity.Property(e => e.Status)
            .HasMaxLength(32);
      entity.Property(e => e.Note)
            .HasMaxLength(1024);
      entity.Property(e => e.CreatedAt);
      entity.Property(e => e.CreatedBy)
            .HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);
      entity.Property(e => e.ModifiedBy)
            .HasMaxLength(64);
      entity.Property(e => e.ReviewedAt);
      entity.Property(e => e.ReviewedBy)
            .HasMaxLength(64);
      entity.Property(e => e.CuratorReviewNote)
            .HasMaxLength(255);
      entity.Property(e => e.ArchiveReviewedAt);
      entity.Property(e => e.ArchiveReviewedBy)
            .HasMaxLength(64);
      entity.Property(e => e.ArchiveReviewNote)
            .HasMaxLength(255);
      entity.Property(e => e.ActionTypeCode);
      entity.Property(e => e.IsDeleted);

      entity.HasOne(d => d.OrganizationLevel)
            .WithMany()
            .HasForeignKey(d => d.OrganizationLevelId);

      entity.HasOne(d => d.ActionType)
            .WithMany()
            .HasForeignKey(d => d.ActionTypeCode);

      entity.HasOne(d => d.Species)
            .WithMany()
            .HasForeignKey(d => d.SpeciesId);
    });

    modelBuilder.Entity<JournalEntrySpecimen>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Note)
            .HasMaxLength(255);
      entity.Property(e => e.ModifiedBy)
            .HasMaxLength(64);

      entity.HasOne(d => d.JournalEntry)
            .WithMany(p => p.Specimens)
            .HasForeignKey(d => d.JournalEntryId);

      entity.HasOne(d => d.Specimen)
            .WithMany()
            .HasForeignKey(d => d.SpecimenId);

      entity.HasIndex(e => new { e.JournalEntryId, e.SpecimenId })
            .IsUnique();
    });

    modelBuilder.Entity<JournalEntryAttribute>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.JournalEntry)
            .WithMany(p => p.Attributes)
            .HasForeignKey(d => d.JournalEntryId);
    });

    modelBuilder.Entity<JournalEntrySpecimenAttribute>(entity =>
    {
      entity.HasKey(e => e.Id);

      entity.HasOne(d => d.JournalEntrySpecimen)
            .WithMany(p => p.Attributes)
            .HasForeignKey(d => d.JournalEntrySpecimenId);
    });

    modelBuilder.Entity<JournalEntryAudit>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ActionType)
            .IsRequired()
            .HasMaxLength(64);
      entity.Property(e => e.SerializedData);
      entity.Property(e => e.ModifiedBy)
            .IsRequired() 
            .HasMaxLength(64);
      entity.Property(e => e.ModifiedAt);

      entity.HasOne(d => d.JournalEntry)
            .WithMany()
            .HasForeignKey(d => d.JournalEntryId);
    });

    modelBuilder.Entity<JournalActionTypesToOrganizationLevels>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.ActionTypeCode)
            .IsRequired()
            .HasMaxLength(5);

      entity.HasOne(d => d.ActionType)
            .WithMany(e =>e.OrganizationLevels)
            .HasForeignKey(d => d.ActionTypeCode);

      entity.HasOne(d => d.OrganizationLevel)
            .WithMany(e => e.JournalActionTypes)
            .HasForeignKey(d => d.OrganizationLevelId);
    });
  }
}
