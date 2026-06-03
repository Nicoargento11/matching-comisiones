import * as Joi from 'joi';
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  // DB
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_JWT_ISSUER: Joi.string().uri().optional(),
  SUPABASE_JWT_AUDIENCE: Joi.string().default('authenticated'),
  CORS_ORIGIN: Joi.string().optional().default('*'),
  // Supabase Storage
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_STORAGE_BUCKET: Joi.string().default('comprobantes'),
  // PDF generation
  CHROME_EXECUTABLE_PATH: Joi.string().required(),
  // SMTP / Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_FROM: Joi.string().required(),
});
