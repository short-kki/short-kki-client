import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Bookmark,
  Clock,
  MoreVertical,
  ChefHat,
  Trash2,
  FolderInput,
  Share2,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useRecipeBookDetail, usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";
import RecipeBookSelectModal from "@/components/RecipeBookSelectModal";

import { API_BASE_URL } from "@/constants/oauth";

// 숫자 축약 포맷 (1000 → 1k, 1200 → 1.2k, 1000000 → 1M)
const formatCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  const m = count / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
};

// 이미지 URL 처리 헬퍼 함수
const getImageUrl = (url?: string) => {
  if (!url) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";
  if (url.startsWith("http")) return url;
  if (url.startsWith("data:")) return url;
  // 상대 경로인 경우 API URL 추가
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
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
          {recipe.duration ? (
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
          ) : null}
        </View>
        {/* 정보 */}
        <View style={{ padding: Spacing.sm, position: "relative" }}>
          {/* 더보기 버튼 */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress();
            }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: 4,
              zIndex: 1,
            }}
            activeOpacity={0.7}
          >
            <MoreVertical size={16} color={Colors.neutral[400]} />
          </TouchableOpacity>
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Bookmark size={10} color={Colors.primary[500]} fill={Colors.primary[500]} />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[500],
                marginLeft: 3,
              }}
            >
              {formatCount(recipe.likes)}
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

  // API에서 레시피북 상세 조회
  const {
    bookName,
    recipes,
    loading,
    error,
    totalCount,
    removeRecipe,
    moveRecipe,
    loadMore,
    hasMore,
    loadingMore,
  } = useRecipeBookDetail(bookId);

  const [showRecipeMenuModal, setShowRecipeMenuModal] = useState(false);
  const [showBookSelectModal, setShowBookSelectModal] = useState(false);
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
          setShowBookSelectModal(true);
          break;
        case "delete":
          Alert.alert(
            "레시피 삭제",
            `"${selectedRecipe.title}"을(를) 레시피북에서 삭제하시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "삭제", style: "destructive", onPress: async () => {
                  const success = await removeRecipe(selectedRecipe.id);
                  if (success) {
                    Alert.alert("완료", "레시피가 삭제되었습니다.");
                  } else {
                    Alert.alert("오류", "레시피 삭제에 실패했습니다.");
                  }
                }
              },
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
            {bookName || "레시피북"}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.neutral[500],
              marginTop: 2,
            }}
          >
            {totalCount || recipes.length}개의 레시피
          </Text>
        </View>
      </View>

      {/* 레시피 그리드 */}
      {loading ? (
        <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : error ? (
        <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
          <Text style={{ color: Colors.error.main }}>데이터를 불러오는데 실패했습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => handleRecipePress(item.id)}
              onMenuPress={() => handleRecipeMenuPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: Spacing.md,
          }}
          contentContainerStyle={{
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.md,
          }}
          onEndReached={() => {
            if (hasMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: Spacing.lg, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              </View>
            ) : null
          }
          ListEmptyComponent={
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
          }
        />
      )}

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

          </Pressable>
        </Pressable>
      </Modal>


      {/* 레시피북 선택 모달 */}
      <RecipeBookSelectModal
        visible={showBookSelectModal}
        onClose={() => setShowBookSelectModal(false)}
        onSelect={async (bookId, bookName) => {
          if (selectedRecipe) {
            const success = await moveRecipe(selectedRecipe.id, bookId);
            if (success) {
              Alert.alert("완료", `"${bookName}"(으)로 이동되었습니다.`);
            } else {
              Alert.alert("오류", "레시피 이동에 실패했습니다.");
            }
          }
        }}
        currentBookId={bookId}
        title="이동할 레시피북"
      />
    </View>
  );
}
