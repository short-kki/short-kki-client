/**
 * API 서비스 설정
 *
 * 서버 연동 시 이 파일에서 baseURL과 헤더 설정을 변경합니다.
 */

import { API_BASE_URL } from '@/constants/env';
import { extractJwtExpiresAt, getAuthData, getTokens, saveTokens } from '@/utils/auth-storage';

// Mock 데이터 사용 여부 (개발 모드에서 true, 실서버 테스트시 false로 변경)
export const USE_MOCK = false;

// API 기본 설정
const defaultHeaders = {
  'Content-Type': 'application/json',
};

const REFRESH_ENDPOINT = '/api/auth/refresh';

type AuthFailureHandler = (() => Promise<void> | void) | null;
let authFailureHandler: AuthFailureHandler = null;
let refreshPromise: Promise<string | null> | null = null;
let authFailureHandling = false;

interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export function setAuthFailureHandler(handler: AuthFailureHandler): void {
  authFailureHandler = handler;
}

// 인증 헤더 생성
async function getAuthHeaders(): Promise<Record<string, string>> {
  const authData = await getAuthData();
  if (authData?.tokens?.accessToken) {
    return { Authorization: `Bearer ${authData.tokens.accessToken}` };
  }
  return {};
}

async function triggerAuthFailure(): Promise<void> {
  if (!authFailureHandler || authFailureHandling) {
    return;
  }
  authFailureHandling = true;
  try {
    await authFailureHandler();
  } finally {
    authFailureHandling = false;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const tokens = await getTokens();
    const accessToken = tokens?.accessToken;
    const refreshToken = tokens?.refreshToken;
    if (!accessToken || !refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${REFRESH_ENDPOINT}`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ accessToken, refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as BaseResponse<RefreshTokenResponse>;
      const newAccessToken = payload?.data?.accessToken;
      const newRefreshToken = payload?.data?.refreshToken;
      if (!newAccessToken || !newRefreshToken) {
        return null;
      }

      await saveTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: extractJwtExpiresAt(newAccessToken),
      });

      return newAccessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseErrorResponse(response: Response, endpoint: string): Promise<never> {
  let errorMessage = `API Error: ${response.status}`;
  try {
    const errorData = await response.json();
    const isDuplicateError =
      errorData.code === "SOURCE_003" ||
      errorData.message?.includes("이미 등록") ||
      errorData.message?.includes("이미 레시피북에 추가된") ||
      errorData.message?.includes("중복") ||
      response.status === 409;

    if (isDuplicateError) {
      console.log(`API Info [${endpoint}]:`, errorData);
    } else {
      console.error(`API Error [${endpoint}]:`, errorData);
    }

    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.code) {
      errorMessage = `${errorData.code}: ${errorData.message || response.statusText}`;
    }
  } catch {
    console.error(`API Error [${endpoint}] (no JSON):`, response.status, response.statusText);
  }
  throw new Error(errorMessage);
}

// 기본 fetch 래퍼
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true,
  allowRetry: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const authHeaders = requiresAuth ? await getAuthHeaders() : {};
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...authHeaders,
      ...options.headers,
    },
  });

  if (
    response.status === 401 &&
    requiresAuth &&
    allowRetry &&
    endpoint !== REFRESH_ENDPOINT
  ) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return fetchApi<T>(endpoint, options, requiresAuth, false);
    }
    await triggerAuthFailure();
    throw new Error('AUTH_SESSION_EXPIRED');
  }

  if (!response.ok) {
    return parseErrorResponse(response, endpoint);
  }

  // 204 No Content 등 빈 응답 처리
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null as T;
  }

  return response.json();
}

// API 메서드들
export const api = {
  // 인증 필요한 요청 (기본값)
  get: <T>(endpoint: string, requiresAuth: boolean = true) =>
    fetchApi<T>(endpoint, { method: 'GET' }, requiresAuth),

  post: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, requiresAuth),

  put: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, requiresAuth),

  patch: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, requiresAuth),

  delete: <T>(endpoint: string, data?: unknown, requiresAuth: boolean = true) =>
    fetchApi<T>(endpoint, {
      method: 'DELETE',
      ...(data && { body: JSON.stringify(data) }),
    }, requiresAuth),
};

export default api;
