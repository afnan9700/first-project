// src/utils/fetchWithAuth.ts
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export interface FetchError extends Error {
  status: number;
  data: any;
}

// the returned promise resolves to specified type T
// or rejects with FetchError or UnauthorizedError
export async function fetchWithAuth<T = any>(
  input: RequestInfo,  // URL or Request object
  init: RequestInit = {}  // Optional init object for fetch
): Promise<T> {
  const res = await fetch(input, {
    ...init,  // spreading fields other than 'headers'
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}), // spreading 'headers' if provided
    },
  });

  // backend returns 401 if not logged in
  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  // Try to parse JSON
  let payload: any;
  try {
    payload = await res.json();
  } catch {
    payload = null;  // set to null if JSON parsing fails
  }

  // handling other errors
  if (!res.ok) {
    const error: FetchError = new Error(
      payload?.error || `Request failed with status ${res.status}`  // use error message from backend if available
    ) as FetchError;
    error.status = res.status;  // attach status code
    error.data = payload;  // attach parsed data
    throw error;
  }

  // return the parsed JSON data
  return payload as T;
}