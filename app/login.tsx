import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import NaverLogin from "@react-native-seoul/naver-login";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ChefHat, CookingPot, Flame, Heart, Sparkles, UtensilsCrossed } from "lucide-react-native";

import { Colors, SemanticColors, Spacing, Typography } from "@/constants/design-system";
import { API_BASE_URL, DEV_MODE, GOOGLE_CONFIG, NAVER_CONFIG } from "@/constants/oauth";
import { useAuth } from "@/contexts/AuthContext";
import { AuthData } from "@/utils/auth-storage";

// Google Sign-In 설정 (idToken 발급용)
GoogleSignin.configure({
  webClientId: GOOGLE_CONFIG.webClientId,
  iosClientId: GOOGLE_CONFIG.iosClientId,
});

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// 둥둥 떠다니는 장식 아이콘 컴포넌트
function FloatingIcon({
  icon: Icon,
  size,
  color,
  style,
  delay = 0,
  duration = 3000,
  floatRange = 10,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  size: number;
  color: string;
  style: object;
  delay?: number;
  duration?: number;
  floatRange?: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-floatRange, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(floatRange, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [delay, duration, floatRange, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ position: "absolute" }, style, animatedStyle]}>
      <Icon size={size} color={color} strokeWidth={1.5} />
    </Animated.View>
  );
}

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
  const router = useRouter();

  // Naver Login 초기화
  useEffect(() => {
    NaverLogin.initialize({
      appName: NAVER_CONFIG.appName,
      consumerKey: NAVER_CONFIG.consumerKey,
      consumerSecret: NAVER_CONFIG.consumerSecret,
      serviceUrlSchemeIOS: NAVER_CONFIG.serviceUrlScheme,
      disableNaverAppAuthIOS: false,
    });
  }, []);

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

  // 네이버 로그인 (네이티브 SDK + accessToken)
  const handleNaverLogin = async () => {
    setIsLoading("naver");
    try {
      const result = await NaverLogin.login();

      if (result.isSuccess && result.successResponse) {
        const accessToken = result.successResponse.accessToken;

        if (!accessToken) {
          throw new Error("accessToken을 받지 못했습니다.");
        }

        // 백엔드에 accessToken 전송
        await handleNaverAccessTokenAuth(accessToken);
      } else {
        // 사용자가 취소하거나 실패한 경우
        setIsLoading(null);
        if (result.failureResponse) {
          console.error("Naver login failed:", result.failureResponse);
        }
      }
    } catch (error) {
      setIsLoading(null);
      console.error("Naver login error:", error);
      Alert.alert("로그인 실패", "네이버 로그인에 실패했습니다.");
    }
  };

  // 네이버 accessToken 백엔드 인증
  const handleNaverAccessTokenAuth = async (accessToken: string) => {
    try {
      const platform = Platform.OS;
      const response = await fetch(`${API_BASE_URL}/api/auth/NAVER`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, platform }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Naver auth server error:", errorText);
        throw new Error("서버 인증 실패");
      }

      const apiResponse: ApiResponse<LoginData> = await response.json();
      const result = apiResponse.data;
      const authData = createAuthDataFromResponse(result, "naver");
      await signIn(authData);

      if (result.isNewMember) {
        Alert.alert("환영합니다!", `${result.name}님, 숏끼에 오신 것을 환영해요!`);
      }
    } catch (error) {
      console.error("Naver accessToken auth error:", error);
      Alert.alert("로그인 실패", "인증 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(null);
    }
  };

  // 구글 로그인 (네이티브 SDK + idToken)
  const handleGoogleLogin = async () => {
    setIsLoading("google");
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;

        if (!idToken) {
          throw new Error("idToken을 받지 못했습니다.");
        }

        // 백엔드에 idToken 전송
        await handleGoogleIdTokenAuth(idToken);
      } else {
        // 사용자가 취소한 경우
        setIsLoading(null);
      }
    } catch (error: unknown) {
      setIsLoading(null);

      if (error && typeof error === "object" && "code" in error) {
        const signInError = error as { code: string };
        if (signInError.code === statusCodes.SIGN_IN_CANCELLED) {
          return; // 사용자 취소 - 조용히 처리
        } else if (signInError.code === statusCodes.IN_PROGRESS) {
          return; // 이미 진행 중
        } else if (signInError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert("로그인 실패", "Google Play 서비스를 사용할 수 없습니다.");
          return;
        }
      }

      console.error("Google login error:", error);
      Alert.alert("로그인 실패", "구글 로그인에 실패했습니다.");
    }
  };

  // 구글 idToken 백엔드 인증
  const handleGoogleIdTokenAuth = async (idToken: string) => {
    try {
      const platform = Platform.OS;
      const response = await fetch(`${API_BASE_URL}/api/auth/GOOGLE`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, platform }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google auth server error:", errorText);
        throw new Error("서버 인증 실패");
      }

      const apiResponse: ApiResponse<LoginData> = await response.json();
      const result = apiResponse.data;
      const authData = createAuthDataFromResponse(result, "google");
      await signIn(authData);

      if (result.isNewMember) {
        Alert.alert("환영합니다!", `${result.name}님, 숏끼에 오신 것을 환영해요!`);
      }
    } catch (error) {
      console.error("Google idToken auth error:", error);
      Alert.alert("로그인 실패", "인증 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(null);
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

      const apiResponse: ApiResponse<LoginData> = await response.json();
      console.log("[DevLogin] response:", JSON.stringify(apiResponse));

      // BaseResponse 형태로 응답이 오므로 .data에서 추출
      const loginData = apiResponse.data;

      if (!loginData.accessToken) {
        console.error('No access token in response:', loginData);
        throw new Error("토큰이 없습니다");
      }

      const authData: AuthData = {
        tokens: {
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken || "",
        },
        user: {
          id: String(loginData.memberId || 1), // null이면 1로 폴백
          email: loginData.email || "dev@test.com",
          name: loginData.name || "테스트 사용자",
          provider: "naver",
        },
      };

      console.log('Dev Login Success - User:', authData.user.name, 'ID:', authData.user.id);
      await signIn(authData);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[DevLogin] timeout");
        Alert.alert("로그인 실패", "서버 응답이 없습니다. 네트워크/서버 상태를 확인해주세요.");
      }
      console.error("Dev Login Error:", error);
      console.log("Dev Login: 서버 연결 실패, Mock 로그인 사용");
      // 서버 연결 실패 시 Mock 로그인으로 폴백
      const mockAuthData = createMockAuthData("naver");
      await signIn(mockAuthData);
    } finally {
      console.log("[DevLogin] done");
      setIsLoading(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* 배경 장식 - 부드러운 그라데이션 느낌 원들 */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* 상단 로고 영역 */}
      <View style={styles.topSection}>
        {/* 로고 주변을 감싸는 떠다니는 아이콘들 */}
        <View style={styles.floatingArea}>
          <FloatingIcon icon={ChefHat} size={22} color={Colors.primary[200]} style={{ top: 0, left: screenWidth * 0.05 }} delay={0} duration={3200} floatRange={6} />
          <FloatingIcon icon={UtensilsCrossed} size={18} color={Colors.primary[200]} style={{ top: 10, right: screenWidth * 0.08 }} delay={400} duration={3000} floatRange={8} />
          <FloatingIcon icon={CookingPot} size={20} color={Colors.secondary[300]} style={{ bottom: 60, right: screenWidth * 0.02 }} delay={200} duration={3400} floatRange={7} />
          <FloatingIcon icon={Flame} size={16} color={Colors.primary[300]} style={{ bottom: 80, left: screenWidth * 0.02 }} delay={600} duration={2800} floatRange={6} />
          <FloatingIcon icon={Heart} size={14} color={Colors.primary[200]} style={{ top: 50, left: -4 }} delay={300} duration={3600} floatRange={5} />
          <FloatingIcon icon={Sparkles} size={16} color={Colors.secondary[300]} style={{ top: 40, right: 0 }} delay={500} duration={3200} floatRange={7} />
        </View>

        <View style={styles.logoCard}>
          <Image
            source={require("@/assets/images/icon_resized.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text style={styles.appName}>숏끼</Text>

        <View style={styles.taglineContainer}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>고민은 짧게, 요리는 함께</Text>
          <View style={styles.taglineLine} />
        </View>

        <Text style={styles.subText}>
          짧은 영상으로 발견하는 나만의 레시피
        </Text>
      </View>

      {/* 하단 로그인 영역 */}
      <View style={styles.bottomSection}>
        <Text style={styles.loginLabel}>SNS로 간편하게 시작하기</Text>

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
            {isLoading === "dev" ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <Text style={styles.devLoginText}>개발자 모드: 빠른 로그인 (테스트용)</Text>
            )}
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
    backgroundColor: "#FFFBF7",
    overflow: "hidden",
  },

  // 배경 장식 원 3개 - 은은하게
  bgCircle1: {
    position: "absolute",
    top: -screenWidth * 0.3,
    right: -screenWidth * 0.15,
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: screenWidth * 0.4,
    backgroundColor: Colors.primary[50],
    opacity: 0.7,
  },
  bgCircle2: {
    position: "absolute",
    top: screenHeight * 0.25,
    left: -screenWidth * 0.25,
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    borderRadius: screenWidth * 0.25,
    backgroundColor: Colors.secondary[50],
    opacity: 0.5,
  },
  bgCircle3: {
    position: "absolute",
    bottom: -screenWidth * 0.1,
    right: -screenWidth * 0.1,
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    borderRadius: screenWidth * 0.225,
    backgroundColor: Colors.primary[50],
    opacity: 0.4,
  },

  // 상단 섹션
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  floatingArea: {
    position: "absolute",
    top: screenHeight * 0.08,
    left: screenWidth * 0.08,
    right: screenWidth * 0.08,
    bottom: screenHeight * 0.12,
  },
  logoCard: {
    width: 144,
    height: 144,
    borderRadius: 38,
    backgroundColor: Colors.neutral[0],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary[400],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: "rgba(250, 129, 18, 0.08)",
  },
  logo: {
    width: 110,
    height: 110,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.neutral[900],
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing.sm,
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.md,
  },
  taglineLine: {
    width: 20,
    height: 1.5,
    backgroundColor: Colors.primary[300],
    borderRadius: 1,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.primary[500],
    letterSpacing: Typography.letterSpacing.wide,
  },
  subText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.neutral[400],
    textAlign: "center",
    lineHeight: Typography.fontSize.sm * 1.5,
  },

  // 하단 로그인 섹션
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  loginLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
    color: Colors.neutral[400],
    textAlign: "center",
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.wide,
  },
  naverButtonContainer: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#03C75A",
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#03C75A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonContainer: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.neutral[0],
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    marginRight: 10,
  },
  naverButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral[800],
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
