import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  FileText,
  ChevronRight,
  LogOut,
  Trash2,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

const SETTINGS_SECTIONS = [
  {
    title: "알림",
    items: [
      { id: "push", label: "푸시 알림", icon: Bell, type: "toggle", value: true },
    ],
  },
  {
    title: "앱 설정",
    items: [
      { id: "darkmode", label: "다크 모드", icon: Moon, type: "toggle", value: false },
      { id: "language", label: "언어", icon: Globe, type: "navigate", value: "한국어" },
    ],
  },
  {
    title: "계정",
    items: [
      { id: "privacy", label: "개인정보 설정", icon: Shield, type: "navigate" },
    ],
  },
  {
    title: "지원",
    items: [
      { id: "help", label: "도움말", icon: HelpCircle, type: "navigate" },
      { id: "terms", label: "이용약관", icon: FileText, type: "navigate" },
      { id: "privacy-policy", label: "개인정보처리방침", icon: FileText, type: "navigate" },
    ],
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [toggleStates, setToggleStates] = React.useState<Record<string, boolean>>({
    push: true,
    darkmode: false,
  });

  const handleToggle = (id: string) => {
    setToggleStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemPress = (id: string) => {
    // 프로토타입: 알림 표시
    console.log(`Setting item pressed: ${id}`);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: "700",
            color: Colors.neutral[900],
          }}
        >
          설정
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {SETTINGS_SECTIONS.map((section, sectionIndex) => (
          <View key={sectionIndex} style={{ marginTop: Spacing.lg }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: Colors.neutral[500],
                paddingHorizontal: Spacing.xl,
                marginBottom: Spacing.sm,
              }}
            >
              {section.title}
            </Text>
            <View
              style={{
                backgroundColor: Colors.neutral[0],
                marginHorizontal: Spacing.lg,
                borderRadius: BorderRadius.xl,
                overflow: "hidden",
              }}
            >
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => item.type === "navigate" && handleItemPress(item.id)}
                  activeOpacity={item.type === "toggle" ? 1 : 0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.md,
                    borderBottomWidth: itemIndex < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.neutral[100],
                  }}
                >
                  <item.icon size={20} color={Colors.neutral[600]} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: Typography.fontSize.base,
                      color: Colors.neutral[900],
                      marginLeft: Spacing.md,
                    }}
                  >
                    {item.label}
                  </Text>
                  {item.type === "toggle" ? (
                    <Switch
                      value={toggleStates[item.id]}
                      onValueChange={() => handleToggle(item.id)}
                      trackColor={{
                        false: Colors.neutral[200],
                        true: Colors.primary[500],
                      }}
                    />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      {item.value && (
                        <Text
                          style={{
                            fontSize: Typography.fontSize.sm,
                            color: Colors.neutral[500],
                            marginRight: 4,
                          }}
                        >
                          {item.value}
                        </Text>
                      )}
                      <ChevronRight size={20} color={Colors.neutral[400]} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* 로그아웃 & 탈퇴 */}
        <View style={{ marginTop: Spacing.xl, paddingHorizontal: Spacing.lg }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: Spacing.md,
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              marginBottom: Spacing.sm,
            }}
          >
            <LogOut size={20} color={Colors.error.main} />
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontWeight: "600",
                color: Colors.error.main,
                marginLeft: Spacing.sm,
              }}
            >
              로그아웃
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: Spacing.md,
            }}
          >
            <Trash2 size={18} color={Colors.neutral[400]} />
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                marginLeft: Spacing.xs,
              }}
            >
              계정 삭제
            </Text>
          </TouchableOpacity>
        </View>

        {/* 버전 정보 */}
        <Text
          style={{
            textAlign: "center",
            fontSize: Typography.fontSize.sm,
            color: Colors.neutral[400],
            marginTop: Spacing.xl,
          }}
        >
          숏끼 v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
