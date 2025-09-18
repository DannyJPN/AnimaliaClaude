using System.Runtime.Serialization;

namespace PziApi.CrossCutting;

public enum InZooFilterEnum
{
  /// <summary>Žádný speciální filtr (výchozí).</summary>
  [EnumMember(Value = "nostate")]
  None,

  /// <summary>Povinnost regulace.</summary>
  [EnumMember(Value = "reg")]
  Reg,

  /// <summary>EU fauna (výskyt v EU).</summary>
  [EnumMember(Value = "eufauna")]
  Eufauna,

  /// <summary>Česká ochrana (CR ochrana).</summary>
  [EnumMember(Value = "crprotection")]
  CrProtection,

  /// <summary>Bez Eupermit.</summary>
  [EnumMember(Value = "noeupermit")]
  NoEuPermit,

  /// <summary>Bez Eupermit s reg. povin.</summary>
  [EnumMember(Value = "noeupermitregonly")]
  NoEuPermitRegOnly,

  /// <summary>Dle rozhodnuti - EU fauna.</summary>
  [EnumMember(Value = "decisioneu")]
  DecisionEuFauna,

  /// <summary>Dle rozhodnuti - Česká vynimka.</summary>
  [EnumMember(Value = "decisioncr")]
  DecisionCrException,

  /// <summary>EU fauna bez české ochrany.</summary>
  [EnumMember(Value = "eufaunareduced")]
  EuFaunaReduced
}
