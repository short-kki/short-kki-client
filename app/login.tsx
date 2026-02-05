import * as AuthSession from "expo-auth-session";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Colors, SemanticColors, Spacing, Typography } from "@/constants/design-system";
import { API_BASE_URL, DEV_MODE, GOOGLE_CONFIG, NAVER_CONFIG } from "@/constants/oauth";
import { useAuth } from "@/contexts/AuthContext";
import { AuthData } from "@/utils/auth-storage";

WebBrowser.maybeCompleteAuthSession();

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function NaverIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#FFFFFF" d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
    </Svg>
  );
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface LoginData {
  memberId: number;
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  isNewMember: boolean;
}

async function sendCodeToServer(
  provider: "naver" | "google",
  code: string,
  codeVerifier?: string
): Promise<LoginData> {
  const platform = Platform.OS; // "ios" | "android"
  const body: { code: string; codeVerifier?: string; platform: string } = { code, platform };
  if (codeVerifier) {
    body.codeVerifier = codeVerifier;
  }

  // 백엔드 enum과 일치하도록 대문자로 변환 (NAVER, GOOGLE)
  const providerUpperCase = provider.toUpperCase();

  const response = await fetch(`${API_BASE_URL}/api/auth/${providerUpperCase}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Server auth error:", errorText);
    throw new Error("서버 인증 실패");
  }

  const apiResponse: ApiResponse<LoginData> = await response.json();
  return apiResponse.data;
}

function createMockAuthData(provider: "naver" | "google"): AuthData {
  const mockId = `mock_${provider}_${Date.now()}`;
  return {
    tokens: {
      accessToken: `mock_access_token_${mockId}`,
      refreshToken: `mock_refresh_token_${mockId}`,
      expiresAt: Date.now() + 3600 * 1000,
    },
    user: {
      id: mockId,
      email: `test@${provider}.com`,
      name: provider === "naver" ? "네이버 테스트 사용자" : "구글 테스트 사용자",
      profileImage: "https://i.pravatar.cc/200",
      provider,
    },
  };
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState<"naver" | "google" | "dev" | null>(null);
  const [savedCodeVerifier, setSavedCodeVerifier] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{
    oauth_code?: string;
    oauth_error?: string;
    oauth_provider?: "naver" | "google";
  }>();

  // Android에서 OAuth 콜백 라우트로부터 전달받은 코드 처리
  useEffect(() => {
    if (params.oauth_code && params.oauth_provider) {
      setIsLoading(params.oauth_provider);
      // 구글은 저장해둔 codeVerifier 사용, 네이버는 필요 없음
      const codeVerifier = params.oauth_provider === "google" ? savedCodeVerifier ?? undefined : undefined;
      handleCodeAuth(params.oauth_provider, params.oauth_code, codeVerifier);
      // 파라미터 및 저장된 codeVerifier 초기화
      router.setParams({ oauth_code: undefined, oauth_error: undefined, oauth_provider: undefined });
      setSavedCodeVerifier(null);
    } else if (params.oauth_error) {
      Alert.alert("로그인 실패", "OAuth 인증에 실패했습니다.");
      router.setParams({ oauth_code: undefined, oauth_error: undefined, oauth_provider: undefined });
      setSavedCodeVerifier(null);
    }
  }, [params.oauth_code, params.oauth_error, params.oauth_provider, savedCodeVerifier]);

  const naverRedirectUri = AuthSession.makeRedirectUri({
    scheme: "shortkki",
    path: "oauth/naver",
  });

  const googleClientId = Platform.select({
    ios: GOOGLE_CONFIG.iosClientId,
    android: GOOGLE_CONFIG.androidClientId,
    default: GOOGLE_CONFIG.iosClientId,
  });

  const googleRedirectUri = Platform.select({
    ios: AuthSession.makeRedirectUri({
      scheme: "com.googleusercontent.apps.6350831070-agbndp2mc029cemdtv2ekqlemrne04ik",
    }),
    android: AuthSession.makeRedirectUri({
      scheme: "com.googleusercontent.apps.6350831070-mp5ndlvk9h49n9lp34f17g0k9jevokji",
    }),
    default: AuthSession.makeRedirectUri({
      scheme: "com.googleusercontent.apps.6350831070-mp5ndlvk9h49n9lp34f17g0k9jevokji",
    }),
  });

  const [naverRequest, naverResponse, naverPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: NAVER_CONFIG.clientId,
      redirectUri: naverRedirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: [],
      usePKCE: false,
    },
    { authorizationEndpoint: NAVER_CONFIG.authorizationEndpoint }
  );

  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId!,
      redirectUri: googleRedirectUri!,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["openid", "profile", "email"],
      usePKCE: true,
    },
    { authorizationEndpoint: GOOGLE_CONFIG.authorizationEndpoint }
  );

  useEffect(() => {
    if (!naverResponse) return;

    if (naverResponse.type === "success") {
      const { code } = naverResponse.params;
      handleCodeAuth("naver", code);
    } else if (naverResponse.type === "error") {
      setIsLoading(null);
      Alert.alert("로그인 실패", "네이버 로그인에 실패했습니다.");
    } else {
      setIsLoading(null);
    }
  }, [naverResponse]);

  useEffect(() => {
    if (!googleResponse || !googleRequest) return;

    if (googleResponse.type === "success") {
      const { code } = googleResponse.params;
      const codeVerifier = googleRequest.codeVerifier;
      handleCodeAuth("google", code, codeVerifier);
    } else if (googleResponse.type === "error") {
      setIsLoading(null);
      Alert.alert("로그인 실패", "구글 로그인에 실패했습니다.");
    } else {
      setIsLoading(null);
    }
  }, [googleResponse, googleRequest]);

  const handleCodeAuth = async (provider: "naver" | "google", code: string, codeVerifier?: string) => {
    try {
      if (DEV_MODE.ENABLE_MOCK_LOGIN) {
        try {
          const result = await sendCodeToServer(provider, code, codeVerifier);
          const authData = createAuthDataFromResponse(result, provider);
          await signIn(authData);
          if (result.isNewMember) {
            Alert.alert("환영합니다!", `${result.name}님, 숏끼에 오신 것을 환영해요!`);
          }
          return;
        } catch {
          const mockAuthData = createMockAuthData(provider);
          await signIn(mockAuthData);
          return;
        }
      }

      const result = await sendCodeToServer(provider, code, codeVerifier);
      const authData = createAuthDataFromResponse(result, provider);
      await signIn(authData);
      if (result.isNewMember) {
        Alert.alert("환영합니다!", `${result.name}님, 숏끼에 오신 것을 환영해요!`);
      }
    } catch (error) {
      console.error(`${provider} code auth error:`, error);
      Alert.alert("로그인 실패", "인증 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(null);
    }
  };

  const createAuthDataFromResponse = (response: LoginData, provider: "naver" | "google"): AuthData => ({
    tokens: {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    },
    user: {
      id: response.memberId.toString(),
      email: response.email,
      name: response.name,
      provider,
    },
  });

  const handleNaverLogin = async () => {
    if (!naverRequest) {
      Alert.alert("잠시만요", "로그인 준비 중입니다. 다시 시도해주세요.");
      return;
    }
    setIsLoading("naver");
    try {
      await naverPromptAsync();
    } catch {
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleRequest) {
      Alert.alert("잠시만요", "로그인 준비 중입니다. 다시 시도해주세요.");
      return;
    }
    setIsLoading("google");
    // Android 콜백 처리를 위해 codeVerifier 저장
    if (googleRequest.codeVerifier) {
      setSavedCodeVerifier(googleRequest.codeVerifier);
    }
    try {
      await googlePromptAsync();
    } catch {
      setIsLoading(null);
      setSavedCodeVerifier(null);
    }
  };

  const handleDevLogin = async () => {
    if (!DEV_MODE.ENABLE_MOCK_LOGIN) return;
    setIsLoading("dev");
    try {
      console.log("[DevLogin] start");
      const requestUrl = `${API_BASE_URL}/api/dev/tokens?memberId=1`;
      console.log("[DevLogin] request:", requestUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      // 개발자용 테스트 로그인 API 호출
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DevLogin] server error:", response.status, errorText);
        throw new Error(`서버 에러: ${response.status} - ${errorText}`);
      }

      const apiResponse = await response.json();
      console.log("[DevLogin] response:", JSON.stringify(apiResponse));
      console.log("Dev Login Response:", JSON.stringify(apiResponse, null, 2));

      // 서버 응답 구조 확인 (data가 없을 수 있음)
      const loginData = apiResponse.data || apiResponse;

      if (!loginData.accessToken) {
        throw new Error(`토큰이 없습니다. 응답: ${JSON.stringify(apiResponse)}`);
      }

      const authData: AuthData = {
        tokens: {
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken || "",
        },
        user: {
          id: String(loginData.memberId || loginData.id || "1"),
          email: loginData.email || "",
          name: loginData.name || "테스트 사용자",
          provider: "naver",
        },
      };

      await signIn(authData);

      // 로그인 정보 표시
      Alert.alert(
        "로그인 성공",
        `ID: ${authData.user.id}\n이름: ${authData.user.name}\n토큰: ${authData.tokens.accessToken.substring(0, 30)}...`
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[DevLogin] timeout");
        Alert.alert("로그인 실패", "서버 응답이 없습니다. 네트워크/서버 상태를 확인해주세요.");
      }
      console.error("Dev Login Error:", error);
      // 서버 연결 실패 시 에러 표시
      Alert.alert(
        "로그인 실패",
        `서버 연결에 실패했습니다.\n\n${error instanceof Error ? error.message : "알 수 없는 오류"}\n\n서버가 실행 중인지 확인해주세요.`
      );
    } finally {
      console.log("[DevLogin] done");
      setIsLoading(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topSection}>
        <Image
          source={require("@/assets/images/short-kki-logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.appName}>숏끼</Text>
        <Text style={styles.tagline}>짧고 맛있는 레시피를 발견하세요</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.naverButtonContainer}>
          <Pressable
            onPress={handleNaverLogin}
            disabled={isLoading !== null}
            style={[styles.loginButton, isLoading !== null && styles.buttonDisabled]}
          >
            {isLoading === "naver" ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <NaverIcon size={18} />
                </View>
                <Text style={styles.naverButtonText}>네이버로 시작하기</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.googleButtonContainer}>
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isLoading !== null}
            style={[styles.loginButton, isLoading !== null && styles.buttonDisabled]}
          >
            {isLoading === "google" ? (
              <ActivityIndicator size="small" color="#666666" />
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <GoogleIcon size={20} />
                </View>
                <Text style={styles.googleButtonText}>Google로 시작하기</Text>
              </>
            )}
          </Pressable>
        </View>

        {DEV_MODE.ENABLE_MOCK_LOGIN && (
          <Pressable onPress={handleDevLogin} disabled={isLoading !== null} style={styles.devLoginButton}>
            <Text style={styles.devLoginText}>개발자 모드: 빠른 로그인 (테스트용)</Text>
          </Pressable>
        )}

        <Text style={styles.terms}>
          로그인 시 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  appName: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    color: SemanticColors.textSecondary,
    textAlign: "center",
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  naverButtonContainer: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#03C75A",
    marginBottom: 12,
    overflow: "hidden",
  },
  googleButtonContainer: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: "hidden",
  },
  loginButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  },
  naverButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  devLoginButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  devLoginText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
    textDecorationLine: "underline",
  },
  terms: {
    fontSize: Typography.fontSize.xs,
    color: SemanticColors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
});
