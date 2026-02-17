import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, LogBox } from "react-native";
import { useEffect } from "react";
import "react-native-reanimated";

// 특정 에러 메시지 LogBox에서 무시
LogBox.ignoreLogs([
  "이미 레시피북에 추가된",
  "이미 등록",
  "중복",
]);

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Colors } from "@/constants/design-system";
import { pushNotificationService } from "@/services/pushNotification";

function RootLayoutNav() {
  const { isLoading } = useAuth();

  // 푸시 알림 초기화
  useEffect(() => {
    pushNotificationService.initialize();
    pushNotificationService.handleInitialNotification();

    return () => pushNotificationService.cleanup();
  }, []);

  // 인증 상태 로딩 중일 때 스플래시 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[0] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.neutral[50] } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="search-results" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="recipe" options={{ headerShown: false }} />
        <Stack.Screen name="shopping-list" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="recipe-book-detail" options={{ headerShown: false }} />
        <Stack.Screen name="group-recipe-books" options={{ headerShown: false }} />
        <Stack.Screen name="recipe-create-manual" options={{ headerShown: false }} />
        <Stack.Screen name="group-members" options={{ headerShown: false }} />
        <Stack.Screen name="group-edit" options={{ headerShown: false }} />
        <Stack.Screen name="curation-shorts" options={{ headerShown: false }} />
        <Stack.Screen name="group-feed-create" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="group/invite/[inviteCode]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

// 기본 테마의 background를 앱 배경색으로 통일 (전환 애니메이션 번쩍임 방지)
const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.neutral[50],
    card: Colors.neutral[0],
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.neutral[50],
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
