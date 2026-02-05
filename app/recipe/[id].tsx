import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Play,
  Bookmark,
  Clock,
  Users,
  ChefHat,
  CalendarPlus,
  ShoppingCart,
  Share2,
  MoreVertical,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import RecipeBookSelectModal from "@/components/RecipeBookSelectModal";
import { recipeApi, type RecipeResponse } from "@/services/recipeApi";
import { API_BASE_URL } from "@/constants/oauth";
import { api } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 기본 레시피 값 (로딩 전 또는 에러 시)
const DEFAULT_RECIPE: RecipeResponse = {
  id: 0,
  title: "",
  description: "",
  mainImgUrl: "",
  cookingTime: 0,
  servingSize: 0,
  difficulty: "BEGINNER",
  cuisineType: "KOREAN",
  mealType: "MAIN",
  authorName: "",
  bookmarkCount: 0,
  ingredients: [],
  steps: [],
  tags: [],
  createdAt: "",
  updatedAt: "",
};

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const idStr = params.id;
  const id = idStr ? parseInt(idStr, 10) : 0;

  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [showBookSelectModal, setShowBookSelectModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false); // 로컬 북마크 상태

  // 데이터 로딩
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("잘못된 접근입니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await recipeApi.getById(id);
        console.log("Recipe API Response:", JSON.stringify(data, null, 2));
        setRecipe(data);
        setServings(data.servingSize);
        // TODO: 북마크 여부는 API 응답에 포함되어야 함. 현재는 임의로 false 처리하거나 별도 조회 필요
        // 현재 API 명세에는 isBookmarked가 없음. 
        setIsBookmarked(false);
      } catch (err: any) {
        console.error("Failed to fetch recipe:", err);
        setError(err.message || "레시피를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const toggleBookmark = () => {
    // API 연결 필요 (북마크 추가/취소)
    // 현재는 UI 상태만 변경
    setIsBookmarked(!isBookmarked);
    if (recipe) {
      // 실제로는 서버 상태를 다시 불러오거나 해야 함
      // 여기서는 간단히 로컬 카운트만 조절하는 흉내 (실제 반영은 안됨)
    }
  };

  const adjustServings = (delta: number) => {
    const newServings = Math.max(1, servings + delta);
    setServings(newServings);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 재료 양 조절 (인분 기준)
  const getAdjustedAmount = (amount: number, unit: string) => {
    if (!recipe) return `${amount}${unit}`;

    // 기본 인분(recipe.servingSize) 대비 현재 인분(servings) 비율
    const ratio = servings / recipe.servingSize;
    const adjustedAmount = amount * ratio;

    // 소수점 처리 (정수면 그대로, 아니면 소수점 1자리)
    const formattedAmount = Number.isInteger(adjustedAmount)
      ? adjustedAmount
      : adjustedAmount.toFixed(1);

    return `${formattedAmount}${unit}`;
  };

  const handleAddToRecipeBook = () => {
    setShowBookSelectModal(true);
  };

  const handleAddToMealPlan = () => {
    Alert.alert(
      "식단에 추가",
      `"${recipe?.title}" 레시피를 어떤 날짜에 추가할까요?`,
      [
        { text: "오늘", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "내일", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "직접 선택", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const handleShoppingList = () => {
    if (!recipe) return;
    Alert.alert(
      "장보기 목록에 추가",
      `${recipe.ingredients.length}개의 재료가 장보기 목록에 추가되었습니다.`,
      [{ text: "확인" }]
    );
  };

  const handleMoreOptions = async () => {
    if (!recipe) return;
    Alert.alert(
      recipe.title,
      "어떤 작업을 하시겠어요?",
      [
        {
          text: "공유하기",
          onPress: async () => {
            try {
              await Share.share({
                message: `숏끼에서 "${recipe.title}" 레시피를 확인해보세요!`,
              });
            } catch (e) {
              console.log(e);
            }
          },
        },
        { text: "신고하기", onPress: () => Alert.alert("신고", "신고가 접수되었습니다.") },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  // 이미지 URL 처리 헬퍼 함수
  const getImageUrl = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";
    if (url.startsWith("http")) return url;
    // 상대 경로인 경우 API URL 추가
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[50] }}>
        <Text style={{ color: Colors.neutral[500] }}>
          {error || "레시피 정보를 찾을 수 없습니다."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text style={{ color: Colors.primary[500] }}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section - Thumbnail */}
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: getImageUrl(recipe.mainImgUrl) }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH * 0.75,
            }}
            contentFit="cover"
          />

          {/* Gradient Overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 100,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          />

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* More Button */}
          <TouchableOpacity
            onPress={handleMoreOptions}
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: insets.top + 8,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MoreVertical size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Play Button - Video URL이 있을 때만 표시 (지금은 dummy로 없다고 가정하거나 확인 필요) */}
          {recipe.sourceUrl && (
            <Pressable
              onPress={() => {
                // 외부 링크 열기 또는 숏폼 플레이어로 이동
                // router.push({ pathname: "/(tabs)/shorts" });
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: [{ translateX: -32 }, { translateY: -32 }],
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
            </Pressable>
          )}

          {/* Duration Badge */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={14} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
              {recipe.cookingTime}분
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={{ padding: Spacing.xl }}>
          {/* Title & Bookmark */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text
                style={{
                  fontSize: Typography.fontSize["2xl"],
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                  lineHeight: 32,
                }}
              >
                {recipe.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.sm }}>
                <View
                  style={{
                    backgroundColor: Colors.primary[100],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: Colors.primary[600], fontSize: 12, fontWeight: "600" }}>
                    {recipe.difficulty}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={toggleBookmark} style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isBookmarked ? Colors.primary[50] : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Bookmark
                  size={24}
                  color={isBookmarked ? Colors.primary[500] : Colors.neutral[400]}
                  fill={isBookmarked ? Colors.primary[500] : "transparent"}
                />
              </View>
              <Text style={{ fontSize: 11, color: Colors.neutral[500], marginTop: 4 }}>
                {formatCount(recipe.bookmarkCount + (isBookmarked ? 1 : 0))}
              </Text>
            </Pressable>
          </View>

          {/* Description */}
          {recipe.description && (
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[600],
                lineHeight: 24,
                marginTop: Spacing.md,
              }}
            >
              {recipe.description}
            </Text>
          )}

          {/* Author */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: Spacing.lg,
              padding: Spacing.md,
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.lg,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: Colors.neutral[300],
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden"
              }}
            >
              {recipe.authorProfileImgUrl ? (
                <Image source={{ uri: recipe.authorProfileImgUrl }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <Text style={{ color: Colors.neutral[600], fontWeight: "bold", fontSize: 16 }}>
                  {(recipe.authorName || "U").substring(0, 1)}
                </Text>
              )}
            </View>
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900] }}>
                {recipe.authorName}
              </Text>
              {/* Channel 정보는 현재 API에 없음, creatorName? */}
            </View>
          </Pressable>

          {/* Tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: Spacing.lg }}>
            {recipe.tags && recipe.tags.map((tag, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: Colors.neutral[100],
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: BorderRadius.full,
                }}
              >
                <Text style={{ fontSize: 13, color: Colors.neutral[600] }}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Ingredients Section */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
                재료
              </Text>
              {/* Servings Adjuster */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Pressable
                  onPress={() => adjustServings(-1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>−</Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.sm }}>
                  <Users size={16} color={Colors.neutral[500]} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[700], marginLeft: 4 }}>
                    {servings}인분
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustServings(1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Ingredients List */}
            <View style={{ marginTop: Spacing.md }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.neutral[100],
                  }}
                >
                  <Text style={{ fontSize: 15, color: Colors.neutral[800] }}>
                    {ingredient.name}
                  </Text>
                  <Text style={{ fontSize: 15, color: Colors.neutral[500], fontWeight: "500" }}>
                    {getAdjustedAmount(ingredient.amount, ingredient.unit)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Steps Section */}
          <View>
            <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
              조리순서
            </Text>
            <View style={{ marginTop: Spacing.md }}>
              {recipe.steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginBottom: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.primary[500],
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing.md,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                      {step.stepOrder || index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: Colors.neutral[700],
                      lineHeight: 24,
                    }}
                  >
                    {step.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors.neutral[0],
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          flexDirection: "row",
          gap: Spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={handleAddToRecipeBook}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <ChefHat size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            레시피북
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddToMealPlan}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <CalendarPlus size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            식단추가
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShoppingList}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.primary[500],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
            장보기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레시피북 선택 모달 */}
      <RecipeBookSelectModal
        visible={showBookSelectModal}
        onClose={() => setShowBookSelectModal(false)}
        onSelect={async (bookId, bookName) => {
          try {
            await api.post(`/api/v1/recipebooks/${bookId}/recipes`, { recipeId: recipe.id });
            Alert.alert("완료", `"${bookName}"에 저장되었습니다.`);
            setIsBookmarked(true);
          } catch (error: any) {
            console.error(error);
            if (error.message && error.message.includes("이미 레시피북에 추가된")) {
              Alert.alert("알림", "이미 해당 레시피북에 저장된 레시피입니다.");
            } else {
              Alert.alert("오류", "레시피 저장에 실패했습니다.");
            }
          }
        }}
        title="저장 위치"
      />
    </View >
  );
}
