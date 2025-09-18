using FluentValidation.Results;
using NJsonSchema.Annotations;

namespace PziApi.CrossCutting;

public class CommonDtos
{
  public static void FillValidationErrorsDictionary(Dictionary<string, List<ValidationError>> errors, ValidationResult validationResult)
  {
    foreach (var error in validationResult.Errors)
    {
      if (!errors.ContainsKey(error.PropertyName))
      {
        errors[error.PropertyName] = new List<ValidationError>();
      }

      errors[error.PropertyName].Add(
        new ValidationError(error.ErrorCode, error.ErrorMessage)
      );
    }
  }

  public record ValidationError(string code, string message);

  public class ValidationErrors
  {
    private ValidationErrors() { }

    public Dictionary<string, List<ValidationError>> Errors { get; } = [];

    public bool HasErrors()
    {
      return Errors.Count > 0;
    }

    public static ValidationErrors FromFluentValidation(ValidationResult validationResult)
    {
      var validationErrors = new ValidationErrors();

      FillValidationErrorsDictionary(validationErrors.Errors, validationResult);

      return validationErrors;
    }

    public static ValidationErrors Single(string key, string code, string message)
    {
      var validationErrors = new ValidationErrors();

      validationErrors.Errors.Add(key, [new ValidationError(code, message)]);

      return validationErrors;
    }

    public static ValidationErrors Multiple((string key, string code, string message)[] errors)
    {
      var validationErrors = new ValidationErrors();

      foreach (var (key, code, message) in errors)
      {
        validationErrors.Errors.Add(key, [new ValidationError(code, message)]);
      }

      return validationErrors;
    }
  }

  public class SuccessResult
  {
    private static readonly SuccessResult DEFAULT = FromFluentValidation(new ValidationResult());

    public Dictionary<string, List<ValidationError>> Warnings { get; protected set; } = [];

    protected SuccessResult()
    {
    }

    public static SuccessResult FromFluentValidation(ValidationResult validationResult)
    {
      var warnings = new Dictionary<string, List<ValidationError>>();

      FillValidationErrorsDictionary(warnings, validationResult);

      return new SuccessResult
      {
        Warnings = warnings
      };
    }

    public static SuccessResult DefaultResult()
    {
      return DEFAULT;
    }
  }

  public class SuccessResult<T> : SuccessResult
  {
    public T? Item { get; private set; }

    public static SuccessResult<T> FromItemAndFluentValidation(T item, ValidationResult validationResult)
    {
      var warnings = new Dictionary<string, List<ValidationError>>();

      FillValidationErrorsDictionary(warnings, validationResult);

      return new SuccessResult<T>
      {
        Item = item,
        Warnings = warnings
      };
    }

    public static SuccessResult<T> FromItem(T item)
    {
      return new SuccessResult<T>
      {
        Item = item,
        Warnings = new Dictionary<string, List<ValidationError>>()
      };
    }
  }

  public record Paging(int PageIndex, int PageSize);

  public record Sorting(string SortId, string Dir);

  public record Filtering(string FilterId, string[] Values);

  public record PagedResult<T>(List<T> Items, int TotalCount, int PageIndex, int PageSize);
}
