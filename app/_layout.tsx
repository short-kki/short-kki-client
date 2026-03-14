import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { useShareIntent } from "expo-share-intent";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MuteProvider } from "@/contexts/MuteContext";
import { Colors } from "@/constants/design-system";
import { pushNotificationService } from "@/services/pushNotification";
import { remoteConfigService } from "@/services/remoteConfig";
import { useUpdateCheck } from "@/hooks/useUpdateCheck";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";
import UpdateModal from "@/components/ui/UpdateModal";
import MaintenanceModal from "@/components/ui/MaintenanceModal";

// 네이티브 스플래시를 인증 로딩 완료까지 유지
SplashScreen.preventAutoHideAsync();

// 특정 에러 메시지 LogBox에서 무시
LogBox.ignoreLogs([
  "이미 레시피북에 추가된",
  "이미 등록",
  "중복",
]);

/** 텍스트에서 URL을 추출하는 헬퍼 */
function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { needsUpdate, updateMessage } = useUpdateCheck();
  const { isUnderMaintenance, maintenanceMessage } = useMaintenanceCheck();

  // 인증 로딩 완료 후 네이티브 스플래시 숨김
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // 푸시 알림 + Remote Config 초기화
  useEffect(() => {
    pushNotificationService.initialize();
    pushNotificationService.handleInitialNotification();
    remoteConfigService.initialize();

    return () => pushNotificationService.cleanup();
  }, []);

  // 외부 앱에서 URL 공유 수신 → 레시피 가져오기 페이지로 이동
  useEffect(() => {
    if (!hasShareIntent) return;
    if (isLoading) return;

    const sharedText = shareIntent.text || "";
    const sharedUrl = extractUrl(sharedText) || shareIntent.webUrl || null;

    let timerId: ReturnType<typeof setTimeout> | undefined;
    if (sharedUrl) {
      // auth guard 리다이렉트와의 경합 방지를 위해 약간 지연
      // resetShareIntent()는 타이머 내부에서 호출해야 함 —
      // 밖에서 호출하면 hasShareIntent가 false로 바뀌며 effect cleanup이
      // 타이머를 취소해버려 router.push가 실행되지 않음
      timerId = setTimeout(() => {
        router.push({
          pathname: "/(tabs)/add",
          params: { sharedUrl },
        });
        resetShareIntent();
      }, 100);
    } else {
      resetShareIntent();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [hasShareIntent, isLoading]);

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
        <Stack.Screen name="group-calendar" options={{ headerShown: false }} />
        <Stack.Screen name="group-feed-create" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="group/invite/[inviteCode]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      <MaintenanceModal visible={isUnderMaintenance} message={maintenanceMessage} />
      <UpdateModal visible={!isUnderMaintenance && needsUpdate} message={updateMessage} />
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
        <MuteProvider>
          <ThemeProvider value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}>
            <RootLayoutNav />
          </ThemeProvider>
        </MuteProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
