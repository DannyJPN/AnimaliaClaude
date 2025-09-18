using System;
using PziApi.Models;

namespace PziApi.SpecimensMarkings;

public class MarkingsCalculations
{
  public class CalculatedMarkings
  {
    public string? Notch { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? OtherMarking { get; set; }
  }

  private static string? JoinMarkings(IEnumerable<string> markings)
  {
    return markings.Count() == 0
      ? null
      : string.Join(" | ", markings);
  }

  private static string GetMarkingText(Marking marking)
  {
    var parts = new List<string>
    {
      marking.RingNumber!
    };

    if (!string.IsNullOrEmpty(marking.Color))
    {
      parts.Add(marking.Color);
    }

    if (!string.IsNullOrEmpty(marking.LocatedOn))
    {
      parts.Add(marking.LocatedOn);
    }

    if (!string.IsNullOrEmpty(marking.Side))
    {
      var sidePart = marking.Side == "L"
        ? "left"
        : marking.Side == "P"
          ? "right"
          : "unknown";

      parts.Add(sidePart);
    }

    return string.Join(" ", parts);
  }

  public static CalculatedMarkings CalculateMarkings(IEnumerable<Marking> activeMarkings)
  {
    var notches = new List<string>();
    var chips = new List<string>();
    var rings = new List<string>();
    var otherMarkings = new List<string>();

    var markingsForCalculation = activeMarkings
                                      .Where(am => am.IsValid)
                                      .OrderBy(am => am.MarkingDate)
                                      .ToArray();

    foreach (var marking in markingsForCalculation)
    {
      var markingText = GetMarkingText(marking);

      switch (marking.MarkingTypeCode)
      {
        case "VRUB":
          notches.Add(markingText);
          break;

        case "CHIP":
          chips.Add(markingText);
          break;

        case "KRUH":
          rings.Add(markingText);
          break;

        default:
          otherMarkings.Add(markingText);
          break;
      }
    }

    return new CalculatedMarkings
    {
      Notch = JoinMarkings(notches),
      Chip = JoinMarkings(chips),
      RingNumber = JoinMarkings(rings),
      OtherMarking = JoinMarkings(otherMarkings)
    };
  }
}
