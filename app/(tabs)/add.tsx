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
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Link as LinkIcon,
  Search,
  X,
  User,
  ArrowLeft,
  Globe,
  PenLine,
  Sparkles,
  ChevronRight,
  Play,
  TriangleAlert,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { api, USE_MOCK } from "@/services/api";
import { FeedbackToast, useFeedbackToast } from "@/components/ui/FeedbackToast";

// API 응답 타입
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface ApiSourcePreview {
  sourceContentId: number;
  recipeId: number | null;
  platform: string;
  contentType: string;
  canonicalUrl: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorThumbnailUrl: string | null;
}

interface ApiImportPreview {
  sourceContentId: number;
  recipeId: number | null;
  platform: string;
  contentType: string;
  canonicalUrl: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorThumbnailUrl: string | null;
}

interface ApiImportResponse {
  importHistoryId: number;
  recipeId: number | null;
  title: string | null;
  sourceUrl: string;
  preview: ApiImportPreview;
  message: string;
}

interface ParsedRecipe {
  title: string;
  thumbnail: string;
  author: string;
  authorThumbnail?: string | null;
  duration: string;
  source: string;
  recipeId?: number | null;
}

const formatPlatformLabel = (platform?: string) => {
  if (!platform) return "웹";
  if (platform.toUpperCase() === "YOUTUBE") return "YouTube";
  return platform;
};

