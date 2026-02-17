/**
 * API 서비스 설정
 *
 * 서버 연동 시 이 파일에서 baseURL과 헤더 설정을 변경합니다.
 */

import { API_BASE_URL } from '@/constants/oauth';
import { getAuthData } from '@/utils/auth-storage';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;
}

// Mock 데이터 사용 여부 (개발 모드에서 true, 실서버 테스트시 false로 변경)
export const USE_MOCK = false;

// API 기본 설정
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// 인증 헤더 생성
async function getAuthHeaders(): Promise<Record<string, string>> {
  const authData = await getAuthData();
  if (authData?.tokens?.accessToken) {
    return { Authorization: `Bearer ${authData.tokens.accessToken}` };
  }
  return {};
}

// 기본 fetch 래퍼
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 인증이 필요한 요청이면 Bearer 토큰 추가
  const authHeaders = requiresAuth ? await getAuthHeaders() : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // 에러 응답 본문 파싱 시도
    let errorMessage = `API Error: ${response.status}`;
    let errorCode: string | undefined;
    let errorDataPayload: unknown;

    try {
      const errorData = await response.json();
      // 중복/이미 등록된 에러는 console.log로 처리 (LogBox에 안 뜨게)
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

      errorCode = typeof errorData.code === 'string' ? errorData.code : undefined;
      errorDataPayload = errorData.data;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
      console.error(`API Error [${endpoint}] (no JSON):`, response.status, response.statusText);
    }

    const apiError = new Error(errorMessage) as ApiError;
    apiError.status = response.status;
    apiError.code = errorCode;
    apiError.data = errorDataPayload;
    throw apiError;
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
