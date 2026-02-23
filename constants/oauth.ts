/**
 * OAuth Configuration
 *
 * 네이버/구글 소셜 로그인 설정
 * 민감한 정보는 환경변수(.env)에서 가져옵니다.
 */

// ============================================================================
// NAVER LOGIN
// ============================================================================
// 네이버 개발자 센터: https://developers.naver.com/apps
// 1. 애플리케이션 등록
// 2. API 권한: 네이버 로그인 - 프로필정보(이메일, 이름, 프로필사진)
// 3. iOS Bundle ID, URL Scheme 등록
// ============================================================================

export const NAVER_CONFIG = {
  consumerKey: process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY || "",
  consumerSecret: process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET || "",
  appName: "숏끼",
  serviceUrlScheme: "shortkki",
};

// ============================================================================
// GOOGLE LOGIN
// ============================================================================
// Google Cloud Console: https://console.cloud.google.com/
// 1. 프로젝트 생성 또는 선택
// 2. OAuth 동의 화면 설정 (외부 사용자용)
// 3. 사용자 인증 정보 > OAuth 2.0 클라이언트 ID 생성
// ============================================================================

export const GOOGLE_CONFIG = {
  // Web Application 클라이언트 ID (idToken 검증용)
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
  // iOS 앱용 클라이언트 ID
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  // Android 앱용 클라이언트 ID
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
};

// ============================================================================
// BACKEND API 
// ============================================================================
// 로그인 엔드포인트: POST /api/auth/{provider}
// Request: { code: string }
// Response: { code, message, data: { accessToken, refreshToken, email, name, newMember } }
// ============================================================================

import Constants from "expo-constants";

// ============================================================================
// APP ENVIRONMENT - 이 값을 변경하여 환경을 전환합니다
// 'local' : 로컬 백엔드 (localhost), 빠른 로그인 가능
// 'dev'   : 개발 서버 (dev.shortkki.kr), 빠른 로그인 가능
// 'prod'  : 운영 서버 (api.shortkki.kr), 빠른 로그인 불가
// TODO: 이후 eas.json의 EXPO_PUBLIC_API_URL 기반으로 전환하여 코드 분기 제거
// ============================================================================
export type AppEnv = "local" | "dev" | "prod";
export const APP_ENV = "dev" as AppEnv;

export const API_BASE_URL = (() => {
  const env: AppEnv = APP_ENV;
  switch (env) {
    case "prod":
      return "https://api.shortkki.kr";
    case "dev":
      return "http://dev.shortkki.kr";
    case "local":
    default: {
      // Expo Go에서 실행 시 호스트 머신의 IP 감지
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localhost = debuggerHost?.split(":")[0];
      if (localhost) {
        return `http://${localhost}:8080`;
      }
      return "http://localhost:8080";
    }
  }
})();

// ============================================================================
// DEV MODE - 빠른 로그인 (local, dev에서만 활성화)
// ============================================================================

export const DEV_MODE = {
  ENABLE_MOCK_LOGIN: (APP_ENV as AppEnv) !== "prod",
};
