export type ResponseOk<T> = {
  data: T;
};

export enum ResponseErrorCode {
  Internal = 'Internal',
}

export type ResponseError = {
  code: ResponseErrorCode,
  message: string,
};

export type Response<T> = ResponseOk<T> | ResponseError;

export function isResponseOk<T>(res: Response<T>): res is ResponseOk<T> {
  return 'data' in res;
}

export async function requestText(url: string) {
  return fetch(url).then((res) => res.text());
}

interface RequestOption {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

export async function request<T>(url: string, options?: RequestOption) {
  const method = options?.method || 'GET';
  const res = await fetch(url, {
    method,
    headers: method !== 'GET' ? {
      'Content-Type': 'application/json',
    } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json() as Response<T>;
  if (isResponseOk(data)) {
    return data.data;
  }
  throw new Error(data.message);
}
