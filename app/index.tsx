import { useRef } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useShareIntent } from "expo-share-intent";

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();
  const { hasShareIntent } = useShareIntent();

  // 마운트 시점의 share intent 여부를 기록 (resetShareIntent() 이후에도 유지)
  const hadShareIntentRef = useRef(false);
  if (hasShareIntent) hadShareIntentRef.current = true;

  // 인증 로딩 중이거나 share intent가 있으면 _layout.tsx가 처리하도록 대기
  if (isLoading || hadShareIntentRef.current) {
    return <View style={{ flex: 1, backgroundColor: "#FFFBF7" }} />;
  }

  return <Redirect href={isLoggedIn ? "/(tabs)" : "/login"} />;
}
