const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: isProduction ? 'info' : isTest ? 'silent' : 'debug',
  transport: !isProduction && !isTest ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined,
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.otp']
});

module.exports = logger;