const parseRecipeFromUrl = async (url: string): Promise<ParsedRecipe | null> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return {
        title: "초간단 계란 볶음밥",
        thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
        author: "백종원",
        authorThumbnail: null,
        duration: "5분",
        source: "YouTube",
      };
    }

    if (url.includes("http")) {
      return {
        title: "맛있는 파스타 레시피",
        thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
        author: "쉐프킴",
        authorThumbnail: null,
        duration: "15분",
        source: "웹사이트",
      };
    }

    return null;
  }

  const encodedUrl = encodeURIComponent(url.trim());
  const response = await api.post<ApiResponse<ApiSourcePreview>>(
    `/api/v1/source/preview?url=${encodedUrl}`,
    {}
  );

  if (!response?.data) return null;

  return {
    title: response.data.title,
    thumbnail: response.data.thumbnailUrl,
    author: response.data.creatorName,
    authorThumbnail: response.data.creatorThumbnailUrl ?? null,
    duration: response.data.contentType,
    source: formatPlatformLabel(response.data.platform),
    recipeId: response.data.recipeId ?? null,
  };
};

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; returnTab?: string }>();

  const [mode, setMode] = useState<"select" | "url">(params.mode === "url" ? "url" : "select");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } = useFeedbackToast();

  const handleSearch = async () => {
    Keyboard.dismiss();
    if (!url.trim()) {
      Alert.alert("알림", "URL을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setParsedRecipe(null);
    try {
      const result = await parseRecipeFromUrl(url);
      if (result) {
        if (result.recipeId) {
          showToast("이미 등록된 레시피로 이동합니다");
          router.push(`/recipe/${result.recipeId}`);
          return;
        }
        setParsedRecipe(result);
      } else {
        Alert.alert("오류", "레시피 정보를 가져올 수 없습니다.\nURL을 확인해주세요.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "레시피 정보를 가져오는 중 오류가 발생했습니다.";
      Alert.alert("오류", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsedRecipe) return;
    setIsSaving(true);
    try {
      const sourceUrl = url.trim();
      if (!sourceUrl) {
        Alert.alert("알림", "URL을 입력해주세요.");
        return;
      }

      const response = await api.post<ApiResponse<ApiImportResponse>>("/api/v1/recipe/import", {
        sourceUrl,
      });

      if (response?.data?.recipeId && response?.data?.importHistoryId == null) {
        showToast("이미 등록된 레시피로 이동합니다");
        router.push(`/recipe/${response.data.recipeId}`);
        return;
      }

      showToast("레시피 생성 중 입니다. 잠시만 기다려주세요");
      setUrl("");
      setParsedRecipe(null);
      setMode("select");
      router.replace("/(tabs)");
    } catch (err: any) {
      const errorMessage = err?.message?.toLowerCase() || "";

      // 중복 레시피 에러는 토스트만 표시하고 현재 화면 유지
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("중복") ||
        errorMessage.includes("already") ||
        errorMessage.includes("이미 등록") ||
        errorMessage.includes("conflict") ||
        errorMessage.includes("409") ||
        errorMessage.includes("source_003")
      ) {
        showToast("이미 등록된 레시피에요");
        return;
      }

      const message = err instanceof Error ? err.message : "레시피 저장 중 오류가 발생했습니다.";
      Alert.alert("오류", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setUrl("");
    setParsedRecipe(null);
  };

  const handleBack = () => {
    if (params.returnTab) {
      const targetPath = params.returnTab === "index" ? "/(tabs)" : `/(tabs)/${params.returnTab}`;
      router.replace({
        pathname: targetPath as any,
        params: { openAddMenu: String(Date.now()) },
      });
      return;
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FEFEFE" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1 }}>
        {/* ── 고정 헤더 ── */}
        <View style={{ paddingTop: insets.top, backgroundColor: Colors.neutral[0] }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 52,
              paddingHorizontal: 20,
              gap: 12,
            }}
          >
            {mode === "url" && (
              <TouchableOpacity onPress={handleBack} hitSlop={8} style={{ padding: 2 }}>
                <ArrowLeft size={22} color={Colors.neutral[900]} />
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.neutral[900] }}>
              {mode === "url" ? "레시피 가져오기" : "레시피 추가"}
            </Text>
          </View>
        </View>

        {/* ═══ 모드 선택 ═══ */}
        {mode === "select" && (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={{ fontSize: 15, color: Colors.neutral[500], marginBottom: 20 }}>
                어떤 방식으로 레시피를 추가할까요?
              </Text>

              <TouchableOpacity
                onPress={() => setMode("url")}
                activeOpacity={0.85}
                style={{
                  backgroundColor: Colors.primary[500],
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Globe size={24} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFFFFF", marginBottom: 6 }}>
                  URL로 가져오기
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 }}>
                  유튜브, 블로그 등의 링크를 붙여넣으면{"\n"}AI가 자동으로 레시피를 추출해요
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/recipe-create-manual")}
                activeOpacity={0.7}
                style={{
                  backgroundColor: Colors.neutral[100],
                  borderRadius: 20,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    backgroundColor: "#FFFFFF",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PenLine size={20} color={Colors.neutral[600]} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900] }}>
                    직접 작성하기
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                    나만의 레시피를 직접 입력해요
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.neutral[400]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══ URL 모드 ═══ */}
        {mode === "url" && (
          <View style={{ flex: 1, minHeight: 0 }}>
            {/* 통합 카드 */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{
                  flex: 1,
                  minHeight: 340,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 16,
                  elevation: 2,
                }}
              >
                {/* 검색 입력 */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.neutral[50],
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      height: 48,
                      borderWidth: 1,
                      borderColor: Colors.neutral[100],
                    }}
                  >
                    <LinkIcon size={18} color={Colors.neutral[400]} />
                    <TextInput
                      style={{ flex: 1, marginLeft: 8, fontSize: 14, color: Colors.neutral[900] }}
                      placeholder="https://youtube.com/shorts/..."
                      placeholderTextColor={Colors.neutral[400]}
                      value={url}
                      onChangeText={setUrl}
                      onSubmitEditing={handleSearch}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    {url.length > 0 && (
                      <Pressable onPress={handleClear} hitSlop={8} style={{ padding: 2 }}>
                        <X size={18} color={Colors.neutral[400]} />
                      </Pressable>
                    )}
                  </View>
                  <Pressable
                    onPress={handleSearch}
                    disabled={isLoading || !url.trim()}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: isLoading || !url.trim() ? Colors.neutral[200] : Colors.primary[500],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Search size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>

                {/* 썸네일 프리뷰 */}
                <View style={{ flex: 1, borderRadius: 16, overflow: "hidden", position: "relative", marginTop: 14 }}>
                  {parsedRecipe ? (
                    <>
                      <Image
                        source={{ uri: parsedRecipe.thumbnail }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "rgba(0,0,0,0.55)",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>
                          {parsedRecipe.source}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: Colors.neutral[50],
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: Colors.neutral[100],
                        borderStyle: "dashed",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Globe size={28} color={Colors.neutral[300]} />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[400] }}>
                        레시피 미리보기
                      </Text>
                      <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                        링크를 붙여넣고 검색해 보세요
                      </Text>
                    </View>
                  )}
                </View>

                {/* 정보 */}
                <View style={{ paddingTop: 12, paddingHorizontal: 2, flexShrink: 0 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: Colors.neutral[900], lineHeight: 21 }}
                    numberOfLines={2}
                  >
                    {parsedRecipe ? parsedRecipe.title : "레시피 제목"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: Colors.neutral[100],
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {parsedRecipe?.authorThumbnail ? (
                        <Image
                          source={{ uri: parsedRecipe.authorThumbnail }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <User size={14} color={Colors.neutral[500]} />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: Colors.neutral[600] }}>
                      {parsedRecipe ? parsedRecipe.author : "작성자"}
                    </Text>
                  </View>
                </View>

              </View>

              {/* 경고 안내 */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  backgroundColor: "#FFFBEB",
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 16,
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <TriangleAlert size={15} color="#D97706" style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 12, color: "#D97706", lineHeight: 17 }}>
                  레시피 영상이 아닌 경우 추출에 실패할 수 있어요. 레시피 숏츠 링크를 넣어주세요!
                </Text>
              </View>
            </ScrollView>

            {/* 하단 CTA */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingTop: Spacing.md,
                paddingBottom: insets.bottom + Spacing.md,
                backgroundColor: Colors.neutral[0],
                borderTopWidth: 1,
                borderTopColor: Colors.neutral[100],
                ...Shadows.md,
              }}
            >
              <Text style={{ fontSize: 11, color: Colors.neutral[400], textAlign: "center", marginBottom: Spacing.sm, letterSpacing: -0.1 }}>
                조회수와 수익은 100% 원작자에게 돌아갑니다
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!parsedRecipe || isSaving}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !parsedRecipe || isSaving ? Colors.neutral[300] : Colors.primary[500],
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.xl,
                  ...(!parsedRecipe || isSaving ? {} : Shadows.primary),
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Sparkles size={20} color="#FFF" />
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: "700",
                        fontSize: Typography.fontSize.base,
                        marginLeft: Spacing.sm,
                      }}
                    >
                      레시피 생성하기
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <FeedbackToast
        message={toastMessage}
        variant={toastVariant}
        opacity={toastOpacity}
        translate={toastTranslate}
      />
    </KeyboardAvoidingView>
  );
}
