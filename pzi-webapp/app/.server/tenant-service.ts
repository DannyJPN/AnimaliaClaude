export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  emailDomains: string[];
  auth0ConnectionId?: string;
  customBranding?: {
    logo?: string;
    primaryColor?: string;
    backgroundColor?: string;
  };
}

export const TENANT_CONFIGS: TenantConfig[] = [
  {
    id: 'zoo-praha',
    name: 'Zoo Praha',
    domain: 'zoopraha.cz',
    subdomain: 'praha',
    emailDomains: ['zoopraha.cz', 'prague-zoo.cz'],
    auth0ConnectionId: 'con_zoo_praha_ad',
    customBranding: {
      logo: '/logos/zoo-praha.png',
      primaryColor: '#2E7D32',
      backgroundColor: '#E8F5E8'
    }
  },
  {
    id: 'zoo-brno',
    name: 'Zoo Brno',
    domain: 'zoobrno.cz',
    subdomain: 'brno',
    emailDomains: ['zoobrno.cz', 'brno-zoo.cz'],
    auth0ConnectionId: 'con_zoo_brno_ad',
    customBranding: {
      logo: '/logos/zoo-brno.png',
      primaryColor: '#1976D2',
      backgroundColor: '#E3F2FD'
    }
  },
  {
    id: 'default',
    name: 'PZI System',
    domain: 'pzi.cz',
    emailDomains: ['pzi.cz'],
    customBranding: {
      logo: '/logos/pzi-default.png',
      primaryColor: '#795548',
      backgroundColor: '#EFEBE9'
    }
  }
];

export class TenantService {
  static getTenantFromSubdomain(hostname: string): TenantConfig {
    const subdomain = hostname.split('.')[0];
    const tenant = TENANT_CONFIGS.find(t => t.subdomain === subdomain);
    return tenant || TENANT_CONFIGS.find(t => t.id === 'default')!;
  }

  static getTenantFromEmailDomain(email: string): TenantConfig {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return TENANT_CONFIGS.find(t => t.id === 'default')!;
    }

    const tenant = TENANT_CONFIGS.find(t =>
      t.emailDomains.some(domain => domain.toLowerCase() === emailDomain)
    );

    return tenant || TENANT_CONFIGS.find(t => t.id === 'default')!;
  }

  static getTenantById(tenantId: string): TenantConfig | undefined {
    return TENANT_CONFIGS.find(t => t.id === tenantId);
  }

  static getAllTenants(): TenantConfig[] {
    return TENANT_CONFIGS;
  }

  static generateAuth0LoginUrl(tenant: TenantConfig, returnUrl?: string): string {
    const { auth0Config } = require('./auth0-config');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: auth0Config.clientId,
      redirect_uri: auth0Config.redirectUri || '',
      scope: auth0Config.scope || 'openid profile email',
      state: JSON.stringify({
        tenant: tenant.id,
        returnUrl: returnUrl || '/'
      })
    });

    if (auth0Config.audience) {
      params.append('audience', auth0Config.audience);
    }

    // Add connection hint for tenant-specific identity providers
    if (tenant.auth0ConnectionId) {
      params.append('connection', tenant.auth0ConnectionId);
    }

    return `https://${auth0Config.domain}/authorize?${params.toString()}`;
  }

  static extractTenantFromState(state: string): { tenant?: string; returnUrl?: string } {
    try {
      return JSON.parse(state);
    } catch {
      return {};
    }
  }

  static getCustomBrandingCss(tenant: TenantConfig): string {
    if (!tenant.customBranding) return '';

    return `
      :root {
        --tenant-primary-color: ${tenant.customBranding.primaryColor || '#1976D2'};
        --tenant-background-color: ${tenant.customBranding.backgroundColor || '#ffffff'};
      }

      .tenant-logo {
        background-image: url('${tenant.customBranding.logo || '/logos/default.png'}');
      }

      .tenant-primary {
        color: var(--tenant-primary-color);
      }

      .tenant-bg {
        background-color: var(--tenant-background-color);
      }
    `;
  }
}