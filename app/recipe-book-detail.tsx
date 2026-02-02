import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Heart,
  Clock,
  MoreVertical,
  ChefHat,
  Trash2,
  FolderInput,
  Share2,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 레시피북 데이터 (실제로는 bookId로 API에서 가져옴)
const RECIPE_BOOKS_DATA: Record<string, { name: string; recipes: any[] }> = {
  default: {
    name: "기본 레시피북",
    recipes: [
      {
        id: "r1",
        title: "백종원 계란볶음밥",
        author: "백종원",
        thumbnail: "https://i.ytimg.com/vi/DkyZ9t12hpo/hq720.jpg",
        duration: "5분",
        likes: 15234,
        savedAt: "2일 전",
      },
      {
        id: "r2",
        title: "크림파스타 황금레시피",
        author: "자취생요리",
        thumbnail: "https://i.ytimg.com/vi/oc1bnLR38fE/hq720.jpg",
        duration: "15분",
        likes: 8921,
        savedAt: "3일 전",
      },
      {
        id: "r3",
        title: "마약 옥수수",
        author: "요리왕비룡",
        thumbnail: "https://i.ytimg.com/vi/gQDByCdjUXw/hq720.jpg",
        duration: "10분",
        likes: 5629,
        savedAt: "1주 전",
      },
      {
        id: "r4",
        title: "뚝딱이형 속도 요리",
        author: "1분요리 뚝딱이형",
        thumbnail: "https://i.ytimg.com/vi/ZPFVC78A2jM/hq720.jpg",
        duration: "3분",
        likes: 22847,
        savedAt: "1주 전",
      },
    ],
  },
  "1": {
    name: "다이어트 레시피",
    recipes: [
      {
        id: "d1",
        title: "닭가슴살 샐러드",
        author: "헬시쿡",
        thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        duration: "10분",
        likes: 3421,
        savedAt: "1주 전",
      },
      {
        id: "d2",
        title: "연어 포케볼",
        author: "다이어터",
        thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
        duration: "15분",
        likes: 2891,
        savedAt: "2주 전",
      },
    ],
  },
  "2": {
    name: "자취 필수 요리",
    recipes: [
      {
        id: "s1",
        title: "편스토랑 류수영 꿀팁",
        author: "KBS 편스토랑",
        thumbnail: "https://i.ytimg.com/vi/NnhIbr5lmEg/hq720.jpg",
        duration: "8분",
        likes: 12453,
        savedAt: "2주 전",
      },
      {
        id: "s2",
        title: "김치볶음밥",
        author: "집밥백선생",
        thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
        duration: "10분",
        likes: 8234,
        savedAt: "3주 전",
      },
    ],
  },
  "3": {
    name: "손님 접대용",
    recipes: [
      {
        id: "g1",
        title: "연어 스테이크",
        author: "셰프의 부엌",
        thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
        duration: "20분",
        likes: 5621,
        savedAt: "1개월 전",
      },
    ],
  },
  // 그룹 레시피북은 API에서 조회 (현재 미구현)
};

