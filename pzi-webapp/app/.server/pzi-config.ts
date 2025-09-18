export type PziConfig = {
  NODE_ENV: string,
  SESSION_SECRET: string,
  PZI_API_KEY: string,
  PZI_API_HOST_URL: string,
  SSO_CALLBACK_URL: string,
  SSO_LOGIN_URL: string,
  SSO_AUTH_URL: string,
  AUTH_SECRET: string,
  PRINT_TEMPATES_FOLDER: string,
  ALLOW_TEST_LOGIN: boolean,
  TEST_LOGINS: { name: string, roles: string[] }[],
  GVAR_USER: string,
  GVAR_STREET: string,
  GVAR_PSC2: string,
  GVAR_CITY2: string,
  GVAR_ADMIN: string,
  GVAR_USERNICK: string,
  GVAR_ADDRESS: string,
  GVAR_EMAIL: string,
  GVAR_PHONE: string
};

function parseTestLogins(env: NodeJS.ProcessEnv): { name: string, roles: string[] }[] {
  const testLogins: { name: string, roles: string[] }[] = [];
  const testLoginKeys = env.TEST_LOGINS_KEYS?.split(',') || [];

  testLoginKeys.forEach(key => {
    const name = env[`TEST_LOGINS_${key}_NAME`] || '';
    const roles: string[] = [];

    let roleIndex = 0;
    let roleValue: string | undefined;

    while ((roleValue = env[`TEST_LOGINS_${key}_ROLE__${roleIndex}`])) {
      roles.push(roleValue);
      roleIndex++;
    }

    if (name) {
      testLogins.push({ name, roles });
    }
  });

  return testLogins;
}

export function readPziConfig(env = process.env): PziConfig {
  return {
    NODE_ENV: env.NODE_ENV || '',
    SESSION_SECRET: env.PZI_SESSION_SECRET || 'SECRET',
    PZI_API_KEY: env.PZI_API_KEY || '',
    PZI_API_HOST_URL: env.PZI_API_HOST_URL || '',
    SSO_CALLBACK_URL: env.SSO_CALLBACK_URL || '',
    SSO_LOGIN_URL: env.SSO_LOGIN_URL || '',
    SSO_AUTH_URL: env.SSO_AUTH_URL || '',
    AUTH_SECRET: env.AUTH_SECRET || '',
    PRINT_TEMPATES_FOLDER: env.PRINT_TEMPATES_FOLDER || './print-templates',
    ALLOW_TEST_LOGIN: (/true/i).test(env.ALLOW_TEST_LOGIN ?? 'false'),
    TEST_LOGINS: parseTestLogins(env),
    GVAR_USER: env.GVAR_USER || 'Zoologická zahrada hl.m. Prahy',
    GVAR_STREET: env.GVAR_STREET || 'U Trojského zámku 3/120',
    GVAR_PSC2: env.GVAR_PSC2 || '171 00',
    GVAR_CITY2: env.GVAR_CITY2 || 'Praha 7',
    GVAR_ADMIN: env.GVAR_ADMIN || 'Alena Hofrichterová',
    GVAR_USERNICK: env.GVAR_USERNICK || 'Zoo Praha',
    GVAR_ADDRESS: env.GVAR_ADDRESS || 'U Trojského zámku 3/120, 171 00 Praha 7',
    GVAR_EMAIL: env.GVAR_EMAIL || 'hofrichterova@zoopraha.cz',
    GVAR_PHONE: env.GVAR_PHONE || '+420 296112139'
  };
}

export const pziConfig = readPziConfig();
