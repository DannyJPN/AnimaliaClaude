import { TenantConfig } from './tenant-service';

export interface SSOConnection {
  id: string;
  name: string;
  strategy: 'saml' | 'oidc' | 'oauth2' | 'ad';
  tenantId: string;
  displayName: string;
  enabled: boolean;
  config: {
    signInEndpoint?: string;
    signOutEndpoint?: string;
    certificate?: string;
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    discoveryUrl?: string;
    domain?: string;
  };
  attributeMapping: {
    email: string;
    name: string;
    groups?: string;
    department?: string;
  };
}

export const SSO_CONNECTIONS: SSOConnection[] = [
  {
    id: 'con_zoo_praha_ad',
    name: 'Zoo Praha Active Directory',
    strategy: 'ad',
    tenantId: 'zoo-praha',
    displayName: 'Zoo Praha AD',
    enabled: true,
    config: {
      domain: 'zoopraha.local',
      // These would be configured in Auth0 dashboard
    },
    attributeMapping: {
      email: 'mail',
      name: 'displayName',
      groups: 'memberOf',
      department: 'department'
    }
  },
  {
    id: 'con_zoo_brno_saml',
    name: 'Zoo Brno SAML',
    strategy: 'saml',
    tenantId: 'zoo-brno',
    displayName: 'Zoo Brno SAML',
    enabled: true,
    config: {
      signInEndpoint: 'https://sso.zoobrno.cz/saml/sso',
      signOutEndpoint: 'https://sso.zoobrno.cz/saml/slo',
      issuer: 'https://sso.zoobrno.cz'
    },
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      groups: 'http://schemas.xmlsoap.org/claims/Group',
      department: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department'
    }
  },
  {
    id: 'con_google_workspace',
    name: 'Google Workspace',
    strategy: 'oauth2',
    tenantId: 'default',
    displayName: 'Google Workspace',
    enabled: true,
    config: {
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret'
    },
    attributeMapping: {
      email: 'email',
      name: 'name',
      groups: 'groups'
    }
  },
  {
    id: 'con_azure_ad',
    name: 'Azure Active Directory',
    strategy: 'oidc',
    tenantId: 'default',
    displayName: 'Microsoft Azure AD',
    enabled: false,
    config: {
      discoveryUrl: 'https://login.microsoftonline.com/your-tenant-id/v2.0/.well-known/openid_configuration',
      clientId: 'your-azure-client-id',
      clientSecret: 'your-azure-client-secret'
    },
    attributeMapping: {
      email: 'email',
      name: 'name',
      groups: 'groups'
    }
  }
];

export class SSOService {
  static getConnectionsForTenant(tenantId: string): SSOConnection[] {
    return SSO_CONNECTIONS.filter(conn =>
      conn.tenantId === tenantId && conn.enabled
    );
  }

  static getConnectionById(connectionId: string): SSOConnection | undefined {
    return SSO_CONNECTIONS.find(conn => conn.id === connectionId);
  }

  static generateSSOLoginUrl(
    connection: SSOConnection,
    tenant: TenantConfig,
    returnUrl?: string
  ): string {
    const { auth0Config } = require('./auth0-config');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: auth0Config.clientId,
      redirect_uri: auth0Config.redirectUri || '',
      scope: auth0Config.scope || 'openid profile email',
      connection: connection.id,
      state: JSON.stringify({
        tenant: tenant.id,
        returnUrl: returnUrl || '/',
        sso: connection.id
      })
    });

    if (auth0Config.audience) {
      params.append('audience', auth0Config.audience);
    }

    return `https://${auth0Config.domain}/authorize?${params.toString()}`;
  }

  static mapGroupsToRoles(groups: string[], connection: SSOConnection): string[] {
    // Define group to role mappings for each connection
    const groupRoleMappings: Record<string, Record<string, string[]>> = {
      'con_zoo_praha_ad': {
        'CN=Zoo-Admins,OU=Groups,DC=zoopraha,DC=local': ['admin'],
        'CN=Zoo-Curators,OU=Groups,DC=zoopraha,DC=local': ['curator'],
        'CN=Zoo-Vets,OU=Groups,DC=zoopraha,DC=local': ['veterinarian'],
        'CN=Zoo-Users,OU=Groups,DC=zoopraha,DC=local': ['user'],
        'CN=Zoo-Documentation,OU=Groups,DC=zoopraha,DC=local': ['documentation']
      },
      'con_zoo_brno_saml': {
        'administrators': ['admin'],
        'curators': ['curator'],
        'veterinarians': ['veterinarian'],
        'users': ['user'],
        'documentation': ['documentation']
      },
      'con_google_workspace': {
        'admins@pzi.cz': ['admin'],
        'curators@pzi.cz': ['curator'],
        'vets@pzi.cz': ['veterinarian'],
        'users@pzi.cz': ['user']
      },
      'con_azure_ad': {
        'PZI-Administrators': ['admin'],
        'PZI-Curators': ['curator'],
        'PZI-Veterinarians': ['veterinarian'],
        'PZI-Users': ['user']
      }
    };

    const mapping = groupRoleMappings[connection.id] || {};
    const roles = new Set<string>();

    groups.forEach(group => {
      const mappedRoles = mapping[group];
      if (mappedRoles) {
        mappedRoles.forEach(role => roles.add(role));
      }
    });

    return Array.from(roles);
  }

  static processIdTokenClaims(idToken: any, connection: SSOConnection): {
    email: string;
    name: string;
    groups?: string[];
    department?: string;
  } {
    const mapping = connection.attributeMapping;

    return {
      email: idToken[mapping.email] || '',
      name: idToken[mapping.name] || '',
      groups: mapping.groups ? this.extractGroups(idToken[mapping.groups]) : undefined,
      department: mapping.department ? idToken[mapping.department] : undefined
    };
  }

  private static extractGroups(groupsData: any): string[] {
    if (!groupsData) return [];

    if (typeof groupsData === 'string') {
      return [groupsData];
    }

    if (Array.isArray(groupsData)) {
      return groupsData.map(g => typeof g === 'string' ? g : String(g));
    }

    return [];
  }

  static isSSOEnabled(tenantId: string): boolean {
    return SSO_CONNECTIONS.some(conn =>
      conn.tenantId === tenantId && conn.enabled
    );
  }

  static getSSODisplayOptions(tenantId: string): Array<{
    id: string;
    displayName: string;
    strategy: string;
  }> {
    return this.getConnectionsForTenant(tenantId).map(conn => ({
      id: conn.id,
      displayName: conn.displayName,
      strategy: conn.strategy
    }));
  }
}