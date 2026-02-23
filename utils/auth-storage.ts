/**
 * Auth Storage Utility
 *
 * 토큰 저장/관리 유틸리티
 *
 * 네이티브 빌드: expo-secure-store 사용 (영구 저장)
 * Expo Go: 메모리 스토리지 폴백 (앱 재시작 시 로그아웃됨)
 */

import * as SecureStore from 'expo-secure-store';

// ============================================================================
// STORAGE ADAPTER
// ============================================================================
// SecureStore 사용 (영구 저장, 앱 재시작 후에도 로그인 유지)
// SecureStore 사용 불가 시 메모리 폴백 (Expo Go 등)

const memoryStorage: Record<string, string> = {};

const isSecureStoreAvailable = (): boolean => {
  try {
    return SecureStore !== null && typeof SecureStore.getItemAsync === 'function';
  } catch {
    return false;
  }
};

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isSecureStoreAvailable()) {
      return SecureStore.getItemAsync(key);
    }
    return memoryStorage[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    if (isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    delete memoryStorage[key];
  },
};

// ============================================================================
// TYPES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  profileImage?: string;
  provider: 'naver' | 'google';
}

export interface AuthData {
  tokens: AuthTokens;
  user: User;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'shortkki_access_token',
  REFRESH_TOKEN: 'shortkki_refresh_token',
  EXPIRES_AT: 'shortkki_token_expires_at',
  USER: 'shortkki_user',
} as const;

// ============================================================================
// STORAGE HELPERS
// ============================================================================

async function getItem(key: string): Promise<string | null> {
  return storage.getItem(key);
}

async function setItem(key: string, value: string): Promise<void> {
  await storage.setItem(key, value);
}

async function deleteItem(key: string): Promise<void> {
  await storage.removeItem(key);
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * 토큰 저장
 */
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);

  if (tokens.refreshToken) {
    await setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  if (tokens.expiresAt) {
    await setItem(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString());
  }
}

/**
 * 토큰 불러오기
 */
export async function getTokens(): Promise<AuthTokens | null> {
  const accessToken = await getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    return null;
  }

  const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAtStr = await getItem(STORAGE_KEYS.EXPIRES_AT);

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : undefined,
  };
}

/**
 * 액세스 토큰만 불러오기
 */
export async function getAccessToken(): Promise<string | null> {
  return getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * 토큰 삭제
 */
export async function clearTokens(): Promise<void> {
  await deleteItem(STORAGE_KEYS.ACCESS_TOKEN);
  await deleteItem(STORAGE_KEYS.REFRESH_TOKEN);
  await deleteItem(STORAGE_KEYS.EXPIRES_AT);
}

/**
 * 토큰 만료 여부 확인
 */
export async function isTokenExpired(): Promise<boolean> {
  const expiresAtStr = await getItem(STORAGE_KEYS.EXPIRES_AT);

  if (!expiresAtStr) {
    // 만료 시간이 없으면 만료되지 않은 것으로 간주
    return false;
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  const now = Date.now();

  // 5분 전에 만료된 것으로 간주 (토큰 갱신 여유 시간)
  return now >= expiresAt - 5 * 60 * 1000;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * 사용자 정보 저장
 */
export async function saveUser(user: User): Promise<void> {
  await setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * 사용자 정보 불러오기
 */
export async function getUser(): Promise<User | null> {
  const userStr = await getItem(STORAGE_KEYS.USER);

  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * 사용자 정보 삭제
 */
export async function clearUser(): Promise<void> {
  await deleteItem(STORAGE_KEYS.USER);
}

// ============================================================================
// AUTH DATA (COMBINED)
// ============================================================================

/**
 * 전체 인증 데이터 저장
 */
export async function saveAuthData(data: AuthData): Promise<void> {
  await saveTokens(data.tokens);
  await saveUser(data.user);
}

/**
 * 전체 인증 데이터 불러오기
 */
export async function getAuthData(): Promise<AuthData | null> {
  const tokens = await getTokens();
  const user = await getUser();

  if (!tokens || !user) {
    return null;
  }

  return { tokens, user };
}

/**
 * 전체 인증 데이터 삭제 (로그아웃)
 */
export async function clearAuthData(): Promise<void> {
  await clearTokens();
  await clearUser();
}

/**
 * 로그인 여부 확인
 */
export async function isLoggedIn(): Promise<boolean> {
  const accessToken = await getAccessToken();
  return !!accessToken;
}
