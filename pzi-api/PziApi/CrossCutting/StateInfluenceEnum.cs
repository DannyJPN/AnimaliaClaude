using System;
using System.Runtime.Serialization;

namespace PziApi.CrossCutting;

public enum StateInfluenceEnum
{
    /// <summary>S vlivem na stav v ZOO.</summary>
    [EnumMember(Value = "withinfluence")]
    WithInfluence,
    
    /// <summary>Bez vlivu na stav v ZOO.</summary>
    [EnumMember(Value = "withoutinfluence")]
    WithoutInfluence
}
