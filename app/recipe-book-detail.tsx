import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ScrollView,
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
  ChevronDown,
  Check,
  BookOpen,
  Users,
  X,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const BOOK_LIST_ITEM_HEIGHT = 73; // paddingVertical(14*2) + icon(44) + border(1)
const BOOK_LIST_VISIBLE_COUNT = 3;
import { useRecipeBookDetail, usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";
import { FeedbackToast, useFeedbackToast, truncateTitle } from "@/components/ui/FeedbackToast";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";


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

type RecipeSortType = "RECENT" | "OLDEST" | "BOOKMARK_DESC";

const SORT_OPTIONS: { value: RecipeSortType; label: string }[] = [
  { value: "RECENT", label: "최근순" },
  { value: "OLDEST", label: "오래된순" },
  { value: "BOOKMARK_DESC", label: "북마크순" },
];

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
      activeOpacity={0.85}
      style={{
        width: CARD_WIDTH,
        backgroundColor: Colors.neutral[0],
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: CARD_GAP,
        ...Shadows.xs,
      }}
    >
      {/* 썸네일 */}
      <View
        style={{
          width: "100%",
          height: CARD_WIDTH,
          position: "relative",
          backgroundColor: Colors.neutral[200],
        }}
      >
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
      <View style={{ paddingHorizontal: 10, paddingVertical: 8, position: "relative" }}>
        {/* 더보기 버튼 */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            padding: 8,
            zIndex: 1,
          }}
          activeOpacity={0.7}
        >
          <MoreVertical size={18} color={Colors.neutral[400]} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: Colors.neutral[900],
            lineHeight: 21,
            paddingRight: 28,
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Bookmark size={12} color={Colors.neutral[400]} />
          <Text
            style={{
              fontSize: 12,
              color: Colors.neutral[400],
              fontWeight: "500",
              marginLeft: 4,
            }}
          >
            {formatCount(recipe.likes)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Colors.neutral[400],
              marginLeft: "auto",
            }}
          >
            {recipe.savedAt}
          </Text>
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
  const [sortType, setSortType] = useState<RecipeSortType>("RECENT");
  const [showSortModal, setShowSortModal] = useState(false);

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
  } = useRecipeBookDetail(bookId, sortType);

  const { recipeBooks: personalBooks = [] } = usePersonalRecipeBooks();
  const { recipeBooks: groupBooks = [] } = useGroupRecipeBooks();

  const [showRecipeMenuModal, setShowRecipeMenuModal] = useState(false);
  const [showBookSelectSheet, setShowBookSelectSheet] = useState(false);
  const [bookSelectTab, setBookSelectTab] = useState<"personal" | "group">("personal");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } =
    useFeedbackToast(1600);

  const sortOverlayOpacity = useRef(new Animated.Value(0)).current;
  const sortSheetTranslateY = useRef(new Animated.Value(300)).current;

  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuSheetTranslateY = useRef(new Animated.Value(300)).current;

  const bookSelectOverlayOpacity = useRef(new Animated.Value(0)).current;
  const bookSelectSheetTranslateY = useRef(new Animated.Value(500)).current;

  const openSortSheet = useCallback(() => {
    setShowSortModal(true);
    Animated.parallel([
      Animated.timing(sortOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(sortSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [sortOverlayOpacity, sortSheetTranslateY]);

  const closeSortSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(sortOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sortSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSortModal(false);
    });
  }, [sortOverlayOpacity, sortSheetTranslateY]);

  const openMenuSheet = useCallback(() => {
    setShowRecipeMenuModal(true);
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(menuSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuOverlayOpacity, menuSheetTranslateY]);

  const closeMenuSheet = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRecipeMenuModal(false);
      onDone?.();
    });
  }, [menuOverlayOpacity, menuSheetTranslateY]);

  const openBookSelectSheet = useCallback(() => {
    setBookSelectTab("personal");
    setShowBookSelectSheet(true);
    Animated.parallel([
      Animated.timing(bookSelectOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(bookSelectSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [bookSelectOverlayOpacity, bookSelectSheetTranslateY]);

  const closeBookSelectSheet = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(bookSelectOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bookSelectSheetTranslateY, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowBookSelectSheet(false);
      onDone?.();
    });
  }, [bookSelectOverlayOpacity, bookSelectSheetTranslateY]);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleRecipeMenuPress = useCallback((recipe: any) => {
    setSelectedRecipe(recipe);
    openMenuSheet();
  }, [openMenuSheet]);

  const handleRecipeMenuAction = (action: "move" | "delete") => {
    if (!selectedRecipe) return;

    closeMenuSheet(() => {
      switch (action) {
        case "move":
          openBookSelectSheet();
          break;
        case "delete":
          setShowDeleteConfirmModal(true);
          break;
      }
    });
  };

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe || isDeletingRecipe) return;

    setIsDeletingRecipe(true);
    try {
      const success = await removeRecipe(selectedRecipe.id);
      if (success) {
        setShowDeleteConfirmModal(false);
        showToast("북마크를 해제했어요.", "success");
      } else {
        showToast("레시피 삭제에 실패했어요.", "danger");
      }
    } finally {
      setIsDeletingRecipe(false);
    }
  };

  const handleMoveToBook = async (targetBookId: string, targetBookName: string) => {
    if (!selectedRecipe) return;
    closeBookSelectSheet(async () => {
      const success = await moveRecipe(selectedRecipe.id, targetBookId);
      if (success) {
        showToast(`"${truncateTitle(targetBookName)}"(으)로 이동했어요.`, "success");
      } else {
        showToast("레시피 이동에 실패했어요.", "danger");
      }
    });
  };

  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sortType)?.label ?? "최근순";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
      }}
    >
      {/* 헤더 */}
      <View
        style={{
          backgroundColor: Colors.neutral[0],
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, marginRight: 8 }}
            >
              <ArrowLeft size={24} color={Colors.neutral[900]} />
            </Pressable>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.neutral[900],
              }}
              numberOfLines={1}
            >
              {bookName || "레시피북"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={openSortSheet}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.full,
              paddingVertical: 6,
              paddingHorizontal: 10,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Colors.neutral[700],
              }}
            >
              정렬: {currentSortLabel}
            </Text>
            <ChevronDown size={14} color={Colors.neutral[500]} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
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
          }}
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_PADDING,
            paddingTop: 14,
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

      {/* 정렬 바텀시트 */}
      <Modal
        visible={showSortModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeSortSheet}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              opacity: sortOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeSortSheet} />
          </Animated.View>

          {/* 시트 */}
          <Animated.View
            style={{
              transform: [{ translateY: sortSheetTranslateY }],
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: Colors.neutral[900],
                paddingBottom: Spacing.md,
                marginBottom: Spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              정렬 기준
            </Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSortType(option.value);
                    closeSortSheet();
                  }}
                  activeOpacity={0.6}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: isSelected ? Colors.primary[500] : Colors.neutral[700],
                      fontWeight: isSelected ? "700" : "400",
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </View>
      </Modal>

      {/* 레시피 메뉴 바텀시트 */}
      <Modal
        visible={showRecipeMenuModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeMenuSheet()}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              opacity: menuOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => closeMenuSheet()} />
          </Animated.View>

          {/* 시트 */}
          <Animated.View
            style={{
              transform: [{ translateY: menuSheetTranslateY }],
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

            {/* 레시피 정보 */}
            {selectedRecipe && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingBottom: Spacing.md,
                  marginBottom: Spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.neutral[100],
                }}
              >
                <Image
                  source={{ uri: selectedRecipe.thumbnail }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: BorderRadius.md,
                  }}
                  contentFit="cover"
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "600",
                    color: Colors.neutral[900],
                    marginLeft: Spacing.md,
                  }}
                  numberOfLines={1}
                >
                  {selectedRecipe.title}
                </Text>
              </View>
            )}

            {/* 다른 레시피북으로 이동 */}
            <TouchableOpacity
              onPress={() => handleRecipeMenuAction("move")}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
              }}
            >
              <FolderInput size={20} color={Colors.neutral[600]} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                다른 레시피북으로 이동
              </Text>
            </TouchableOpacity>

            {/* 북마크 해제 */}
            <TouchableOpacity
              onPress={() => handleRecipeMenuAction("delete")}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
              }}
            >
              <Trash2 size={20} color={Colors.error.main} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                북마크 해제
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>


      {/* 레시피북 이동 바텀시트 */}
      <Modal
        visible={showBookSelectSheet}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeBookSelectSheet()}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: bookSelectOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => closeBookSelectSheet()} />
          </Animated.View>

          {/* 시트 */}
          <Animated.View
            style={{
              transform: [{ translateY: bookSelectSheetTranslateY }],
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + Spacing.xl + 100,
              marginBottom: -100,
            }}
          >
            {/* 핸들 바 */}
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: Colors.neutral[300],
                  borderRadius: 2,
                }}
              />
            </View>

            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900] }}>
                다른 레시피북으로 이동
              </Text>
              <TouchableOpacity onPress={() => closeBookSelectSheet()}>
                <X size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* 탭 */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 20,
                paddingVertical: 12,
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setBookSelectTab("personal")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: bookSelectTab === "personal" ? Colors.neutral[900] : Colors.neutral[100],
                  gap: 6,
                }}
              >
                <BookOpen size={16} color={bookSelectTab === "personal" ? "#FFF" : Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: bookSelectTab === "personal" ? "#FFF" : Colors.neutral[600],
                  }}
                >
                  개인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBookSelectTab("group")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: bookSelectTab === "group" ? Colors.neutral[900] : Colors.neutral[100],
                  gap: 6,
                }}
              >
                <Users size={16} color={bookSelectTab === "group" ? "#FFF" : Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: bookSelectTab === "group" ? "#FFF" : Colors.neutral[600],
                  }}
                >
                  그룹
                </Text>
              </TouchableOpacity>
            </View>

            {/* 레시피북 목록 */}
            <ScrollView style={{ height: BOOK_LIST_ITEM_HEIGHT * BOOK_LIST_VISIBLE_COUNT }} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {(() => {
                const books = bookSelectTab === "personal"
                  ? personalBooks
                      .filter((book) => String(book.id) !== bookId)
                      .map((book) => ({
                        id: String(book.id),
                        name: book.name,
                        recipeCount: book.recipeCount,
                        isDefault: book.isDefault,
                        groupName: undefined as string | undefined,
                      }))
                  : groupBooks
                      .filter((book) => String(book.id) !== bookId)
                      .map((book) => ({
                        id: String(book.id),
                        name: book.name,
                        recipeCount: book.recipeCount,
                        isDefault: false,
                        groupName: book.groupName,
                      }));

                if (books.length === 0) {
                  return (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
                      <Users size={32} color={Colors.neutral[300]} />
                      <Text style={{ fontSize: 14, color: Colors.neutral[400], marginTop: 12 }}>
                        {bookSelectTab === "group"
                          ? "참여한 그룹이 없습니다"
                          : "이동할 수 있는 레시피북이 없습니다"}
                      </Text>
                    </View>
                  );
                }

                return books.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    onPress={() => handleMoveToBook(book.id, book.name)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.neutral[100],
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: Colors.neutral[100],
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <BookOpen size={22} color={Colors.neutral[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: Colors.neutral[900],
                        }}
                      >
                        {book.name}
                        {book.isDefault && (
                          <Text style={{ color: Colors.neutral[400], fontWeight: "400" }}> (기본)</Text>
                        )}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                        {book.groupName ? `${book.groupName} · ` : ""}
                        레시피 {book.recipeCount}개
                      </Text>
                    </View>
                  </TouchableOpacity>
                ));
              })()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
      <ConfirmActionModal
        visible={showDeleteConfirmModal}
        title="레시피 북마크를 해제할까요?"
        confirmText="해제"
        confirmLoadingText="해제 중..."
        loading={isDeletingRecipe}
        onClose={() => {
          if (isDeletingRecipe) return;
          setShowDeleteConfirmModal(false);
        }}
        onConfirm={handleDeleteRecipe}
      />
      <FeedbackToast
        message={toastMessage}
        variant={toastVariant}
        opacity={toastOpacity}
        translate={toastTranslate}
        bottomOffset={72}
      />
    </View>
  );
}
