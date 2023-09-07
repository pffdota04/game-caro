import * as Joi from 'joi';

export const schema = {
  APP_ENV: Joi.string().default('local'),
  APP_NAME: Joi.string().default('game-gm-be'),
  PORT: Joi.number().default(3010),

  // rate limit
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(120),

  // redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_PREFIX: Joi.string().required(),

  // game api
  // MY_API: Joi.string().required(),
};

export type ConfigSchema = {
  [k in keyof typeof schema]: string;
};

export const configuration = () => {
  return Object.keys(schema).reduce((result, value) => {
    result[value] = process.env[value];
    return result;
  }, {});
};

export const validationSchema = Joi.object(schema);
