/**
 * OAuth Configuration
 *
 * 네이버/구글 소셜 로그인 설정
 */

// ============================================================================
// NAVER LOGIN
// ============================================================================
// 네이버 개발자 센터: https://developers.naver.com/apps
// 1. 애플리케이션 등록
// 2. API 권한: 네이버 로그인 - 프로필정보(이메일, 이름, 프로필사진)
// 3. Callback URL 등록: shortkki://oauth/naver
// ============================================================================

export const NAVER_CONFIG = {
  clientId: "em3ihyx5YXqUe550CY60",
  // redirectUri는 app.json의 scheme과 일치해야 함
  redirectUri: "shortkki://oauth/naver",
  authorizationEndpoint: "https://nid.naver.com/oauth2.0/authorize",
  tokenEndpoint: "https://nid.naver.com/oauth2.0/token",
};

// ============================================================================
// GOOGLE LOGIN
// ============================================================================
// Google Cloud Console: https://console.cloud.google.com/
// 1. 프로젝트 생성 또는 선택
// 2. OAuth 동의 화면 설정 (외부 사용자용)
// 3. 사용자 인증 정보 > OAuth 2.0 클라이언트 ID 생성
//    - 웹 애플리케이션 타입 선택 (Expo Go용)
//    - 승인된 리디렉션 URI: https://auth.expo.io/@your-username/short-kki-client
// 4. 클라이언트 ID 복사하여 아래에 입력
// ============================================================================

export const GOOGLE_CONFIG = {
  // Web Application 클라이언트 ID (백엔드용)
  webClientId: "6350831070-epl0tuu339jseg9lv8lh697tdn52avri.apps.googleusercontent.com",
  // iOS 앱용 클라이언트 ID (EAS Build용)
  iosClientId: "6350831070-agbndp2mc029cemdtv2ekqlemrne04ik.apps.googleusercontent.com",
  // Android 앱용 클라이언트 ID
  androidClientId: "6350831070-mp5ndlvk9h49n9lp34f17g0k9jevokji.apps.googleusercontent.com",
  // OAuth 엔드포인트
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

// ============================================================================
// BACKEND API 
// ============================================================================
// 로그인 엔드포인트: POST /api/auth/{provider}
// Request: { code: string }
// Response: { code, message, data: { accessToken, refreshToken, email, name, newMember } }
// ============================================================================

import Constants from "expo-constants";

// ngrok HTTPS 터널 URL (개발용)
// ngrok http 8080 실행 후 생성되는 URL로 변경
const NGROK_URL = ""; // ngrok 껐으므로 로컬 IP 사용

export const API_BASE_URL = (() => {
  if (!__DEV__) {
    // TODO: 실제 프로덕션 URL로 변경
    return "https://api.shortkki.com";
  }

  // ngrok URL이 있으면 사용 (iOS 실제 기기에서 HTTP 차단 우회)
  if (NGROK_URL) {
    return NGROK_URL;
  }

  // Expo에서 debuggerHost 가져오기
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  // debuggerHost가 없으면 현재 네트워크 IP 사용
  const fallbackIp = "192.168.219.106";

  return `http://${localhost || fallbackIp}:8080`;
})();

// ============================================================================
// DEV MODE - 백엔드 없이 테스트용
// ============================================================================

export const DEV_MODE = {
  // true로 설정하면 백엔드 없이 모의 로그인 가능
  ENABLE_MOCK_LOGIN: __DEV__,
};
