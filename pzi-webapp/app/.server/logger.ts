import { createLogger, transports, format } from 'winston';

export function createAppLogger(penv = process.env) {
  const logLevel = penv.APP_LOG_LEVEL || 'info';

  return createLogger({
    level: logLevel,
    format: format.combine(
      format.errors({ stack: true }),
      format.timestamp(),
      format.json()
    ),
    transports: [new transports.Console()]
  });
}

export const logger = createAppLogger();
