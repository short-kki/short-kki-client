/**
 * Auth Context
 *
 * 앱 전체에서 인증 상태를 관리하는 컨텍스트
 * 로그인, 로그아웃, 사용자 정보 접근 제공
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter, useSegments } from 'expo-router';
import {
  AuthData,
  AuthTokens,
  User,
  saveAuthData,
  saveUser,
  getAuthData,
  clearAuthData,
} from '@/utils/auth-storage';
import { pushNotificationService } from '@/services/pushNotification';
import { getMyProfile } from '@/services/memberApi';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  /** 현재 사용자 정보 */
  user: User | null;
  /** 인증 토큰 */
  tokens: AuthTokens | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 인증 상태 로딩 중 여부 */
  isLoading: boolean;
  /** 로그인 처리 */
  signIn: (data: AuthData) => Promise<void>;
  /** 로그아웃 처리 */
  signOut: () => Promise<void>;
  /** 사용자 정보 업데이트 */
  updateUser: (user: Partial<User>) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();

  // 초기 인증 상태 로드
  useEffect(() => {
    loadAuthState();
  }, []);

  // 인증 상태에 따른 라우팅
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isLoggedIn = !!user;

    // 로그인 후에도 접근 가능한 페이지들
    const allowedRoutes = ['design-showcase', 'search', 'search-results', 'notifications', 'settings', 'profile-edit', 'recipe', 'recipe-create-manual', 'shopping-list', 'recipe-book-detail', 'group-recipe-books', 'group-members', 'group-edit', 'group-feed-create', 'group-calendar', 'group'];

    if (!isLoggedIn && inAuthGroup) {
      // 로그인 안 됨 + 보호된 영역 접근 시 → 로그인 화면으로
      router.replace('/login');
    } else if (isLoggedIn && !inAuthGroup && !allowedRoutes.includes(segments[0])) {
      // 로그인 됨 + 로그인/인덱스 화면 → 메인으로
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  /**
   * 저장된 인증 상태 로드
   */
  const loadAuthState = async () => {
    try {
      const authData = await getAuthData();

      if (authData) {
        setUser(authData.user);
        setTokens(authData.tokens);
        // 기존 로그인 상태면 푸시 토큰 등록
        pushNotificationService.registerToken();

        // 서버에서 최신 프로필 가져와서 업데이트
        try {
          const profile = await getMyProfile();
          const updatedUser: User = {
            ...authData.user,
            name: profile.name,
            email: profile.email,
            profileImage: profile.profileImgUrl || undefined,
          };
          setUser(updatedUser);
          await saveUser(updatedUser);
        } catch {
          // 프로필 조회 실패해도 기존 저장된 데이터로 진행
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그인 처리
   */
  const signIn = useCallback(async (data: AuthData) => {
    try {
      await saveAuthData(data);
      setUser(data.user);
      setTokens(data.tokens);
      // 푸시 토큰 등록
      pushNotificationService.registerToken();

      // 서버에서 최신 프로필 가져와서 업데이트 (프로필 이미지 등)
      try {
        const profile = await getMyProfile();
        const updatedUser: User = {
          ...data.user,
          name: profile.name,
          email: profile.email,
          profileImage: profile.profileImgUrl || undefined,
        };
        setUser(updatedUser);
        await saveUser(updatedUser);
      } catch {
        // 프로필 조회 실패해도 로그인은 진행
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  }, []);

  /**
   * 로그아웃 처리
   */
  const signOut = useCallback(async () => {
    try {
      // 푸시 토큰 삭제
      await pushNotificationService.unregisterToken();
      await clearAuthData();
      setUser(null);
      setTokens(null);
      router.replace('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }, [router]);

  /**
   * 사용자 정보 업데이트
   */
  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...updates };
      return updatedUser;
    });

    // 저장소에도 저장
    const currentUser = await getAuthData();
    if (currentUser?.user) {
      const updatedUser = { ...currentUser.user, ...updates };
      await saveUser(updatedUser);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      tokens,
      isLoggedIn: !!user,
      isLoading,
      signIn,
      signOut,
      updateUser,
    }),
    [user, tokens, isLoading, signIn, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * 인증 컨텍스트 훅
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * 현재 사용자 정보 훅 (편의용)
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * 로그인 여부 훅 (편의용)
 */
export function useIsLoggedIn(): boolean {
  const { isLoggedIn } = useAuth();
  return isLoggedIn;
}

export default AuthContext;
