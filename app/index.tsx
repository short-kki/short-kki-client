import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Colors, Typography } from "@/constants/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useShareIntent } from "expo-share-intent";

const { width: screenWidth } = Dimensions.get("window");

export default function SplashScreen() {
  const { isLoggedIn, isLoading } = useAuth();
  const { hasShareIntent } = useShareIntent();
  const router = useRouter();

  // 마운트 시점의 share intent 여부를 기록 (resetShareIntent() 이후에도 유지)
  const hadShareIntentRef = useRef(false);
  if (hasShareIntent) hadShareIntentRef.current = true;

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  useEffect(() => {
    // 로고 fade-in + scale
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
    // 앱 이름 fade-in
    textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    // 태그라인 fade-in
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, [logoOpacity, logoScale, textOpacity, taglineOpacity]);

  useEffect(() => {
    if (isLoading) return;

    // 인증 확인 후 최소 1.2초 뒤에 전환 (애니메이션 감상 시간)
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        // share intent가 있었으면 _layout.tsx가 이미 /(tabs)/add로 navigate했으므로 스킵
        // hadShareIntentRef: 렌더 시 캡처된 이전 상태 / hasShareIntent: 클로저의 현재 상태
        if (!hadShareIntentRef.current && !hasShareIntent) {
          router.replace("/(tabs)");
        }
      } else {
        router.replace("/login");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn, router, hasShareIntent]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* 배경 장식 원 - 로그인 화면과 동일 */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        <Animated.View style={[styles.logoCard, logoAnimatedStyle]}>
          <Image
            source={require("@/assets/images/icon_resized.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.appName}>숏끼</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>고민은 짧게, 요리는 함께</Text>
          <View style={styles.taglineLine} />
        </Animated.View>
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
    bottom: -screenWidth * 0.1,
    left: -screenWidth * 0.25,
    width: screenWidth * 0.5,
    height: screenWidth * 0.5,
    borderRadius: screenWidth * 0.25,
    backgroundColor: Colors.secondary[50],
    opacity: 0.5,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCard: {
    width: 144,
    height: 144,
    borderRadius: 38,
    backgroundColor: Colors.neutral[0],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
    marginBottom: 8,
    textAlign: "center",
  },
  taglineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
});
