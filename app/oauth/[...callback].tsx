import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // URL에서 OAuth 파라미터 추출
    const handleOAuthCallback = async () => {
      const url = await Linking.getInitialURL();

      if (url) {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code as string | undefined;
        const error = parsed.queryParams?.error as string | undefined;

        // 로그인 화면으로 돌아가면서 OAuth 결과 전달
        if (code || error) {
          // provider 판별: scheme이나 path로 구분
          let provider: "naver" | "google" = "google";
          if (parsed.path?.includes("naver") || url.includes("shortkki://oauth/naver")) {
            provider = "naver";
          }

          router.replace({
            pathname: "/login",
            params: {
              oauth_code: code,
              oauth_error: error,
              oauth_provider: provider
            }
          });
          return;
        }
      }

      // 파라미터가 없으면 그냥 로그인 화면으로
      router.replace("/login");
    };

    handleOAuthCallback();
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
