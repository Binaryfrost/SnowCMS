import { type Request } from 'express';
import InternalServerError from './errors/base/InternalServerError';

export interface RequestContextAuthHeader {
  type: 'header',
  auth: string
}

export interface RequestContextAuthCookie {
  type: 'cookie',
  cookie: string
}

export default class RequestContext<P = undefined> {
  #ip: string;
  #headers: Record<string, string>;
  #params: Record<keyof P, string>;
  #localPort: number;

  constructor(req: Request, params?: Record<keyof P, string>) {
    if (!req.ip) throw new InternalServerError('Request has no IP');
    this.#ip = req.ip;
    this.#headers = Object.fromEntries(
      Object.entries(req.headers)
        .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v ?? '']
        )
    );
    this.#params = params || {} as Record<keyof P, string>;
    this.#localPort = req.socket.localPort!;
  }

  get ip() {
    return this.#ip;
  }

  get headers() {
    return this.#headers;
  }

  get params() {
    return this.#params;
  }

  // Used for serverInputFetch method
  get _localPort() {
    return this.#localPort;
  }

  get auth(): RequestContextAuthHeader | RequestContextAuthCookie | null {
    const authHeader = this.#headers.authorization;
    const { cookie } = this.#headers;

    if (authHeader) {
      return {
        type: 'header',
        auth: authHeader
      };
    } if (cookie) {
      return {
        type: 'cookie',
        cookie
      };
    }
    return null;
  }
}

/*
 * WebsiteRequestContext: used for website-level requests
 * CollectionRequestContext: used collection-level requests
 */

export interface WebsiteRequestContextParams {
  websiteId: string
}
export class WebsiteRequestContext extends RequestContext<WebsiteRequestContextParams> {}

export interface CollectionRequestContextParams {
  websiteId: string
  collectionId: string
}
export class CollectionRequestContext extends RequestContext<CollectionRequestContextParams> {}
