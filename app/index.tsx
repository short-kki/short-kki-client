import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();

  // 로딩 중일 때는 아무것도 렌더링하지 않음 (스플래시가 _layout에서 표시됨)
  if (isLoading) {
    return null;
  }

  // 로그인 여부에 따라 적절한 화면으로 리다이렉트
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
