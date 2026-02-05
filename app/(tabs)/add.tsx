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
} from "lucide-react-native";
import { Colors, Spacing } from "@/constants/design-system";
import { api, USE_MOCK } from "@/services/api";
import { Toast, useToast } from "@/components/ui";

// API 응답 타입
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

interface ApiSourcePreview {
  sourceContentId: number;
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
  };
};

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<"select" | "url">(params.mode === "url" ? "url" : "select");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toastMessage, toastOpacity, toastTranslate, showToast } = useToast();

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

      await api.post<ApiResponse<ApiImportResponse>>("/api/v1/recipe/import", {
        sourceUrl,
      });

      showToast("레시피 생성 중 입니다. 잠시만 기다려주세요");
      setUrl("");
      setParsedRecipe(null);
      setMode("select");
      router.replace("/(tabs)");
    } catch (err) {
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
    setMode("select");
    setUrl("");
    setParsedRecipe(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FEFEFE" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1 }}>
        {/* ── 고정 헤더 ── */}
        <View style={{ paddingTop: insets.top, backgroundColor: "#FEFEFE" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 52,
              paddingHorizontal: 20,
            }}
          >
            {mode === "url" ? (
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ArrowLeft size={20} color={Colors.neutral[700]} />
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.neutral[900] }}>
                레시피 추가
              </Text>
            )}
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
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
                  {["YouTube", "만개의레시피", "해먹남녀", "블로그"].map((s) => (
                    <View
                      key={s}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>{s}</Text>
                    </View>
                  ))}
                </View>
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
            {/* 히어로 */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 18,
                paddingBottom: 14,
                flexShrink: 0,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 28,
                  backgroundColor: Colors.primary[50],
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Globe size={40} color={Colors.primary[500]} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.neutral[900], marginBottom: 6 }}>
                URL로 가져오기
              </Text>
              <Text style={{ fontSize: 14, color: Colors.neutral[500], textAlign: "center", lineHeight: 20 }}>
                레시피 링크를 붙여넣어 주세요
              </Text>
            </View>

            {/* 검색 입력 */}
            <View style={{ paddingHorizontal: 20, flexShrink: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[100],
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    height: 50,
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
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: isLoading || !url.trim() ? Colors.neutral[200] : Colors.primary[500],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Search size={22} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>

              {/* 태그/문구 고정 */}
              <View style={{ alignItems: "center" }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center" }}>
                  {["YouTube", "만개의레시피", "해먹남녀", "블로그"].map((site) => (
                    <View
                      key={site}
                      style={{
                        backgroundColor: Colors.neutral[100],
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>{site}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 결과 영역 (고정 레이아웃) */}
            <View style={{ flex: 1, minHeight: 0, paddingHorizontal: 20, paddingTop: 14 }}>
              <View
                style={{
                  height: 280,
                  backgroundColor: parsedRecipe ? "#FFFFFF" : Colors.neutral[50],
                  borderRadius: 24,
                  padding: 12,
                  borderWidth: parsedRecipe ? 0 : 1,
                  borderColor: Colors.neutral[100],
                  shadowColor: parsedRecipe ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: parsedRecipe ? 0.08 : 0,
                  shadowRadius: 16,
                  elevation: parsedRecipe ? 3 : 0,
                }}
              >
                {/* 썸네일 */}
                <View style={{ flex: 1, borderRadius: 16, overflow: "hidden", position: "relative" }}>
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
                        backgroundColor: Colors.neutral[100],
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Globe size={24} color={Colors.neutral[400]} />
                      <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
                        결과가 여기에 표시됩니다
                      </Text>
                    </View>
                  )}
                </View>

                {/* 정보 */}
                <View style={{ paddingTop: 8, paddingHorizontal: 4, flexShrink: 0 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: Colors.neutral[900], lineHeight: 21 }}
                    numberOfLines={2}
                  >
                    {parsedRecipe ? parsedRecipe.title : "레시피 제목"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 }}>
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
            </View>

            {/* 하단 CTA (고정 위치) */}
            <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: insets.bottom + 18 }}>
              <Text style={{ fontSize: 12, color: Colors.neutral[400], textAlign: "center", marginBottom: 10 }}>
                조회수와 수익은 100% 원작자에게 돌아갑니다
              </Text>
              <Pressable
                onPress={handleSave}
                disabled={!parsedRecipe || isSaving}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !parsedRecipe || isSaving ? Colors.neutral[300] : Colors.primary[500],
                  height: 54,
                  borderRadius: 16,
                }}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                      생성 요청 중
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginLeft: 8 }}>
                      레시피 생성하기
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>

      <Toast
        message={toastMessage}
        opacity={toastOpacity}
        translate={toastTranslate}
      />
    </KeyboardAvoidingView>
  );
}
