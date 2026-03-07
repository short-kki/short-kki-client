import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

/**
 * expo-share-intent 딥링크 수신 라우트
 *
 * Share Extension이 shortkki://dataUrl=shortkkiShareKey 로 앱을 열면
 * 이 화면이 매칭됩니다. 실제 공유 데이터 처리는 _layout.tsx의
 * useShareIntent() 훅에서 수행하므로, 여기서는 로딩만 보여줍니다.
 */
export default function ShareIntentScreen() {
  const router = useRouter();

  useEffect(() => {
    // useShareIntent 훅이 공유 데이터를 처리하고 라우팅하므로
    // 만약 처리되지 않으면 홈으로 이동
    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FA8112" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFBF7",
  },
});
