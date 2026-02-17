import { useState, useRef, useCallback, useEffect } from "react";
import { Tabs, useLocalSearchParams, useRouter, useSegments } from "expo-router";
import { View, Pressable, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { Home, CalendarDays, Plus, Book, Users, Globe, PenLine, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, BorderRadius } from "@/constants/design-system";

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { openAddMenu } = useLocalSearchParams<{ openAddMenu?: string }>();
  const lastHandledOpenAddMenuRef = useRef<string | null>(null);
  const currentTab = typeof segments[1] === "string" ? segments[1] : "index";

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(300)).current;

  const openMenu = useCallback(() => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sheetTranslateY]);

  const closeMenu = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuOpen(false);
      onDone?.();
    });
  }, [overlayOpacity, sheetTranslateY]);

  const handleUrlImport = useCallback(() => {
    const returnTab = currentTab;
    closeMenu(() => {
      router.push({ pathname: "/(tabs)/add", params: { mode: "url", returnTab } });
    });
  }, [closeMenu, currentTab, router]);

  const handleManualCreate = useCallback(() => {
    const returnTab = currentTab;
    closeMenu(() => {
      router.push({ pathname: "/recipe-create-manual", params: { returnTab } });
    });
  }, [closeMenu, currentTab, router]);

  useEffect(() => {
    if (!openAddMenu) return;
    const token = String(openAddMenu);
    if (lastHandledOpenAddMenuRef.current === token) return;
    lastHandledOpenAddMenuRef.current = token;
    openMenu();
  }, [openAddMenu, openMenu]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary[500],
          tabBarInactiveTintColor: Colors.neutral[400],
          headerShown: false,
          sceneContainerStyle: { backgroundColor: Colors.neutral[50] },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
            height: 85,
            paddingTop: 10,
            paddingBottom: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "홈",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
                }}
              >
                <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="meal-plan"
          options={{
            title: "식단표",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
                }}
              >
                <CalendarDays size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarStyle: { display: "none" },
            tabBarIcon: () => (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: Colors.primary[500],
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                  shadowColor: Colors.primary[500],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openMenu();
            },
          }}
        />
        <Tabs.Screen
          name="recipe-book"
          options={{
            title: "레시피북",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
                }}
              >
                <Book size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="group"
          options={{
            title: "그룹",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: focused ? `${Colors.primary[500]}15` : "transparent",
                }}
              >
                <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        {/* Hidden screens - accessible via navigation but not in tab bar */}
        <Tabs.Screen
          name="shorts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* ─── 추가 메뉴 바텀시트 (Modal 대신 absolute View) ─── */}
      <View
        pointerEvents={menuOpen ? "auto" : "none"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          justifyContent: "flex-end",
        }}
      >
        {/* 오버레이 */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => closeMenu()} />
        </Animated.View>

        {/* 시트 */}
        <Animated.View
          style={{
            transform: [{ translateY: sheetTranslateY }],
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: BorderRadius.xl,
            borderTopRightRadius: BorderRadius.xl,
            paddingTop: Spacing.sm,
            paddingBottom: insets.bottom + Spacing.xl + 100,
            marginBottom: -100,
            paddingHorizontal: Spacing.xl,
          }}
        >
          {/* 핸들 바 */}
          <View style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: Colors.neutral[200],
            alignSelf: "center",
            marginBottom: Spacing.lg,
          }} />

          {/* 타이틀 */}
          <Text style={{
            fontSize: 18,
            fontWeight: "700",
            color: Colors.neutral[900],
            marginBottom: Spacing.lg,
          }}>
            레시피 추가
          </Text>

          {/* URL로 가져오기 */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleUrlImport}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.sm,
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: Colors.primary[50],
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Globe size={22} color={Colors.primary[500]} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900] }}>
                URL로 가져오기
              </Text>
              <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                유튜브, 블로그 링크로 자동 추출
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.neutral[300]} />
          </TouchableOpacity>

          {/* 직접 작성하기 */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleManualCreate}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: Colors.secondary[50],
              justifyContent: "center",
              alignItems: "center",
            }}>
              <PenLine size={22} color={Colors.secondary[600]} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900] }}>
                직접 작성하기
              </Text>
              <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                나만의 레시피를 직접 입력
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.neutral[300]} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
