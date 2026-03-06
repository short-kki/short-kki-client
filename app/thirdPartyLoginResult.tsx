import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

/**
 * 네이버 로그인 SDK 콜백 처리
 *
 * 네이버 SDK가 shortkki://thirdPartyLoginResult?... 로 리다이렉트하는데,
 * 실제 인증은 네이티브 SDK의 accessToken 방식으로 처리되므로
 * 이 화면은 로그인 화면으로 돌려보내기만 합니다.
 */
export default function ThirdPartyLoginResult() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

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
