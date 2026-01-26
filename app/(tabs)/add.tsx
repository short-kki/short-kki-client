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
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Link,
  Search,
  X,
  Check,
  ChefHat,
  Clock,
  User,
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
      // 실제로는 서버에 저장
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert(
        "저장 완료",
        `"${parsedRecipe.title}" 레시피가 추가되었습니다.`,
        [
          {
            text: "확인",
            onPress: () => {
              setUrl("");
              setParsedRecipe(null);
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
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral[100],
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize["2xl"],
              fontWeight: Typography.fontWeight.bold,
              color: Colors.neutral[900],
            }}
          >
            레시피 추가
          </Text>
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              color: Colors.neutral[500],
              marginTop: Spacing.xs,
            }}
          >
            URL을 입력하여 레시피를 추가하세요
          </Text>
        </View>

        <View style={{ flex: 1, padding: Spacing.xl }}>
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
                    레시피 찾기
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Parsed Recipe Preview */}
          {parsedRecipe && (
            <View style={{ marginTop: Spacing.xl }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: Colors.neutral[700],
                  marginBottom: Spacing.sm,
                }}
              >
                찾은 레시피
              </Text>

              <View
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                }}
              >
                {/* Thumbnail */}
                <Image
                  source={{ uri: parsedRecipe.thumbnail }}
                  style={{ width: "100%", height: 180 }}
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

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isSaving ? Colors.neutral[300] : Colors.primary[500],
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  marginTop: Spacing.lg,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ChefHat size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        fontWeight: Typography.fontWeight.semiBold,
                        color: "#FFFFFF",
                        marginLeft: Spacing.sm,
                      }}
                    >
                      레시피북에 저장
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
      </View>
    </KeyboardAvoidingView>
  );
}
