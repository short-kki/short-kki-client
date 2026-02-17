import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import DraggableFlatList, { ScaleDecorator, type RenderItemParams } from "react-native-draggable-flatlist";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Plus,
  MoreVertical,
  Folder,
  ChevronRight,
  Edit3,
  Trash2,
  Lock,
  Users,
  GripVertical,
  Book,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows, ComponentSizes } from "@/constants/design-system";
import { usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { FeedbackToast, useFeedbackToast, truncateTitle } from "@/components/ui/FeedbackToast";

// 레시피북 데이터 타입 (hooks에서 가져온 타입과 호환)
interface RecipeBook {
  id: string;
  name: string;
  isDefault?: boolean;
  recipeCount: number;
  thumbnails: string[];
  createdAt?: string;
  groupId?: string;
  groupName?: string;
  groupThumbnail?: string | null;
}

// 레시피북 카드 컴포넌트
function RecipeBookCard({
  book,
  onPress,
  onMenuPress,
  onGroupPress,
  draggable = false,
  onDrag,
  dragging = false,
}: {
  book: RecipeBook;
  onPress: () => void;
  onMenuPress: () => void;
  onGroupPress?: () => void;
  draggable?: boolean;
  onDrag?: () => void;
  dragging?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={dragging}
      activeOpacity={0.8}
      style={{
        backgroundColor: Colors.neutral[0],
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.base,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.neutral[100],
        ...Shadows.sm,
      }}
    >
      {/* 썸네일 그리드 - 높이 증가 */}
      <View
        style={{
          height: 140,
          flexDirection: "row",
          backgroundColor: Colors.neutral[100],
        }}
      >
        {book.thumbnails.length > 0 ? (
          <>
            {/* 메인 썸네일 (왼쪽 큰 이미지) */}
            <View style={{ flex: 1, marginRight: Spacing.xxs }}>
              <Image
                source={{ uri: book.thumbnails[0] }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            {/* 서브 썸네일 (오른쪽 작은 이미지들) */}
            <View style={{ width: 100, gap: Spacing.xxs }}>
              {book.thumbnails.slice(1, 3).map((thumb, index) => (
                <View key={index} style={{ flex: 1 }}>
                  <Image
                    source={{ uri: thumb }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
              ))}
              {book.thumbnails.length <= 1 && (
                <View style={{ flex: 1, backgroundColor: Colors.neutral[200] }} />
              )}
              {book.thumbnails.length <= 2 && book.thumbnails.length > 1 && (
                <View style={{ flex: 1, backgroundColor: Colors.neutral[200] }} />
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: Colors.neutral[100],
            }}
          >
            <Folder size={40} color={Colors.neutral[300]} />
          </View>
        )}

        {/* 레시피 개수 뱃지 */}
        <View
          style={{
            position: "absolute",
            bottom: Spacing.sm,
            left: Spacing.sm,
            backgroundColor: "rgba(0,0,0,0.65)",
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            borderRadius: BorderRadius.sm,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semiBold }}>
            {book.recipeCount}개
          </Text>
        </View>
      </View>

      {/* 정보 영역 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: Spacing.base,
          paddingVertical: Spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Book size={18} color={Colors.primary[400]} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: Typography.fontSize.md,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {book.name}
            </Text>
            {book.isDefault && !book.groupId && (
              <View
                style={{
                  backgroundColor: Colors.neutral[100],
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing.xxs,
                  borderRadius: BorderRadius.xs,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semiBold, color: Colors.neutral[500] }}>
                  기본
                </Text>
              </View>
            )}
          </View>
        </View>

        {draggable && (
          <TouchableOpacity
            onLongPress={onDrag}
            delayLongPress={120}
            style={{
              padding: Spacing.sm,
              marginRight: 2,
              opacity: dragging ? 1 : 0.75,
            }}
            activeOpacity={0.8}
          >
            <GripVertical size={18} color={Colors.neutral[400]} />
          </TouchableOpacity>
        )}

        {/* 메뉴 버튼 */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress();
          }}
          style={{ padding: Spacing.sm }}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color={Colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeBookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId?: string;
    groupName?: string;
    _t?: string;
  }>();

  // hooks에서 데이터 가져오기
  const {
    recipeBooks: personalBooks,
    loading: personalLoading,
    createRecipeBook,
    removeRecipeBook,
    renameRecipeBook,
    reorderRecipeBooks,
    refetch: refetchPersonal,
  } = usePersonalRecipeBooks();
  const { recipeBooks: groupBooks, loading: groupLoading, refetch: refetchGroup } = useGroupRecipeBooks();
  const [isCreating, setIsCreating] = useState(false);

  // 화면에 포커스될 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetchPersonal();
      refetchGroup();
    }, [refetchPersonal, refetchGroup])
  );

  // 그룹에서 진입한 경우 그룹 탭으로 시작
  const [activeTab, setActiveTab] = useState<"personal" | "group">(
    params.groupId ? "group" : "personal"
  );
  const [filterGroupId, setFilterGroupId] = useState<string | null>(params.groupId || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const menuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const menuSheetTranslateY = useRef(new Animated.Value(300)).current;

  const openMenuSheet = useCallback(() => {
    setShowMenuModal(true);
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
      setShowMenuModal(false);
      onDone?.();
    });
  }, [menuOverlayOpacity, menuSheetTranslateY]);

  const [newBookName, setNewBookName] = useState("");
  const [editingBook, setEditingBook] = useState<RecipeBook | null>(null);
  const [editBookName, setEditBookName] = useState("");
  const createInputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const [selectedBook, setSelectedBook] = useState<RecipeBook | null>(null);
  const [deleteTargetBook, setDeleteTargetBook] = useState<RecipeBook | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } = useFeedbackToast();
  const [mutablePersonalBooks, setMutablePersonalBooks] = useState<RecipeBook[]>([]);
  const isReorderingRef = useRef(false);
  const listBottomPadding = insets.bottom + ComponentSizes.tabBar.height + Spacing.lg;

  const fixedPersonalBooks = personalBooks.filter((book) => book.isDefault);

  useEffect(() => {
    setMutablePersonalBooks(personalBooks.filter((book) => !book.isDefault));
  }, [personalBooks]);

  // params가 변경될 때 필터 업데이트 (_t 타임스탬프로 매번 새로운 네비게이션 감지)
  useEffect(() => {
    if (params.groupId) {
      setFilterGroupId(params.groupId);
      setActiveTab("group");
    }
  }, [params.groupId, params._t]);

  const handleRecipeBookPress = useCallback((bookId: string, bookName?: string) => {
    router.push({
      pathname: "/recipe-book-detail",
      params: { bookId, ...(bookName ? { bookName } : {}) },
    });
  }, [router]);

  const handleMenuPress = useCallback((book: RecipeBook) => {
    setSelectedBook(book);
    openMenuSheet();
  }, [openMenuSheet]);

  const handleMenuAction = (action: "edit" | "delete" | "share") => {
    if (!selectedBook) return;

    closeMenuSheet(() => {
      switch (action) {
        case "edit":
          setEditingBook(selectedBook);
          setEditBookName(selectedBook.name);
          setShowEditModal(true);
          break;
        case "delete":
          setDeleteTargetBook(selectedBook);
          setShowDeleteModal(true);
          break;
        case "share":
          Alert.alert("공유", "공유 기능은 준비 중입니다.");
          break;
      }
    });
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteTargetBook || isDeletingBook) return;

    const bookName = deleteTargetBook.name;
    setIsDeletingBook(true);
    try {
      const success = await removeRecipeBook(deleteTargetBook.id);
      if (success) {
        setShowDeleteModal(false);
        setDeleteTargetBook(null);
        showToast(`"${truncateTitle(bookName)}" 레시피북이 삭제되었습니다`);
      } else {
        Alert.alert("오류", "레시피북 삭제에 실패했습니다.");
      }
    } finally {
      setIsDeletingBook(false);
    }
  }, [deleteTargetBook, isDeletingBook, removeRecipeBook]);

  const handleCreateBook = async () => {
    if (!newBookName.trim()) {
      Alert.alert("알림", "레시피북 이름을 입력해주세요.");
      return;
    }

    // 그룹 탭에서는 레시피북 생성 불가 (기본 생성된 레시피북만 존재)
    if (activeTab === "group") {
      Alert.alert(
        "알림",
        "그룹 레시피북은 자동으로 생성됩니다.\n기존 레시피북을 이용해주세요."
      );
      return;
    }

    const bookName = newBookName.trim();
    setIsCreating(true);
    const success = await createRecipeBook(bookName);
    setIsCreating(false);

    if (success) {
      setNewBookName("");
      setShowCreateModal(false);
      showToast(`"${truncateTitle(bookName)}" 레시피북이 생성되었습니다`);
    } else {
      Alert.alert("오류", "레시피북 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleEditBook = async () => {
    if (!editBookName.trim() || !editingBook) {
      Alert.alert("알림", "레시피북 이름을 입력해주세요.");
      return;
    }

    const newName = editBookName.trim();
    const success = await renameRecipeBook(editingBook.id, newName);
    if (success) {
      setEditingBook(null);
      setEditBookName("");
      setShowEditModal(false);
      showToast(`"${truncateTitle(newName)}" (으)로 이름이 변경되었습니다`);
    } else {
      Alert.alert("오류", "레시피북 이름 변경에 실패했습니다.");
    }
  };

  const handlePersonalBooksReorder = useCallback(async (reorderedBooks: RecipeBook[]) => {
    if (isReorderingRef.current) return;

    setMutablePersonalBooks(reorderedBooks);
    isReorderingRef.current = true;

    const success = await reorderRecipeBooks(reorderedBooks.map((book) => book.id));
    isReorderingRef.current = false;

    if (!success) {
      Alert.alert("오류", "레시피북 순서 변경에 실패했습니다.");
      refetchPersonal();
    }
  }, [refetchPersonal, reorderRecipeBooks]);

  const renderReorderableBook = useCallback(
    ({ item, drag, isActive }: RenderItemParams<RecipeBook>) => (
      <ScaleDecorator activeScale={1.01}>
        <RecipeBookCard
          book={item}
          onPress={() => handleRecipeBookPress(item.id, item.name)}
          onMenuPress={() => handleMenuPress(item)}
          draggable
          dragging={isActive}
          onDrag={drag}
        />
      </ScaleDecorator>
    ),
    [handleMenuPress, handleRecipeBookPress]
  );

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
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: "700",
            color: Colors.neutral[900],
          }}
        >
          레시피북
        </Text>
        {/* 레시피북 추가 버튼 - 개인 탭에서만 표시 */}
        {activeTab === "personal" && (
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.primary[500],
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              gap: 4,
            }}
          >
            <Plus size={18} color="#FFF" />
            <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
              추가
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 탭 */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: Spacing.xl,
          marginBottom: Spacing.base,
          gap: Spacing.sm,
        }}
      >
        {[
          { id: "personal", label: "개인" },
          { id: "group", label: "그룹" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as "personal" | "group")}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              backgroundColor:
                activeTab === tab.id ? Colors.neutral[900] : Colors.neutral[100],
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semiBold,
                color: activeTab === tab.id ? "#FFF" : Colors.neutral[600],
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 레시피북 목록 */}
      {activeTab === "personal" ? (
        personalLoading ? (
          <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <DraggableFlatList
            data={mutablePersonalBooks}
            keyExtractor={(item) => item.id}
            renderItem={renderReorderableBook}
            onDragEnd={({ data }) => {
              void handlePersonalBooksReorder(data);
            }}
            activationDistance={8}
            dragItemOverflow
            contentContainerStyle={{
              paddingHorizontal: Spacing.xl,
              paddingBottom: listBottomPadding,
            }}
            ListHeaderComponent={(
              <View>
                {fixedPersonalBooks.map((book) => (
                  <RecipeBookCard
                    key={book.id}
                    book={book}
                    onPress={() => handleRecipeBookPress(book.id, book.name)}
                    onMenuPress={() => handleMenuPress(book)}
                  />
                ))}
              </View>
            )}
            ListFooterComponent={(
              <View>
                {personalBooks.length === 0 && (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: Spacing["4xl"],
                    }}
                  >
                    <Folder size={48} color={Colors.neutral[300]} />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.md,
                        fontWeight: Typography.fontWeight.semiBold,
                        color: Colors.neutral[500],
                        marginTop: Spacing.base,
                      }}
                    >
                      레시피북이 없어요
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[400],
                        marginTop: Spacing.sm,
                        textAlign: "center",
                      }}
                    >
                      + 버튼을 눌러 새 레시피북을 만들어보세요
                    </Text>
                  </View>
                )}
                {mutablePersonalBooks.length > 1 && (
                  <Text
                    style={{
                      marginTop: Spacing.sm,
                      color: Colors.neutral[500],
                      fontSize: Typography.fontSize.xs,
                      textAlign: "center",
                    }}
                  >
                    핸들을 길게 누르고 위아래로 이동해 순서를 변경할 수 있어요
                  </Text>
                )}
              </View>
            )}
          />
        )
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.xl,
            paddingBottom: listBottomPadding,
          }}
        >
          <>
            {/* 특정 그룹 필터링 중일 때 헤더 표시 */}
            {filterGroupId && params.groupName && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: Spacing.md,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  backgroundColor: Colors.primary[50],
                  borderRadius: BorderRadius.lg,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Users size={16} color={Colors.primary[600]} />
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      fontWeight: "600",
                      color: Colors.primary[700],
                      marginLeft: Spacing.xs,
                    }}
                  >
                    {params.groupName}의 레시피북
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setFilterGroupId(null)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.primary[600],
                      fontWeight: "500",
                    }}
                  >
                    전체 보기
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 로딩 상태 */}
            {groupLoading && (
              <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
              </View>
            )}

            {/* 그룹별로 레시피북 표시 */}
            {!groupLoading && (() => {
              // 필터링된 레시피북
              const filteredBooks = filterGroupId
                ? groupBooks.filter((book) => book.groupId === filterGroupId)
                : groupBooks;

              // 그룹별로 레시피북 그룹화
              const groupedBooks = filteredBooks.reduce((acc, book) => {
                const groupId = book.groupId || "";
                if (!acc[groupId]) {
                  acc[groupId] = {
                    groupName: book.groupName || "",
                    groupThumbnail: book.groupThumbnail || null,
                    books: [],
                  };
                }
                acc[groupId].books.push(book);
                return acc;
              }, {} as Record<string, { groupName: string; groupThumbnail: string | null; books: RecipeBook[] }>);

              const groupIds = Object.keys(groupedBooks);

              if (groupIds.length === 0) {
                return (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: Spacing["4xl"],
                    }}
                  >
                    <Folder size={48} color={Colors.neutral[300]} />
                    <Text
                      style={{
                        fontSize: Typography.fontSize.md,
                        fontWeight: Typography.fontWeight.semiBold,
                        color: Colors.neutral[500],
                        marginTop: Spacing.base,
                      }}
                    >
                      그룹 레시피북
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[400],
                        marginTop: Spacing.sm,
                        textAlign: "center",
                      }}
                    >
                      그룹에 참여하면 공유 레시피북이 표시됩니다
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/group")}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: Colors.primary[500],
                        paddingHorizontal: Spacing.xl,
                        paddingVertical: Spacing.md,
                        borderRadius: BorderRadius.full,
                        marginTop: Spacing.xl,
                      }}
                    >
                      <Text style={{ color: "#FFF", fontWeight: Typography.fontWeight.semiBold, fontSize: Typography.fontSize.sm }}>
                        그룹 둘러보기
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return groupIds.map((groupId) => {
                const group = groupedBooks[groupId];
                return (
                  <View key={groupId} style={{ marginBottom: Spacing.xl }}>
                    {/* 그룹 헤더 - 필터링 중이 아닐 때만 표시 */}
                    {!filterGroupId && (
                      <TouchableOpacity
                        onPress={() => router.push({
                          pathname: "/(tabs)/group",
                          params: {
                            groupId,
                            _t: Date.now().toString(),
                          },
                        })}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: Spacing.sm,
                          paddingVertical: Spacing.sm,
                        }}
                      >
                        {group.groupThumbnail ? (
                          <Image
                            source={{ uri: group.groupThumbnail }}
                            style={{
                              width: ComponentSizes.avatar.sm,
                              height: ComponentSizes.avatar.sm,
                              borderRadius: ComponentSizes.avatar.sm / 2,
                              marginRight: Spacing.sm,
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: ComponentSizes.avatar.sm,
                              height: ComponentSizes.avatar.sm,
                              borderRadius: ComponentSizes.avatar.sm / 2,
                              backgroundColor: Colors.primary[100],
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: Spacing.sm,
                            }}
                          >
                            <Users size={16} color={Colors.primary[600]} />
                          </View>
                        )}
                        <Text
                          style={{
                            fontSize: Typography.fontSize.md,
                            fontWeight: Typography.fontWeight.bold,
                            color: Colors.neutral[900],
                            flex: 1,
                          }}
                        >
                          {group.groupName}
                        </Text>
                        <ChevronRight size={20} color={Colors.neutral[400]} />
                      </TouchableOpacity>
                    )}

                    {/* 해당 그룹의 레시피북들 */}
                    {group.books.map((book) => (
                      <RecipeBookCard
                        key={book.id}
                        book={book}
                        onPress={() => handleRecipeBookPress(book.id, book.name)}
                        onMenuPress={() => handleMenuPress(book)}
                        onGroupPress={() => {
                          if (book.groupId) {
                            router.push({
                              pathname: "/(tabs)/group",
                              params: {
                                groupId: book.groupId,
                                _t: Date.now().toString(),
                              },
                            });
                          }
                        }}
                      />
                    ))}
                  </View>
                );
              });
            })()}
          </>
        </ScrollView>
      )}

      {/* 레시피북 생성 모달 */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => { setShowCreateModal(false); setNewBookName(""); }} onShow={() => setTimeout(() => createInputRef.current?.focus(), 100)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => { setShowCreateModal(false); setNewBookName(""); }}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingTop: 24,
              paddingHorizontal: 22,
              paddingBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: 4,
              }}
            >
              새 레시피북
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.neutral[400],
                marginBottom: 18,
              }}
            >
              레시피를 모아둘 새 레시피북을 만들어보세요
            </Text>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginBottom: 8,
              }}
            >
              레시피북 이름
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[50],
                borderWidth: 1.5,
                borderColor: Colors.neutral[200],
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: Colors.neutral[900],
              }}
              ref={createInputRef}
              placeholder="예) 다이어트 레시피, 주말 브런치"
              placeholderTextColor={Colors.neutral[300]}
              value={newBookName}
              onChangeText={setNewBookName}
              maxLength={20}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setNewBookName("");
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: 10,
                  paddingVertical: 11,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[500] }}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateBook}
                disabled={isCreating || !newBookName.trim()}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: isCreating || !newBookName.trim() ? Colors.neutral[200] : Colors.primary[500],
                  borderRadius: 10,
                  paddingVertical: 11,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: isCreating || !newBookName.trim() ? Colors.neutral[400] : "#FFFFFF" }}>
                  {isCreating ? "추가 중..." : "추가"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 레시피북 이름 변경 모달 */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)} onShow={() => setTimeout(() => editInputRef.current?.focus(), 100)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingTop: 24,
              paddingHorizontal: 22,
              paddingBottom: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: 4,
              }}
            >
              이름 변경
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.neutral[400],
                marginBottom: 18,
              }}
            >
              레시피북의 새로운 이름을 입력해주세요
            </Text>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginBottom: 8,
              }}
            >
              레시피북 이름
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[50],
                borderWidth: 1.5,
                borderColor: Colors.neutral[200],
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 15,
                color: Colors.neutral[900],
              }}
              ref={editInputRef}
              placeholder="새로운 이름 입력"
              placeholderTextColor={Colors.neutral[300]}
              value={editBookName}
              onChangeText={setEditBookName}
              maxLength={20}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingBook(null);
                  setEditBookName("");
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: 10,
                  paddingVertical: 11,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[500] }}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditBook}
                disabled={!editBookName.trim()}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: !editBookName.trim() ? Colors.neutral[200] : Colors.primary[500],
                  borderRadius: 10,
                  paddingVertical: 11,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: !editBookName.trim() ? Colors.neutral[400] : "#FFFFFF" }}>
                  저장
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 케밥 메뉴 바텀시트 */}
      <Modal
        visible={showMenuModal}
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
              marginBottom: Spacing.xl,
            }} />

            {/* 이름 변경 */}
            <TouchableOpacity
              onPress={() => handleMenuAction("edit")}
              disabled={selectedBook?.isDefault}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
                opacity: selectedBook?.isDefault ? 0.4 : 1,
              }}
            >
              <Edit3 size={20} color={Colors.neutral[600]} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                이름 변경
              </Text>
              {selectedBook?.isDefault && (
                <Lock size={16} color={Colors.neutral[400]} style={{ marginLeft: "auto" }} />
              )}
            </TouchableOpacity>

            {/* 삭제 */}
            <TouchableOpacity
              onPress={() => handleMenuAction("delete")}
              disabled={selectedBook?.isDefault}
              activeOpacity={0.6}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
                opacity: selectedBook?.isDefault ? 0.4 : 1,
              }}
            >
              <Trash2 size={20} color={Colors.error.main} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                삭제
              </Text>
              {selectedBook?.isDefault && (
                <Lock size={16} color={Colors.neutral[400]} style={{ marginLeft: "auto" }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ConfirmActionModal
        visible={showDeleteModal}
        title={`"${truncateTitle(deleteTargetBook?.name ?? "")}" 을 삭제할까요?`}
        description="삭제된 레시피북의 레시피는 기본 레시피북으로 이동됩니다."
        confirmText="삭제"
        confirmLoadingText="삭제 중..."
        loading={isDeletingBook}
        onClose={() => {
          if (isDeletingBook) return;
          setShowDeleteModal(false);
          setDeleteTargetBook(null);
        }}
        onConfirm={confirmDelete}
      />

      <FeedbackToast
        message={toastMessage}
        variant={toastVariant}
        opacity={toastOpacity}
        translate={toastTranslate}
        aboveTabBar
      />
    </View>
  );
}