// 레시피 카드 컴포넌트
function RecipeCard({
  recipe,
  onPress,
  onMenuPress,
}: {
  recipe: any;
  onPress: () => void;
  onMenuPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: "48%",
        marginBottom: Spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.neutral[0],
          borderRadius: BorderRadius.xl,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* 썸네일 */}
        <View style={{ aspectRatio: 3 / 4, position: "relative" }}>
          <Image
            source={{ uri: recipe.thumbnail }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          {/* 시간 배지 */}
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BorderRadius.sm,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={10} color="#FFF" />
            <Text
              style={{
                color: "#FFF",
                fontSize: 10,
                fontWeight: "600",
                marginLeft: 3,
              }}
            >
              {recipe.duration}
            </Text>
          </View>
          {/* 더보기 버튼 */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress();
            }}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 12,
              padding: 4,
            }}
            activeOpacity={0.7}
          >
            <MoreVertical size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* 정보 */}
        <View style={{ padding: Spacing.sm }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.neutral[900],
            }}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.neutral[500],
              marginTop: 2,
            }}
          >
            {recipe.author}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Heart size={10} color={Colors.primary[500]} fill={Colors.primary[500]} />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[500],
                marginLeft: 3,
              }}
            >
              {recipe.likes.toLocaleString()}
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[400],
                marginLeft: "auto",
              }}
            >
              {recipe.savedAt}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeBookDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookId: string; groupId?: string; groupName?: string }>();

  const bookId = params.bookId || "default";
  const isGroupRecipeBook = bookId.startsWith("g");

  // 그룹 레시피북은 API에서 조회 (현재 더미 데이터 없음)
  const bookData = RECIPE_BOOKS_DATA[bookId] || {
    name: isGroupRecipeBook ? (params.groupName ? `${params.groupName} 레시피북` : "그룹 레시피북") : "레시피북",
    recipes: [],
  };

  const [showRecipeMenuModal, setShowRecipeMenuModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleRecipeMenuPress = (recipe: any) => {
    setSelectedRecipe(recipe);
    setShowRecipeMenuModal(true);
  };

  const handleRecipeMenuAction = (action: "move" | "delete" | "share") => {
    if (!selectedRecipe) return;

    setShowRecipeMenuModal(false);

    setTimeout(() => {
      switch (action) {
        case "move":
          Alert.alert("레시피북 이동", "이동할 레시피북을 선택하세요.", [
            { text: "취소", style: "cancel" },
            { text: "기본 레시피북", onPress: () => Alert.alert("완료", "레시피가 이동되었습니다.") },
          ]);
          break;
        case "delete":
          Alert.alert(
            "레시피 삭제",
            `"${selectedRecipe.title}"을(를) 레시피북에서 삭제하시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              { text: "삭제", style: "destructive", onPress: () => {} },
            ]
          );
          break;
        case "share":
          Alert.alert("공유", "공유 기능은 준비 중입니다.");
          break;
      }
    }, 200);
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
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          backgroundColor: Colors.neutral[0],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            {bookData.name}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.neutral[500],
              marginTop: 2,
            }}
          >
            {bookData.recipes.length}개의 레시피
          </Text>
        </View>
      </View>

      {/* 레시피 그리드 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: 40,
        }}
      >
        {bookData.recipes.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {bookData.recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => handleRecipePress(recipe.id)}
                onMenuPress={() => handleRecipeMenuPress(recipe)}
              />
            ))}
          </View>
        ) : (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing["4xl"],
            }}
          >
            <ChefHat size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginTop: Spacing.md,
              }}
            >
              저장된 레시피가 없어요
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                marginTop: Spacing.xs,
                textAlign: "center",
              }}
            >
              마음에 드는 레시피를 저장해보세요
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)")}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary[500],
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: BorderRadius.full,
                marginTop: Spacing.lg,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                레시피 둘러보기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 레시피 메뉴 바텀시트 */}
      <Modal visible={showRecipeMenuModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowRecipeMenuModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingTop: Spacing.md,
              paddingBottom: insets.bottom + Spacing.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: Spacing.lg,
              }}
            />

            {/* 레시피 정보 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: Spacing.xl,
                paddingBottom: Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              {selectedRecipe && (
                <>
                  <Image
                    source={{ uri: selectedRecipe.thumbnail }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: BorderRadius.md,
                    }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        fontWeight: "600",
                        color: Colors.neutral[900],
                      }}
                      numberOfLines={2}
                    >
                      {selectedRecipe.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[500],
                        marginTop: 2,
                      }}
                    >
                      {selectedRecipe.author}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* 메뉴 옵션들 */}
            <View style={{ paddingTop: Spacing.sm }}>
              {/* 다른 레시피북으로 이동 */}
              <TouchableOpacity
                onPress={() => handleRecipeMenuAction("move")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <FolderInput size={20} color={Colors.neutral[700]} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.neutral[900],
                    marginLeft: Spacing.md,
                  }}
                >
                  다른 레시피북으로 이동
                </Text>
              </TouchableOpacity>

              {/* 공유 */}
              <TouchableOpacity
                onPress={() => handleRecipeMenuAction("share")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.info.light,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Share2 size={20} color={Colors.info.main} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.neutral[900],
                    marginLeft: Spacing.md,
                  }}
                >
                  공유하기
                </Text>
              </TouchableOpacity>

              {/* 삭제 */}
              <TouchableOpacity
                onPress={() => handleRecipeMenuAction("delete")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.error.light,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={20} color={Colors.error.main} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.error.main,
                    marginLeft: Spacing.md,
                  }}
                >
                  레시피북에서 삭제
                </Text>
              </TouchableOpacity>
            </View>

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowRecipeMenuModal(false)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
