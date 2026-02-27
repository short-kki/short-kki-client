/**
 * App Environment Configuration
 *
 * 환경 전환 방법: 아래 APP_ENV 값만 변경하면 API_BASE_URL이 자동으로 결정됩니다.
 *
 *   APP_ENV = "local"  → 로컬 백엔드 (localhost:8080), 빠른 로그인 가능
 *   APP_ENV = "dev"    → 개발 서버 (dev.shortkki.kr),  빠른 로그인 가능
 *   APP_ENV = "prod"   → 운영 서버 (api.shortkki.kr),  빠른 로그인 불가
 */

import Constants from "expo-constants";

// ============================================================================
// APP ENVIRONMENT
// ============================================================================
export type AppEnv = "local" | "dev" | "prod";
export const APP_ENV = "dev" as AppEnv;

// ============================================================================
// API BASE URL — APP_ENV에 따라 자동 결정
// ============================================================================
export const API_BASE_URL = (() => {
  const env: AppEnv = APP_ENV;
  switch (env) {
    case "prod":
      return "http://api.shortkki.kr";
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
