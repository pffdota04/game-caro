import * as crypto from 'crypto';
import * as moment from 'moment';
import ShortUniqueId from 'short-unique-id';
import { USER_ACCESS_TOKEN_PREFIX } from './constants';

const ShortID12 = new ShortUniqueId({ length: 12 });

export const sha256 = (input: string) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const md5 = (input: string) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateUUID = () => {
  return crypto.randomUUID();
};

export const getBearerToken = (header: string) => {
  return typeof header === 'string'
    ? header.replace(/^Bearer /, '').trim()
    : '';
};

// TODO: change hash method
export const hashPassword = (input: string) => {
  return md5(input);
};

export const validatePassword = (input: string, hash: string) => {
  return hashPassword(input) === hash;
};

export function randomInt(min: number, max: number): number {
  const rand = Math.random() * (max - min);
  return Math.floor(rand + min);
}

export const generateAccessToken = (id: string) => {
  const now = moment().unix();
  const token = `${now}${ShortID12.randomUUID()}${id}`;
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getAccessTokenKey = (token: string) => {
  return `${USER_ACCESS_TOKEN_PREFIX}:${token}`;
};
