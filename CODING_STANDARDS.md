# Coding Standards

Tento dokument definuje coding standards a naming conventions pro projekt Animalia.

## Obsah

- [TypeScript/JavaScript](#typescriptjavascript)
- [C#/.NET](#cnet)
- [Nástroje pro kontrolu kódu](#nástroje-pro-kontrolu-kódu)

## TypeScript/JavaScript

### Naming Conventions

#### camelCase
Používá se pro:
- Proměnné
- Funkce
- Parametry funkcí
- Metody objektů

```typescript
// ✅ Správně
const userName = "John";
let itemCount = 0;
function calculateTotal(price: number, quantity: number) { }
const getData = async () => { };
```

```typescript
// ❌ Špatně
const UserName = "John";
let item_count = 0;
function CalculateTotal(price: number, quantity: number) { }
```

#### PascalCase
Používá se pro:
- Typy (type aliases)
- Rozhraní (interfaces)
- Třídy (classes)
- React komponenty
- Enums

```typescript
// ✅ Správně
type UserProfile = {
  name: string;
  email: string;
};

interface ApiResponse {
  data: unknown;
  status: number;
}

class DataService {
  fetchData() { }
}

function UserCard({ name }: { name: string }) {
  return <div>{name}</div>;
}

enum StatusCode {
  Success = 200,
  NotFound = 404,
}
```

```typescript
// ❌ Špatně
type userProfile = { };
interface apiResponse { }
class dataService { }
function userCard() { }
enum statusCode { }
```

#### UPPER_SNAKE_CASE
Používá se pro:
- Konstanty (readonly primitivní hodnoty)
- Konfigurační hodnoty
- Enumerační hodnoty v objektech (když není použit enum)

```typescript
// ✅ Správně
const API_BASE_URL = "https://api.example.com";
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

export const JOURNAL_ACTION_TYPE_SEX: JournalActionTypeCodes = 'BT19';
export const RECORDS_VIEW = "RECORDS:VIEW" as const;
```

```typescript
// ❌ Špatně
const apiBaseUrl = "https://api.example.com"; // Pokud je to konstanta, použijte UPPER_SNAKE_CASE
const maxRetryCount = 3; // Pokud je to konstanta, použijte UPPER_SNAKE_CASE
```

**Poznámka:** Pro objekty konstant nebo pole použijte PascalCase:

```typescript
// ✅ Správně
export const JOURNAL_STATUSES: { key: JournalEntryStatus, text: string }[] = [
  { key: '1-review', text: 'Zadán' },
  { key: '2-closed_in_review', text: 'Hotovo' },
];

export const TenantConfigs: TenantConfig[] = [...];
```

### Formátování kódu

- **Indentace**: 2 mezery (nikoli taby)
- **Středníky**: Vždy používat středníky na konci příkazů
- **Uvozovky**: Dvojité uvozovky (`"`) pro řetězce
- **Maximální délka řádku**: 120 znaků
- **Trailing comma**: Používat v multiline objektech a polích (ES5 standard)

### Strukturování souborů

```
app/
├── routes/           # Route komponenty
├── components/       # Znovupoužitelné komponenty
├── .server/          # Server-side kód
│   ├── services/     # Business logika
│   └── utils/        # Pomocné funkce
├── utils/            # Client-side utility funkce
└── shared/           # Sdílený kód (types, constants)
```

### Doporučené postupy

1. **Používejte explicitní typy tam, kde to zlepší čitelnost**
   ```typescript
   // ✅ Dobré
   function processUser(user: UserProfile): ProcessedUser {
     // ...
   }
   ```

2. **Preferujte `const` před `let`, vyhýbejte se `var`**
   ```typescript
   // ✅ Správně
   const items = [];
   let count = 0;

   // ❌ Špatně
   var data = {};
   ```

3. **Používejte arrow funkce pro callbacks**
   ```typescript
   // ✅ Dobré
   items.map((item) => item.id);

   // Méně preferované
   items.map(function(item) { return item.id; });
   ```

4. **Destrukturujte objekty a pole kde je to vhodné**
   ```typescript
   // ✅ Dobré
   const { name, email } = user;
   const [first, second] = array;
   ```

## C#/.NET

### Naming Conventions

#### PascalCase
Používá se pro:
- Třídy (classes)
- Rozhraní (interfaces, s prefixem `I`)
- Struktury (structs)
- Enums a jejich hodnoty
- Vlastnosti (properties)
- Metody (methods)
- Veřejná pole (public fields)
- Konstanty

```csharp
// ✅ Správně
public class UserService
{
  public string UserName { get; set; }
  public const int MaxRetries = 3;

  public void ProcessData()
  {
    // ...
  }
}

public interface IDataService
{
  void FetchData();
}

public enum StatusCode
{
  Success,
  NotFound,
  ServerError
}
```

```csharp
// ❌ Špatně
public class userService  // Mělo by být PascalCase
{
  public string userName { get; set; }  // Property - mělo by být PascalCase
  public void processData() { }  // Metoda - měla by být PascalCase
}
```

#### camelCase
Používá se pro:
- Privátní pole (private fields)
- Lokální proměnné
- Parametry metod

```csharp
// ✅ Správně
public class DataProcessor
{
  private readonly ILogger logger;
  private int itemCount;

  public void ProcessItems(int batchSize)
  {
    var totalProcessed = 0;
    // ...
  }
}
```

```csharp
// ❌ Špatně
public class DataProcessor
{
  private readonly ILogger Logger;  // Privátní pole - mělo by být camelCase
  private int ItemCount;  // Privátní pole - mělo by být camelCase
}
```

### Rozhraní (Interfaces)

Rozhraní musí začínat prefixem `I`:

```csharp
// ✅ Správně
public interface IUserRepository
{
  Task<User> GetByIdAsync(int id);
}

public interface IEmailService
{
  Task SendEmailAsync(string to, string subject, string body);
}
```

### Multi-tenant architektura

**DŮLEŽITÉ**: Všechny entity musí dědit z `TenantEntity` a obsahovat `TenantId`:

```csharp
// ✅ Správně
public class Specimen : TenantEntity
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;
  // TenantId je zděděn z TenantEntity
}
```

### Formátování kódu

- **Indentace**: 2 mezery
- **Složené závorky**: Vždy na novém řádku (Allman style)
  ```csharp
  if (condition)
  {
    // kód
  }
  ```
- **Nullable reference types**: Povoleno (`<Nullable>enable</Nullable>`)
- **Používejte `var` pouze když je typ zřejmý**
  ```csharp
  // ✅ Dobré
  var items = new List<Item>();
  var count = GetCount();

  // ❌ Vyhněte se
  var data = ProcessData(); // Není jasné, co ProcessData vrací
  ```

### Doporučené postupy

1. **Async/Await pro I/O operace**
   ```csharp
   public async Task<User> GetUserAsync(int id)
   {
     return await dbContext.Users.FindAsync(id);
   }
   ```

2. **Používejte expression-bodied members pro jednoduché gettery**
   ```csharp
   public string FullName => $"{FirstName} {LastName}";
   ```

3. **Dependency Injection**
   ```csharp
   public class UserController : ControllerBase
   {
     private readonly IUserService userService;

     public UserController(IUserService userService)
     {
       this.userService = userService;
     }
   }
   ```

4. **FluentValidation pro validaci**
   ```csharp
   public class UserValidator : AbstractValidator<User>
   {
     public UserValidator()
     {
       RuleFor(x => x.Email).NotEmpty().EmailAddress();
       RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
     }
   }
   ```

## Nástroje pro kontrolu kódu

### Frontend (TypeScript/React)

#### ESLint
ESLint je nakonfigurován v `.eslintrc.json` a kontroluje:
- TypeScript pravidla
- React best practices
- React Hooks pravidla
- Bezpečnostní problémy

**Spuštění:**
```bash
cd pzi-webapp
npm run lint          # Kontrola
npm run lint:fix      # Automatické opravy
```

#### Prettier
Prettier zajišťuje konzistentní formátování kódu.

**Spuštění:**
```bash
cd pzi-webapp
npm run format        # Naformátovat kód
npm run format:check  # Pouze zkontrolovat
```

**Integrace s editorem:**
- VS Code: Nainstalujte rozšíření "Prettier - Code formatter"
- Nastavte "Format on Save" v nastavení

### Backend (C#/.NET)

#### EditorConfig
EditorConfig definuje pravidla formátování a naming conventions v `.editorconfig`.

**Automaticky aplikováno:**
- Visual Studio
- Visual Studio Code (s rozšířením EditorConfig)
- Rider

#### .NET Analyzers
.NET analyzery jsou nakonfigurovány v `Directory.Build.props` a kontrolují:
- Naming conventions
- Code quality pravidla
- Best practices

**Spuštění:**
```bash
cd pzi-api
dotnet build  # Build zkontroluje pravidla
```

### EditorConfig (celý projekt)

Root `.editorconfig` definuje základní pravidla pro celý projekt:
- Charset: UTF-8
- End of line: LF
- Indentace podle typu souboru
- Trailing whitespace

## Kontrolní seznam pro code review

### TypeScript/React
- [ ] Jsou použity správné naming conventions?
- [ ] Je kód naformátován pomocí Prettier?
- [ ] Neexistují ESLint varování?
- [ ] Jsou typy definovány tam, kde je to potřeba?
- [ ] Jsou React komponenty správně pojmenované (PascalCase)?

### C#/.NET
- [ ] Jsou použity správné naming conventions?
- [ ] Obsahují entity `TenantId` (pokud jsou tenant-specific)?
- [ ] Jsou použity async/await pro I/O operace?
- [ ] Je validace implementována pomocí FluentValidation?
- [ ] Neexistují analyzer warnings?
- [ ] Jsou rozhraní pojmenována s prefixem `I`?

## Reference

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [.NET Naming Guidelines](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/naming-guidelines)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
