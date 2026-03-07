import { useEffect, useRef } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * 네이버 로그인 SDK 콜백 처리
 *
 * 네이버 SDK가 shortkki://thirdPartyLoginResult?... 로 리다이렉트하면
 * 이 화면이 열립니다. 네이티브 SDK가 콜백 URL을 처리하고
 * login.tsx의 NaverLogin.login() 프로미스가 resolve되어 인증이 완료될 때까지
 * 로딩 화면을 보여줍니다.
 */
export default function ThirdPartyLoginResult() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    if (isLoggedIn) {
      handled.current = true;
      router.replace("/(tabs)");
      return;
    }

    // SDK가 콜백을 처리하고 인증이 완료될 시간을 줌
    // 5초 내 로그인 안 되면 로그인 화면으로 이동
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        router.replace("/login");
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoggedIn, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F5F0",
  },
});
