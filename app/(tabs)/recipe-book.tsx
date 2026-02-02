import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Plus,
  MoreVertical,
  BookOpen,
  Folder,
  ChevronRight,
  Edit3,
  Trash2,
  Lock,
  Users,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";

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
}

// 레시피북 카드 컴포넌트
function RecipeBookCard({
  book,
  onPress,
  onMenuPress,
  onGroupPress,
}: {
  book: RecipeBook;
  onPress: () => void;
  onMenuPress: () => void;
  onGroupPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: Colors.neutral[0],
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.neutral[100],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
            <View style={{ flex: 1, marginRight: 2 }}>
              <Image
                source={{ uri: book.thumbnails[0] }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
            {/* 서브 썸네일 (오른쪽 작은 이미지들) */}
            <View style={{ width: 90, gap: 2 }}>
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
            bottom: 8,
            left: 8,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
            {book.recipeCount}개
          </Text>
        </View>
      </View>

      {/* 정보 영역 - 패딩 증가 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: Spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.lg,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
            numberOfLines={1}
          >
            {book.name}
          </Text>
          {book.groupName && (
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.primary[600],
                marginTop: 4,
              }}
            >
              {book.groupName}
            </Text>
          )}
        </View>

        {/* 그룹 레시피북인 경우 그룹 이동 버튼 */}
        {book.groupId && onGroupPress && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onGroupPress();
            }}
            style={{
              padding: 8,
              backgroundColor: Colors.neutral[100],
              borderRadius: 20,
              marginRight: 4,
            }}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={Colors.neutral[600]} />
          </TouchableOpacity>
        )}

        {/* 메뉴 버튼 */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress();
          }}
          style={{ padding: 8 }}
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
  const params = useLocalSearchParams<{ groupId?: string; groupName?: string; _t?: string }>();

  // hooks에서 데이터 가져오기
  const { recipeBooks: personalBooks, loading: personalLoading, addRecipeBook, removeRecipeBook, renameRecipeBook } = usePersonalRecipeBooks();
  const { recipeBooks: groupBooks, loading: groupLoading } = useGroupRecipeBooks();

  // 그룹에서 진입한 경우 그룹 탭으로 시작
  const [activeTab, setActiveTab] = useState<"personal" | "group">(
    params.groupId ? "group" : "personal"
  );
  const [filterGroupId, setFilterGroupId] = useState<string | null>(params.groupId || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [editingBook, setEditingBook] = useState<RecipeBook | null>(null);
  const [editBookName, setEditBookName] = useState("");
  const [selectedBook, setSelectedBook] = useState<RecipeBook | null>(null);

  // params가 변경될 때 필터 업데이트 (_t 타임스탬프로 매번 새로운 네비게이션 감지)
  useEffect(() => {
    if (params.groupId) {
      setFilterGroupId(params.groupId);
      setActiveTab("group");
    }
  }, [params.groupId, params._t]);

  const handleRecipeBookPress = (bookId: string) => {
    router.push({
      pathname: "/recipe-book-detail",
      params: { bookId },
    });
  };

  const handleMenuPress = (book: RecipeBook) => {
    setSelectedBook(book);
    setShowMenuModal(true);
  };

  const handleMenuAction = (action: "edit" | "delete" | "share") => {
    if (!selectedBook) return;

    setShowMenuModal(false);

    setTimeout(() => {
      switch (action) {
        case "edit":
          setEditingBook(selectedBook);
          setEditBookName(selectedBook.name);
          setShowEditModal(true);
          break;
        case "delete":
          confirmDelete(selectedBook);
          break;
        case "share":
          Alert.alert("공유", "공유 기능은 준비 중입니다.");
          break;
      }
    }, 200);
  };

  const confirmDelete = (book: RecipeBook) => {
    Alert.alert(
      "레시피북 삭제",
      `"${book.name}"을(를) 삭제하시겠습니까?\n저장된 레시피는 기본 레시피북으로 이동됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            removeRecipeBook(book.id);
          },
        },
      ]
    );
  };

  const handleCreateBook = () => {
    if (!newBookName.trim()) {
      Alert.alert("알림", "레시피북 이름을 입력해주세요.");
      return;
    }

    // 그룹 탭에서 그룹이 선택된 경우, 그룹당 1개 제한 체크
    if (activeTab === "group" && filterGroupId) {
      const existingGroupBooks = groupBooks.filter(
        (book) => book.groupId === filterGroupId
      );
      if (existingGroupBooks.length >= 1) {
        Alert.alert(
          "알림",
          "그룹당 하나의 레시피북만 만들 수 있습니다.\n기존 레시피북을 이용해주세요."
        );
        return;
      }
    }

    const newBook = {
      id: Date.now().toString(),
      name: newBookName.trim(),
      isDefault: false,
      recipeCount: 0,
      thumbnails: [],
      createdAt: "방금",
    };

    addRecipeBook(newBook);
    setNewBookName("");
    setShowCreateModal(false);
  };

  const handleEditBook = () => {
    if (!editBookName.trim() || !editingBook) {
      Alert.alert("알림", "레시피북 이름을 입력해주세요.");
      return;
    }

    renameRecipeBook(editingBook.id, editBookName.trim());
    setEditingBook(null);
    setEditBookName("");
    setShowEditModal(false);
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
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BookOpen size={24} color={Colors.primary[500]} />
          <Text
            style={{
              fontSize: Typography.fontSize["2xl"],
              fontWeight: "700",
              color: Colors.neutral[900],
              marginLeft: Spacing.sm,
            }}
          >
            레시피북
          </Text>
        </View>
        {/* 레시피북 추가 버튼 - 눈에 띄게 개선 */}
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
      </View>

      {/* 탭 */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: Spacing.xl,
          marginBottom: Spacing.md,
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
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: BorderRadius.full,
              backgroundColor:
                activeTab === tab.id ? Colors.neutral[900] : Colors.neutral[100],
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: activeTab === tab.id ? "#FFF" : Colors.neutral[600],
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 레시피북 목록 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: 120,
        }}
      >
        {activeTab === "personal" ? (
          <>
            {/* 로딩 상태 */}
            {personalLoading && (
              <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
              </View>
            )}

            {!personalLoading && personalBooks.map((book) => (
              <RecipeBookCard
                key={book.id}
                book={book}
                onPress={() => handleRecipeBookPress(book.id)}
                onMenuPress={() => handleMenuPress(book)}
              />
            ))}

            {!personalLoading && personalBooks.length === 0 && (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: Spacing["4xl"],
                }}
              >
                <Folder size={48} color={Colors.neutral[300]} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: "600",
                    color: Colors.neutral[500],
                    marginTop: Spacing.md,
                  }}
                >
                  레시피북이 없어요
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.neutral[400],
                    marginTop: Spacing.xs,
                    textAlign: "center",
                  }}
                >
                  + 버튼을 눌러 새 레시피북을 만들어보세요
                </Text>
              </View>
            )}
          </>
        ) : (
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
                    books: [],
                  };
                }
                acc[groupId].books.push(book);
                return acc;
              }, {} as Record<string, { groupName: string; books: RecipeBook[] }>);

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
                        fontSize: Typography.fontSize.lg,
                        fontWeight: "600",
                        color: Colors.neutral[500],
                        marginTop: Spacing.md,
                      }}
                    >
                      그룹 레시피북
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[400],
                        marginTop: Spacing.xs,
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
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: BorderRadius.full,
                        marginTop: Spacing.lg,
                      }}
                    >
                      <Text style={{ color: "#FFF", fontWeight: "600" }}>
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
                        onPress={() => router.push("/(tabs)/group")}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: Spacing.md,
                          paddingVertical: Spacing.sm,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: Colors.primary[100],
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: Spacing.sm,
                          }}
                        >
                          <Users size={16} color={Colors.primary[600]} />
                        </View>
                        <Text
                          style={{
                            fontSize: Typography.fontSize.base,
                            fontWeight: "700",
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
                        onPress={() => handleRecipeBookPress(book.id)}
                        onMenuPress={() => handleMenuPress(book)}
                        onGroupPress={() => {
                          if (book.groupId) {
                            router.push({
                              pathname: "/(tabs)/group",
                              params: { groupId: book.groupId },
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
        )}
      </ScrollView>

      {/* 레시피북 생성 모달 */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowCreateModal(false)}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: Spacing.lg,
              }}
            >
              새 레시피북
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[600],
                marginBottom: Spacing.sm,
              }}
            >
              제목
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[50],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                fontSize: 16,
                color: Colors.neutral[900],
              }}
              placeholder="레시피북 이름"
              placeholderTextColor={Colors.neutral[400]}
              value={newBookName}
              onChangeText={setNewBookName}
              autoFocus
            />

            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginTop: Spacing.xl,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setNewBookName("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: Colors.neutral[600],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateBook}
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  저장
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 레시피북 이름 변경 모달 */}
      <Modal visible={showEditModal} transparent animationType="fade">
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
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: Spacing.lg,
              }}
            >
              이름 변경
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[600],
                marginBottom: Spacing.sm,
              }}
            >
              제목
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[50],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                fontSize: 16,
                color: Colors.neutral[900],
              }}
              placeholder="레시피북 이름"
              placeholderTextColor={Colors.neutral[400]}
              value={editBookName}
              onChangeText={setEditBookName}
              autoFocus
            />

            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginTop: Spacing.xl,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingBook(null);
                  setEditBookName("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: Colors.neutral[600],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditBook}
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  저장
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 케밥 메뉴 바텀시트 */}
      <Modal visible={showMenuModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowMenuModal(false)}
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

            {/* 제목 */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingBottom: Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.lg,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                }}
                numberOfLines={1}
              >
                {selectedBook?.name}
              </Text>
              {selectedBook?.isDefault && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Lock size={12} color={Colors.neutral[400]} />
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[400],
                      marginLeft: 4,
                    }}
                  >
                    기본 레시피북
                  </Text>
                </View>
              )}
            </View>

            {/* 메뉴 옵션들 */}
            <View style={{ paddingTop: Spacing.sm }}>
              {/* 이름 변경 */}
              <TouchableOpacity
                onPress={() => handleMenuAction("edit")}
                disabled={selectedBook?.isDefault}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  opacity: selectedBook?.isDefault ? 0.4 : 1,
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
                  <Edit3 size={20} color={Colors.neutral[700]} />
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
                  이름 변경
                </Text>
                {selectedBook?.isDefault && (
                  <Lock size={16} color={Colors.neutral[400]} />
                )}
              </TouchableOpacity>

              {/* 삭제 */}
              <TouchableOpacity
                onPress={() => handleMenuAction("delete")}
                disabled={selectedBook?.isDefault}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  opacity: selectedBook?.isDefault ? 0.4 : 1,
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
                  삭제
                </Text>
                {selectedBook?.isDefault && (
                  <Lock size={16} color={Colors.neutral[400]} />
                )}
              </TouchableOpacity>
            </View>

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowMenuModal(false)}
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
