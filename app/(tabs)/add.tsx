import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Link,
  Search,
  X,
  ChefHat,
  Clock,
  User,
  ArrowLeft,
  Globe,
  PenLine,
  Info,
  Sparkles,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// URL에서 레시피 정보 파싱 (더미)
const parseRecipeFromUrl = async (url: string): Promise<ParsedRecipe | null> => {
  // 실제로는 서버에서 URL을 파싱하여 정보를 가져옴
  await new Promise((resolve) => setTimeout(resolve, 1500)); // 로딩 시뮬레이션

  // YouTube URL 체크
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return {
      title: "초간단 계란 볶음밥",
      thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
      author: "백종원",
      duration: "5분",
      source: "YouTube",
    };
  }

  // 다른 URL
  if (url.includes("http")) {
    return {
      title: "맛있는 파스타 레시피",
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
      author: "쉐프킴",
      duration: "15분",
      source: "웹사이트",
    };
  }

  return null;
};

interface ParsedRecipe {
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  source: string;
}

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<"select" | "url">(params.mode === "url" ? "url" : "select");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async () => {
    if (!url.trim()) {
      Alert.alert("알림", "URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setParsedRecipe(null);

    try {
      const result = await parseRecipeFromUrl(url);
      if (result) {
        setParsedRecipe(result);
      } else {
        Alert.alert("오류", "레시피 정보를 가져올 수 없습니다. URL을 확인해주세요.");
      }
    } catch (error) {
      Alert.alert("오류", "레시피 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);

    try {
      // 백그라운드 파싱 시작 (비동기 처리)
      // 실제로는 서버에서 비동기로 처리하고 푸시 알림 발송

      Alert.alert(
        "레시피 생성 중",
        "레시피가 생성되면 알림으로 알려드릴게요!\n잠시 후 '내 레시피북'에서 확인하실 수 있습니다.",
        [
          {
            text: "확인",
            onPress: () => {
              setUrl("");
              setParsedRecipe(null);
              setMode("select");
              router.push("/(tabs)/recipe-book");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("오류", "레시피 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setParsedRecipe(null);
  };

  const handleBack = () => {
    if (mode === "url") {
      setMode("select");
      setUrl("");
      setParsedRecipe(null);
    } else {
      router.back();
    }
  };

  const handleManualCreate = () => {
    router.push("/recipe-create-manual");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.neutral[50] }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
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
          {mode === "url" && (
            <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: Spacing.sm }}>
              <ArrowLeft size={24} color={Colors.neutral[900]} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
              }}
            >
              {mode === "select" ? "레시피 추가" : "URL로 만들기"}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.xl }}>
          {/* 모드 선택 화면 */}
          {mode === "select" && (
            <View style={{ gap: Spacing.lg }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  color: Colors.neutral[600],
                  marginBottom: Spacing.sm,
                }}
              >
                어떤 방식으로 레시피를 추가할까요?
              </Text>

              {/* URL로 만들기 */}
              <TouchableOpacity
                onPress={() => setMode("url")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.xl,
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: Colors.primary[50],
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Spacing.lg,
                  }}
                >
                  <Globe size={28} color={Colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[900],
                    }}
                  >
                    URL로 만들기
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    유튜브, 블로그 등의 URL을 입력하면{"\n"}자동으로 레시피를 추출해요
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 직접 작성하기 */}
              <TouchableOpacity
                onPress={handleManualCreate}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.xl,
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: Colors.secondary[50],
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Spacing.lg,
                  }}
                >
                  <PenLine size={28} color={Colors.secondary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[900],
                    }}
                  >
                    직접 작성하기
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    나만의 레시피를 직접 입력하여{"\n"}저장할 수 있어요
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* URL 입력 모드 */}
          {mode === "url" && (
            <View>
              {/* URL Input */}
              <View>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.medium,
                    color: Colors.neutral[700],
                    marginBottom: Spacing.sm,
                  }}
                >
                  레시피 URL
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[0],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.md,
                  }}
                >
                  <Link size={20} color={Colors.neutral[400]} />
                  <TextInput
                    style={{
                      flex: 1,
                      height: 52,
                      marginLeft: Spacing.sm,
                      fontSize: Typography.fontSize.base,
                      color: Colors.neutral[900],
                    }}
                    placeholder="https://youtube.com/shorts/..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  {url.length > 0 && (
                    <Pressable onPress={handleClear} style={{ padding: 4 }}>
                      <X size={20} color={Colors.neutral[400]} />
                    </Pressable>
                  )}
                </View>

                {/* Search Button */}
                <Pressable
                  onPress={handleSearch}
                  disabled={isLoading || !url.trim()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      isLoading || !url.trim() ? Colors.neutral[200] : Colors.primary[500],
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.lg,
                    marginTop: Spacing.md,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Search size={20} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: Typography.fontSize.base,
                          fontWeight: Typography.fontWeight.semiBold,
                          color: "#FFFFFF",
                          marginLeft: Spacing.sm,
                        }}
                      >
                        찾기
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Parsed Recipe Preview */}
              {parsedRecipe && (
                <View style={{ marginTop: Spacing.xl }}>
                  {/* 썸네일 - 크게 표시 */}
                  <View
                    style={{
                      backgroundColor: Colors.neutral[0],
                      borderRadius: BorderRadius.xl,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: Colors.neutral[200],
                    }}
                  >
                    <Image
                      source={{ uri: parsedRecipe.thumbnail }}
                      style={{ width: "100%", height: 220 }}
                      contentFit="cover"
                    />

                    {/* Info */}
                    <View style={{ padding: Spacing.lg }}>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.lg,
                          fontWeight: Typography.fontWeight.bold,
                          color: Colors.neutral[900],
                        }}
                      >
                        {parsedRecipe.title}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: Spacing.md,
                          gap: Spacing.lg,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <User size={16} color={Colors.neutral[500]} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: Colors.neutral[600],
                              marginLeft: 4,
                            }}
                          >
                            {parsedRecipe.author}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Clock size={16} color={Colors.neutral[500]} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: Colors.neutral[600],
                              marginLeft: 4,
                            }}
                          >
                            {parsedRecipe.duration}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          backgroundColor: Colors.neutral[100],
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 4,
                          alignSelf: "flex-start",
                          marginTop: Spacing.md,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: Colors.neutral[600] }}>
                          {parsedRecipe.source}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 저작권 안내 문구 */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      backgroundColor: Colors.info[50],
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.md,
                      marginTop: Spacing.lg,
                      gap: Spacing.sm,
                    }}
                  >
                    <Info size={18} color={Colors.info[600]} style={{ marginTop: 2 }} />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: Typography.fontSize.sm,
                        color: Colors.info[700],
                        lineHeight: 20,
                      }}
                    >
                      이 영상은 유튜브 공식 플레이어로 재생되며, 조회수와 수익은 100% 원작자에게 돌아갑니다.
                    </Text>
                  </View>

                  {/* 레시피 생성하기 Button */}
                  <Pressable
                    onPress={handleSave}
                    disabled={isSaving}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSaving ? Colors.neutral[300] : Colors.primary[500],
                      paddingVertical: Spacing.lg,
                      borderRadius: BorderRadius.lg,
                      marginTop: Spacing.lg,
                    }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={20} color="#FFFFFF" />
                        <Text
                          style={{
                            fontSize: Typography.fontSize.base,
                            fontWeight: Typography.fontWeight.bold,
                            color: "#FFFFFF",
                            marginLeft: Spacing.sm,
                          }}
                        >
                          레시피 생성하기
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Helper Text */}
              {!parsedRecipe && !isLoading && (
                <View style={{ marginTop: Spacing.xl }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      textAlign: "center",
                    }}
                  >
                    지원하는 사이트
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[400],
                      textAlign: "center",
                      marginTop: Spacing.xs,
                    }}
                  >
                    YouTube, 만개의레시피, 해먹남녀 등
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
