# Security & Secrets Management

## Overview
This document describes how to securely manage sensitive configuration data in the PZI application.

## 🔐 Never Commit Secrets
**CRITICAL**: Never commit passwords, API keys, or other sensitive data to version control!

## Development Environment

### Method 1: Environment Variables (Recommended)

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual credentials**:
   ```bash
   # Database password
   POSTGRES_PASSWORD=your_actual_password

   # Connection string (overrides appsettings)
   ConnectionStrings__Default=Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=your_actual_password
   ```

3. **Load environment variables**:
   ```bash
   # Linux/macOS
   source .env

   # Or use docker-compose (automatically loads .env)
   docker-compose up
   ```

### Method 2: .NET User Secrets (Development Only)

For local .NET development, use User Secrets:

```bash
cd pzi-api/PziApi

# Set connection string
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=your_password"

# Set API keys
dotnet user-secrets set "Pzi:ApiKeys:0" "your_api_key_1"
dotnet user-secrets set "Pzi:ApiKeys:1" "your_api_key_2"

# Set Auth0 configuration
dotnet user-secrets set "Auth0:Domain" "your-domain.auth0.com"
dotnet user-secrets set "Auth0:ClientId" "your_client_id"
dotnet user-secrets set "Auth0:ClientSecret" "your_client_secret"
```

User secrets are stored locally at:
- **Windows**: `%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json`
- **Linux/macOS**: `~/.microsoft/usersecrets/<user_secrets_id>/secrets.json`

## Production Environment

### Azure Key Vault (Recommended)

1. **Create Azure Key Vault**:
   ```bash
   az keyvault create --name pzi-keyvault --resource-group pzi-rg --location westeurope
   ```

2. **Store secrets**:
   ```bash
   az keyvault secret set --vault-name pzi-keyvault --name "ConnectionStrings--Default" --value "your_connection_string"
   az keyvault secret set --vault-name pzi-keyvault --name "Auth0--ClientSecret" --value "your_client_secret"
   ```

3. **Configure App Service**:
   - Enable Managed Identity for App Service
   - Grant Key Vault access to Managed Identity
   - Reference secrets in configuration:
     ```json
     {
       "ConnectionStrings": {
         "Default": "@Microsoft.KeyVault(VaultName=pzi-keyvault;SecretName=ConnectionStrings--Default)"
       }
     }
     ```

### Environment Variables (Alternative)

Configure in Azure App Service → Configuration → Application Settings:

```
ConnectionStrings__Default = Host=prod-db.postgres.database.azure.com;Database=pzi;Username=admin;Password=***
Auth0__Domain = your-domain.auth0.com
Auth0__ClientId = ***
Auth0__ClientSecret = ***
POSTGRES_PASSWORD = ***
```

## Docker Deployment

### Using .env file
```bash
# Create .env file (not committed to git)
cat > .env << EOF
POSTGRES_PASSWORD=secure_password_here
ConnectionStrings__Default=Host=postgresql;Database=pzi;Username=postgres;Password=secure_password_here
EOF

# Run with docker-compose
docker-compose up -d
```

### Using Docker Secrets (Swarm/K8s)
```bash
# Create secrets
echo "my_secure_password" | docker secret create postgres_password -

# Reference in docker-compose.yml
secrets:
  postgres_password:
    external: true
```

## CI/CD Pipeline

### GitHub Actions Secrets

Store sensitive data in GitHub repository secrets:

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `POSTGRES_PASSWORD`
   - `AUTH0_CLIENT_SECRET`
   - `ACR_USER`
   - `ACR_PASSWORD`

Reference in workflow:
```yaml
env:
  ConnectionStrings__Default: ${{ secrets.DB_CONNECTION_STRING }}
  Auth0__ClientSecret: ${{ secrets.AUTH0_CLIENT_SECRET }}
```

## Configuration Priority

.NET configuration sources are loaded in this order (later sources override earlier):

1. `appsettings.json`
2. `appsettings.{Environment}.json`
3. User Secrets (Development only)
4. Environment Variables
5. Command-line arguments

**Best Practice**: Store default/non-sensitive values in `appsettings.json`, override with environment variables or User Secrets.

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded passwords in `appsettings.json` or `appsettings.Development.json`
- [ ] Production secrets stored in Azure Key Vault or secure environment variables
- [ ] User Secrets configured for local development
- [ ] CI/CD secrets configured in GitHub Actions
- [ ] Connection strings use environment variable overrides
- [ ] Regular secret rotation policy in place

## Troubleshooting

### "Connection failed" errors

1. **Check environment variables are loaded**:
   ```bash
   echo $ConnectionStrings__Default
   ```

2. **Verify .NET reads the connection string**:
   ```bash
   dotnet run --project pzi-api/PziApi
   # Check logs for connection string source
   ```

3. **Test PostgreSQL connection**:
   ```bash
   psql "Host=localhost;Port=5432;Database=pzi;Username=postgres;Password=your_password"
   ```

### User Secrets not working

1. **Verify user secrets are initialized**:
   ```bash
   dotnet user-secrets list --project pzi-api/PziApi
   ```

2. **Check csproj has UserSecretsId**:
   ```xml
   <PropertyGroup>
     <UserSecretsId>your-unique-id</UserSecretsId>
   </PropertyGroup>
   ```

## References

- [.NET User Secrets](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Environment Variables in .NET](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
