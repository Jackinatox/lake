import pino from 'pino';

const logger = pino({
    level: 'info', // You can change to 'debug' or 'warn' as needed
    formatters: {
      level(label) {
        return { level: label };
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: null,
  });

logger.info('logger initialized');

export default logger;