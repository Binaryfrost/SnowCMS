import crypto from 'crypto';
import type { Request, RequestHandler } from 'express';
import type { Knex } from 'knex';
import type { PromiseType } from 'utility-types';
import { ExpressError } from '../lib';
import { db } from './database/db';

export function asyncRouteFix<T extends RequestHandler>(callback: T): RequestHandler {
  return (req, res, next) => {
    new Promise((resolve) => {
      resolve(callback(req, res, next));
    }).catch(next);
  };
}

export function getAuthToken(req: Request) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.includes(':')) {
    return null;
  }

  const authHeaderParts = authorization.split(' ');
  if (authHeaderParts.length < 2 || authHeaderParts[0] !== 'Bearer') {
    return null;
  }

  const token = authHeaderParts[1];
  return token;
}

function deriveKeyFromSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('base64').substring(0, 32);
}

const ENCRYPT_ALGORITHM = 'aes256';
export function encrypt(secret: string, data: string) {
  const iv = crypto.randomBytes(8).toString('hex');
  const key = deriveKeyFromSecret(secret);
  const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, iv);
  return {
    iv,
    encrypted: cipher.update(data, 'utf8', 'base64') + cipher.final('base64')
  };
}

export function decrypt(encrypted: string, secret: string, iv: string) {
  const key = deriveKeyFromSecret(secret);
  const decipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, iv);
  return decipher.update(encrypted, 'base64', 'utf8') + decipher.final('utf8');
}

function parseNumber(num: string, def: number) {
  if (!num) return def;

  if (!num.match(/^[0-9]+$/)) {
    throw new ExpressError('Value is not a number');
  }

  return parseInt(num, 10);
}

type PaginationFunctionReturnType = Promise<{
  limit: number
  page: number
  pages: number
  sort: 'asc' | 'desc'
}>;

export function pagination(req: Request, table: string,
  where: Record<string, any> | ((builder: Knex.QueryBuilder) => void)): PaginationFunctionReturnType
// eslint-disable-next-line no-redeclare
export function pagination(req: Request, query: Knex.QueryBuilder): PaginationFunctionReturnType
// eslint-disable-next-line no-redeclare
export async function pagination(req: Request, query: string | Knex.QueryBuilder,
  where?: Record<string, any> | ((builder: Knex.QueryBuilder) => void)) {
  const limit = parseNumber(req.query.limit as string, 10);
  const page = parseNumber(req.query.page as string, 1);
  const sort = (req.query.sort || 'asc') as string;

  if (limit < 1 || limit > 100) {
    throw new ExpressError('Limit must be in range 1-100');
  }

  if (!['asc', 'desc'].includes(sort)) {
    throw new ExpressError('Sort must be either asc or desc');
  }

  const newQuery = typeof query === 'string' ? (
    db()(query)
      .count('id')
      .where(where)
  ) : query;

  const { count } = await newQuery
    .count({ count: '*' })
    .first();

  return {
    limit,
    page,
    pages: Math.ceil(count as number / limit),
    sort
  };
}

export function paginate<T extends Knex.QueryBuilder>(query: T,
  p: PromiseType<ReturnType<typeof pagination>>, column: string = 'id') {
  const { sort, limit, page } = p;

  return query
    .orderBy(column, sort)
    .limit(limit)
    .offset((page - 1) * limit);
}
