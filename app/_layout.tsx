import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import "react-native-reanimated";

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="recipe" options={{ headerShown: false }} />
        <Stack.Screen name="shopping-list" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="recipe-book-detail" options={{ headerShown: false }} />
        <Stack.Screen name="group-members" options={{ headerShown: false }} />
        <Stack.Screen name="group-edit" options={{ headerShown: false }} />
        <Stack.Screen name="group-feed-create" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="group/invite/[inviteCode]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
