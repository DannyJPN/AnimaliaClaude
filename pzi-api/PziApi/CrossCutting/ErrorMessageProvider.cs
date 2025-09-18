namespace PziApi.CrossCutting;

public static class ErrorMessageProvider
{
    private static readonly Dictionary<string, string> ErrorMessages = new()
    {
        { ErrorCodes.ERR_TOO_LONG, "Hodnota je příliš dlouhá." },
        { ErrorCodes.ERR_EMPTY, "Hodnota nesmí být prázdná." },
        { ErrorCodes.ERR_DUPLICATE_VALUE, "Tato hodnota již existuje." },
        { ErrorCodes.ERR_TOO_MANY_RESULTS, "Příliš mnoho výsledků." },
        { ErrorCodes.ERR_INVALID_FORMAT, "Neplatný formát." },
        { ErrorCodes.ERR_INVALID_VALUE, "Neplatná hodnota." },
        { ErrorCodes.ERR_INVALID_STATE, "Neplatný stav záznamu." },
        { ErrorCodes.ERR_NOT_FOUND, "Záznam nebyl nalezen." },
        { ErrorCodes.ERR_MUTUALLY_EXCLUSIVE, "Vzájemně se vylučující hodnoty." },
        { ErrorCodes.ERR_REQUIRED_ALTERNATIVE, "Je vyžadována alternativní hodnota." },
        { ErrorCodes.ERR_ENTRY_LOCKED, "Záznam je uzamčen." },
        { ErrorCodes.ERR_ENTRY_DELETED, "Záznam byl smazán." }
    };

    public static string GetMessage(string errorCode, string? customMessage = null)
    {
        if (customMessage != null)
            return customMessage;

        return ErrorMessages.TryGetValue(errorCode, out var message) 
            ? message 
            : "Neočekávaná chyba.";
    }
}
