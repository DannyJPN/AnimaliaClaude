import jwt from 'jsonwebtoken';
import { auth0Config } from './auth0-config';

export interface Auth0User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
  'custom:roles'?: string[];
  'custom:permissions'?: string[];
  'custom:tenant'?: string;
  organizations?: string[];
}

export interface ProcessedUserData {
  userId: string;
  userName: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenant?: string;
  visibleTaxonomyStatuses: string[];
  taxonomySearchByCz: boolean;
  taxonomySearchByLat: boolean;
}

export class Auth0Service {
  static async verifyToken(token: string): Promise<Auth0User> {
    try {
      // In production, verify with Auth0 public keys
      const decoded = jwt.decode(token) as Auth0User;
      if (!decoded) {
        throw new Error('Invalid token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }

  static async processUserForPziApi(auth0User: Auth0User): Promise<ProcessedUserData> {
    // Extract roles from Auth0 custom claims or app_metadata
    const roles = auth0User['custom:roles'] || [];
    const permissions = auth0User['custom:permissions'] || [];
    const tenant = auth0User['custom:tenant'];

    // Map Auth0 roles to PZI permissions
    const pziRoles = this.mapAuth0RolesToPzi(roles);
    const pziPermissions = this.mapAuth0PermissionsToPzi(permissions, roles);

    return {
      userId: auth0User.sub,
      userName: auth0User.email || auth0User.name,
      email: auth0User.email,
      roles: pziRoles,
      permissions: pziPermissions,
      tenant,
      visibleTaxonomyStatuses: this.getVisibleTaxonomyStatuses(roles),
      taxonomySearchByCz: this.getTaxonomySearchPreference(roles, 'cz'),
      taxonomySearchByLat: this.getTaxonomySearchPreference(roles, 'lat')
    };
  }

  private static mapAuth0RolesToPzi(auth0Roles: string[]): string[] {
    const roleMapping: Record<string, string[]> = {
      'admin': ['Administrator', 'Curator', 'Veterinarian', 'User'],
      'curator': ['Curator', 'User'],
      'veterinarian': ['Veterinarian', 'User'],
      'user': ['User'],
      'documentation': ['Documentation']
    };

    const pziRoles = new Set<string>();

    auth0Roles.forEach(role => {
      const mapped = roleMapping[role.toLowerCase()];
      if (mapped) {
        mapped.forEach(r => pziRoles.add(r));
      }
    });

    return Array.from(pziRoles);
  }

  private static mapAuth0PermissionsToPzi(auth0Permissions: string[], roles: string[]): string[] {
    const permissions = new Set<string>();

    // Add permissions based on Auth0 custom permissions
    auth0Permissions.forEach(permission => {
      permissions.add(permission);
    });

    // Add permissions based on roles
    roles.forEach(role => {
      switch (role.toLowerCase()) {
        case 'admin':
          permissions.add('RECORDS:VIEW');
          permissions.add('RECORDS:EDIT');
          permissions.add('LISTS:VIEW');
          permissions.add('LISTS:EDIT');
          permissions.add('JOURNAL:ACCESS');
          permissions.add('DOCUMENTATION_DEPARTMENT');
          break;
        case 'curator':
          permissions.add('RECORDS:VIEW');
          permissions.add('RECORDS:EDIT');
          permissions.add('LISTS:VIEW');
          permissions.add('JOURNAL:ACCESS');
          break;
        case 'veterinarian':
          permissions.add('RECORDS:VIEW');
          permissions.add('JOURNAL:ACCESS');
          break;
        case 'user':
          permissions.add('RECORDS:VIEW');
          break;
        case 'documentation':
          permissions.add('DOCUMENTATION_DEPARTMENT');
          break;
      }
    });

    return Array.from(permissions);
  }

  private static getVisibleTaxonomyStatuses(roles: string[]): string[] {
    // Default taxonomy statuses based on roles
    const hasAdmin = roles.some(role => role.toLowerCase() === 'admin');
    const hasCurator = roles.some(role => role.toLowerCase() === 'curator');

    if (hasAdmin || hasCurator) {
      return ['active', 'inactive', 'draft', 'pending'];
    }

    return ['active'];
  }

  private static getTaxonomySearchPreference(roles: string[], type: 'cz' | 'lat'): boolean {
    // Default search preferences based on roles and locale
    const hasAdmin = roles.some(role => role.toLowerCase() === 'admin');
    const hasCurator = roles.some(role => role.toLowerCase() === 'curator');

    if (hasAdmin || hasCurator) {
      return true; // Enable both Czech and Latin search for admins/curators
    }

    // For regular users, enable Czech by default, Latin optional
    return type === 'cz';
  }
}