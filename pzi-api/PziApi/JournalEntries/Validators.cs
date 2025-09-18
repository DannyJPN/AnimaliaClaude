using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;
using PziApi.Models.Journal;

namespace PziApi.JournalEntries;

public class UpdateValidator : AbstractValidator<Dtos.UpdateRequest>
{
  public UpdateValidator()
  {
    RuleFor(x => x.EntryDate)
        .NotEmpty()
        .Matches(@"^\d{4}/\d{2}/\d{2}$")
        .WithMessage("Entry date must be in format yyyy/MM/dd");

    RuleFor(x => x.EntryType)
        .NotEmpty()
        .Must(x => x == "Bio" || x == "Movement")
        .WithMessage("Entry type must be either 'Bio' or 'Movement'");

    RuleFor(x => x.ActionTypeCode)
        .NotEmpty()
        .MaximumLength(5);

    RuleFor(x => x.OrganizationLevelId)
        .GreaterThan(0);

    RuleFor(x => x.SpeciesId)
        .GreaterThan(0);

    RuleFor(x => x.Note)
        .MaximumLength(1024);

    RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .MaximumLength(64);

    RuleForEach(x => x.Specimens)
        .SetValidator(new SpecimenItemValidator());
  }
}

public class InsertValidator : AbstractValidator<Dtos.InsertRequest>
{
  public InsertValidator()
  {
    RuleFor(x => x.AuthorName)
        .NotEmpty();

    RuleFor(x => x.EntryDate)
        .NotEmpty()
        .Matches(@"^\d{4}/\d{2}/\d{2}$")
        .WithMessage("Entry date must be in format yyyy/MM/dd");

    RuleFor(x => x.EntryType)
        .NotEmpty()
        .Must(x => x == "Bio" || x == "Movement")
        .WithMessage("Entry type must be either 'Bio' or 'Movement'");

    RuleFor(x => x.ActionTypeCode)
        .NotEmpty()
        .MaximumLength(5);

    RuleFor(x => x.OrganizationLevelId)
        .GreaterThan(0);

    RuleFor(x => x.SpeciesId)
        .GreaterThan(0);

    RuleFor(x => x.Note)
        .MaximumLength(1024);

    RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .MaximumLength(64);

    RuleForEach(x => x.Specimens)
        .SetValidator(new SpecimenItemValidator());
  }
}

public class SpecimenItemValidator : AbstractValidator<Dtos.SpecimenUpsertItem>
{
  public SpecimenItemValidator()
  {
    RuleFor(x => x.SpecimenId)
        .GreaterThan(0);

    RuleFor(x => x.Note)
        .MaximumLength(255);
  }
}

public class ChangeStatusValidator : AbstractValidator<Dtos.ChangeStatusRequest>
{
  public ChangeStatusValidator()
  {
    RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .MaximumLength(64);

    RuleFor(x => x.ReviewNote)
        .MaximumLength(1024);
  }
}

public class ApprovalItemValidator : AbstractValidator<Dtos.ApprovalItem>
{
  public ApprovalItemValidator()
  {
    RuleFor(x => x.EntryDate)
        .NotEmpty()
        .Matches(@"^\d{4}/\d{2}/\d{2}$")
        .WithMessage("Entry date must be in format yyyy/MM/dd");

    RuleFor(x => x.EntryType)
        .NotEmpty()
        .Must(x => x == "Bio" || x == "Movement")
        .WithMessage("Entry type must be either 'Bio' or 'Movement'");

    RuleFor(x => x.ActionTypeCode)
        .NotEmpty()
        .MaximumLength(5);

    RuleFor(x => x.OrganizationLevelId)
        .GreaterThan(0);

    RuleFor(x => x.SpeciesId)
        .GreaterThan(0);

    RuleFor(x => x.Note)
        .MaximumLength(1024);

    RuleForEach(x => x.Specimens)
        .SetValidator(new SpecimenItemValidator());
  }
}

public class ProcessApprovalRequestValidator : AbstractValidator<Dtos.ProcessApprovalRequest>
{
  public ProcessApprovalRequestValidator()
  {
    RuleFor(x => x.ModifiedBy)
      .NotEmpty()
      .MaximumLength(64);

    RuleFor(r => r.Items)
      .ForEach(r => r
        .OverrideIndexer((model, collection, element, index) => $"[{element.Id}]")
        .SetValidator(new ApprovalItemValidator())
      );

    RuleFor(x => x.Action)
      .NotEmpty()
      .Must(x => x == JournalActionCodes.EDIT || x == JournalActionCodes.SENT_TO_REVIEW || x == JournalActionCodes.SOLVE || x == JournalActionCodes.CLOSE);
  }
}