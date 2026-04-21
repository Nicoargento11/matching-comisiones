import * as Joi from 'joi';
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  // DB
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  //   SUPABASE_URL: Joi.string().uri().required(),
  //   SUPABASE_JWT_ISSUER: Joi.string().uri().required(),
  //   SUPABASE_JWT_AUDIENCE: Joi.string().default('authenticated'),
});
