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

  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;

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
    localStorage.setItem('redirect', location.pathname);
    localStorage.removeItem('token');
    location.href = '/login';
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
