import type { User } from '../../common/types/User';
import { router } from '../router';

let redirectUrl = '/';
export function redirectAfterLogin() {
  return redirectUrl;
}

interface Opts {
  noRedirectOn401?: boolean
}

interface RequestBase extends Opts {
  route: string
}

interface RequestWithoutData extends RequestBase {
  method: 'GET' | 'DELETE'
}

interface RequestWithData extends RequestBase {
  method: 'POST' | 'PUT' | 'PATCH',
  data?: FormData | object
}

type Request = RequestWithData | RequestWithoutData

export interface HttpResponse<T = any> {
  status: number
  body: T & { error?: string }
}

async function request<T>(opts: Request): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const jwt = localStorage.getItem('token');
  if (jwt) headers.Authorization = `Bearer ${jwt}`;

  let serializedData: string;

  // METHODS_THAT_CAN_CONTAIN_DATA.includes(request.method) would be better, but TypeScript wouldn't allow it
  if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
    if (!opts.data) {
      serializedData = undefined;
    } else if (opts.data instanceof FormData) {
      serializedData = JSON.stringify(Object.fromEntries(opts.data));
    } else {
      serializedData = JSON.stringify(opts.data);
    }
  }

  const resp = await fetch(opts.route, {
    method: opts.method,
    headers,
    body: serializedData
  });

  if (resp.status === 401 && !opts.noRedirectOn401) {
    localStorage.removeItem('token');
    redirectUrl = location.pathname;
    // https://github.com/remix-run/react-router/issues/9422#issuecomment-1301182219

    // Uncommenting this causes the server to crash with error "document is not defined".
    // TODO: Find solution
    // router.navigate('/login');
    return {
      status: 401,
      body: null
    };
  }

  const respData = await resp.text();
  return {
    status: resp.status,
    body: respData ? JSON.parse(respData) : {}
  };
}

export async function get<T = any>(route: string, opts?: Opts) {
  return request<T>({
    method: 'GET',
    route,
    ...opts
  });
}

export async function post<T = any>(route: string, data: FormData | object, opts?: Opts) {
  return request<T>({
    method: 'POST',
    route,
    data,
    ...opts
  });
}

export async function patch<T = any>(route: string, data: FormData | object, opts?: Opts) {
  return request<T>({
    method: 'PATCH',
    route,
    data,
    ...opts
  });
}

export async function put<T = any>(route: string, data: FormData | object, opts?: Opts) {
  return request<T>({
    method: 'PUT',
    route,
    data,
    ...opts
  });
}

export async function del<T = any>(route: string, opts?: Opts) {
  return request<T>({
    method: 'DELETE',
    route,
    ...opts
  });
}

export async function s3Upload(url: string, type: string, data: any) {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': type
    },
    body: data
  });
}

/**
 * Only use this on pages that do not request data from the server on load
 */
// TODO: Remove if unused
export async function ensureUserIsLoggedIn(): Promise<HttpResponse> {
  return get('/api/is-logged-in');
}

function getJWT(): User {
  const jwt = localStorage.getItem('token');
  return jwt ? JSON.parse(atob(jwt.split('.')[1])) : null;
}

export function getUser(): User {
  // TODO: Use actual JWT
  // return getJWT();
  return {
    role: 'ADMIN',
    websites: []
  };
}
