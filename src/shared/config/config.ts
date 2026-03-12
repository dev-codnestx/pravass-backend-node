import dotenv from 'dotenv';
import Joi from 'joi';

const dotenvPath = process.env['NODE_ENV'] === 'development' ? '.env.dev' : '.env';
console.info('🚀 ~ dotenvPath:', dotenvPath);

dotenv.config({
  path: dotenvPath,
});

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_PROTOCOL: Joi.string().required().description('Mongo Protocol'),
    MONGODB_HOST: Joi.string().required().description('Mongo Host URL'),
    MONGODB_USERNAME: Joi.string().required().description('Mongo DB Name'),
    MONGODB_NAME: Joi.string().required().description('Mongo DB Password'),
    MONGODB_PASSWORD: Joi.string().required().description('Mongo DB Password'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    FRONTEND_URL: Joi.string().required().description('Client url'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) console.info(`Config validation error: ${error.message}`);

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    protocol: envVars.MONGODB_PROTOCOL,
    name: envVars.MONGODB_NAME,
    username: envVars.MONGODB_USERNAME,
    password: envVars.MONGODB_PASSWORD,
    host: envVars.MONGODB_HOST,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  clientUrl: envVars.FRONTEND_URL,
};

export default config;
