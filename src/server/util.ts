import crypto from 'crypto';
import type { Request, RequestHandler } from 'express';
import type { Knex } from 'knex';
import { getAllTimezones } from 'countries-and-timezones';
import { DateTime, IANAZone } from 'luxon';
import type { PromiseType } from 'utility-types';
import { ExpressError } from '../lib';
import { db } from './database/db';
import { SessionCookie } from './cookie';

export function asyncRouteFix<T extends RequestHandler>(callback: T): RequestHandler {
  return (req, res, next) => {
    new Promise((resolve) => {
      resolve(callback(req, res, next));
    }).catch(next);
  };
}

export function getAuthToken(req: Request) {
  const { authorization } = req.headers;

  if (authorization) {
    if (!authorization.includes(':')) {
      return null;
    }
  
    const authHeaderParts = authorization.split(' ');
    if (authHeaderParts.length < 2 || authHeaderParts[0] !== 'Bearer') {
      return null;
    }
  
    return authHeaderParts[1];
  } else {
    try {
      const cookie = SessionCookie.get(req);
      if (!cookie) return null;

      return cookie.getData();
    } catch(_) {
      return null;
    }
  }

  return null;
}

export function secureRandomBytes(bytes: number = 32) {
  return crypto.randomBytes(bytes);
}

export function secureRandom(bytes: number = 32, encoding: BufferEncoding = 'base64url') {
  return secureRandomBytes(bytes).toString(encoding);
}

export function hmac(secret: string, ...data: any[]) {
  const h = crypto.createHmac('sha256', secret);
  h.update(data.join('.'));
  return h.digest().toString('hex');
}

export function secureEquals(a: string, b: string) {
  if (!a || !b) return false;

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length != bufferB.length) return false;

  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function isNumber(num: string) {
  return num.match(/^[0-9]+$/);
}

export function parseNumber(num: string, def: number) {
  if (!num) return def;

  if (!isNumber(num)) {
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
      .count({ count: '*' })
      .where(where)
  ) : db()
    .count({ count: '*' })
    .from(query.as('C'));

  const { count } = await newQuery.first();

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

let timezones: string[];
export function getTimezones() {
  if (timezones) return timezones;

  const ALL_TIMEZONES = Object.keys(getAllTimezones())
    .filter(e => e === 'Etc/UTC' || (e.includes('/') && !e.startsWith('Etc/')));

  timezones = ALL_TIMEZONES
    .filter(e => {
      if (IANAZone.isValidZone(e)) {
        return true;
      }

      console.warn(`Unsupported timezone: ${e}`);  
    });

  console.log(`Loaded ${timezones.length}/${ALL_TIMEZONES.length} timezones`);
  return timezones;
}
