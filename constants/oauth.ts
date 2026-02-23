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

// ============================================================================
// BACKEND API
// ============================================================================
// 로그인 엔드포인트: POST /api/auth/{provider}
// Request: { code: string }
// Response: { code, message, data: { accessToken, refreshToken, email, name, newMember } }
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
