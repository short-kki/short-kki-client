import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Plus,
  Bell,
  MoreHorizontal,
  Users,
  ChevronRight,
  X,
  UserPlus,
  Calendar,
  ShoppingCart,
  BookOpen,
  Edit3,
  Trash2,
  LogOut,
  PenSquare,
  Heart,
  BookmarkPlus,
  Copy,
  Share2,
  MessageCircle,
  PartyPopper,
  Check,
  AlertTriangle,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useGroups, useGroupFeeds } from "@/hooks";
import type { Group } from "@/data/mock";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEED_IMAGE_SIZE = SCREEN_WIDTH - 32 - 2; // padding + border

// 그룹 타입 정의
const GROUP_TYPES = [
  { value: 'COUPLE', label: '커플' },
  { value: 'FAMILY', label: '가족' },
  { value: 'FRIENDS', label: '친구' },
  { value: 'ETC', label: '기타' },
] as const;

type GroupTypeValue = typeof GROUP_TYPES[number]['value'];

export default function GroupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string; _t?: string }>();

  // Hooks로 데이터 관리
  const { groups, createGroup, deleteGroup, refetch: refetchGroups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { feeds, toggleLike, deleteFeed, refetch: refetchFeeds } = useGroupFeeds(selectedGroup?.id);

  // params로 groupId가 전달되면 해당 그룹을 자동 선택
  useEffect(() => {
    if (params.groupId && groups.length > 0) {
      const target = groups.find(g => String(g.id) === String(params.groupId));
      if (target) {
        setSelectedGroup(target);
      }
    }
  }, [params.groupId, params._t, groups]);

  // 화면에 포커스될 때 그룹 목록 및 피드 새로고침
  useFocusEffect(
    useCallback(() => {
      // 그룹 목록 새로고침 (수정 후 돌아왔을 때 반영)
      refetchGroups();
      // 그룹 상세 화면일 경우 피드도 새로고침
      if (selectedGroup) {
        refetchFeeds();
      }
    }, [selectedGroup, refetchGroups, refetchFeeds])
  );

  // UI 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<GroupTypeValue>('FAMILY');
  const [showGroupMenuModal, setShowGroupMenuModal] = useState(false);
  const [menuTargetGroup, setMenuTargetGroup] = useState<Group | null>(null);
  const [showFeedMenuModal, setShowFeedMenuModal] = useState(false);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdGroupName, setCreatedGroupName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetGroup, setDeleteTargetGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("알림", "그룹 이름을 입력해주세요.");
      return;
    }

    if (isCreating) return;

    try {
      setIsCreating(true);

      // 서버 API 호출
      await createGroup({
        name: newGroupName,
        groupType: newGroupType,
      });

      setCreatedGroupName(newGroupName);
      setNewGroupName("");
      setNewGroupType('FAMILY');
      setShowCreateModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("그룹 생성 실패:", error);
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "그룹 생성에 실패했습니다."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = (group: Group) => {
    setDeleteTargetGroup(group);
    setShowDeleteModal(true);
  };

  const confirmDeleteGroup = async () => {
    if (!deleteTargetGroup || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteGroup(deleteTargetGroup.id);
      setShowDeleteModal(false);
      setDeleteTargetGroup(null);
      // 삭제 성공 알림은 간단하게 Alert 사용
      Alert.alert("완료", "그룹이 삭제되었습니다.");
    } catch (error) {
      console.error("그룹 삭제 실패:", error);
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "그룹 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowGroupMenu = (group: Group) => {
    setMenuTargetGroup(group);
    setShowGroupMenuModal(true);
  };

  const handleGroupMenuAction = (action: "edit" | "delete" | "leave") => {
    if (!menuTargetGroup) return;

    setShowGroupMenuModal(false);

    setTimeout(() => {
      switch (action) {
        case "edit":
          router.push({
            pathname: "/group-edit",
            params: { groupId: menuTargetGroup.id },
          });
          break;
        case "delete":
          handleDeleteGroup(menuTargetGroup);
          break;
        case "leave":
          Alert.alert("그룹 나가기", `"${menuTargetGroup.name}" 그룹에서 나가시겠습니까?`, [
            { text: "취소", style: "cancel" },
            { text: "나가기", style: "destructive", onPress: async () => {
              try {
                // TODO: 실제로는 그룹 나가기 API를 호출해야 함
                await deleteGroup(menuTargetGroup.id);
                Alert.alert("완료", "그룹에서 나갔습니다.");
              } catch (error) {
                console.error("그룹 나가기 실패:", error);
                Alert.alert(
                  "오류",
                  error instanceof Error ? error.message : "그룹 나가기에 실패했습니다."
                );
              }
            }},
          ]);
          break;
      }
    }, 200);
  };

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "식단표":
        router.push("/(tabs)/meal-plan");
        break;
      case "장볼거리":
        router.push({
          pathname: "/shopping-list",
          params: { groupId: selectedGroup?.id, groupName: selectedGroup?.name },
        });
        break;
      case "레시피북":
        router.push({
          pathname: "/group-recipe-books",
          params: {
            groupId: selectedGroup?.id,
            groupName: selectedGroup?.name,
          },
        });
        break;
      case "멤버관리":
        router.push({
          pathname: "/group-members",
          params: { groupId: selectedGroup?.id, groupName: selectedGroup?.name },
        });
        break;
    }
  };

  const handleRecipeCardPress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleInviteMember = () => {
    setShowInviteModal(true);
  };

  const handleCopyInviteLink = () => {
    // 실제로는 클립보드에 복사
    Alert.alert("복사 완료", "초대 링크가 복사되었습니다!");
    setShowInviteModal(false);
  };

  const handleFeedMenuPress = (feedId: string) => {
    setSelectedFeedId(feedId);
    setShowFeedMenuModal(true);
  };

  const handleFeedMenuAction = (action: "edit" | "delete") => {
    setShowFeedMenuModal(false);

    setTimeout(() => {
      if (action === "edit") {
        // 수정 화면으로 이동
        router.push({
          pathname: "/group-feed-create",
          params: {
            groupId: selectedGroup?.id,
            groupName: selectedGroup?.name,
            feedId: selectedFeedId,
            isEdit: "true"
          },
        });
      } else if (action === "delete") {
        Alert.alert(
          "게시물 삭제",
          "이 게시물을 삭제하시겠습니까?",
          [
            { text: "취소", style: "cancel" },
            {
              text: "삭제",
              style: "destructive",
              onPress: async () => {
                if (!selectedFeedId) return;
                try {
                  await deleteFeed(selectedFeedId);
                  Alert.alert("삭제 완료", "게시물이 삭제되었습니다.");
                } catch (error) {
                  console.error("피드 삭제 실패:", error);
                  Alert.alert(
                    "오류",
                    error instanceof Error ? error.message : "게시물 삭제에 실패했습니다."
                  );
                }
              },
            },
          ]
        );
      }
    }, 200);
  };

  const handleCreateFeed = () => {
    if (!selectedGroup) return;
    router.push({
      pathname: "/group-feed-create",
      params: { groupId: selectedGroup.id, groupName: selectedGroup.name },
    });
  };

  // 그룹 상세 (피드) 화면
  if (selectedGroup) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
        <StatusBar barStyle="dark-content" />

        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: Colors.neutral[100],
              position: "relative",
            }}
          >
            <Pressable
              onPress={() => setSelectedGroup(null)}
              style={{
                position: "absolute",
                left: Spacing.xl,
                zIndex: 1,
              }}
            >
              <Text style={{ fontSize: 16, color: Colors.primary[500] }}>← 뒤로</Text>
            </Pressable>
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
              }}
              numberOfLines={1}
            >
              {selectedGroup.name}
            </Text>
          </View>

          {/* Quick Actions */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              gap: Spacing.sm,
            }}
          >
            {[
              { icon: Calendar, label: "식단표" },
              { icon: ShoppingCart, label: "장볼거리" },
              { icon: BookOpen, label: "레시피북" },
              { icon: Users, label: "멤버관리" },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => handleQuickAction(item.label)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.lg,
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                }}
              >
                <item.icon size={20} color={Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 11,
                    color: Colors.neutral[600],
                    marginTop: 4,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feed */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: Spacing.xl, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {feeds.length === 0 ? (
              /* 축하 피드 (로컬 전용) */
              <View
                style={{
                  backgroundColor: Colors.primary[50],
                  borderRadius: BorderRadius.xl,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.primary[100],
                  overflow: "hidden",
                }}
              >
                <View style={{ padding: Spacing.lg }}>
                  {/* 헤더 */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: Colors.primary[500],
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <PartyPopper size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.neutral[900] }}>
                        숏끼
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 2 }}>
                        방금 전
                      </Text>
                    </View>
                  </View>

                  {/* 콘텐츠 */}
                  <View
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.lg,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: Spacing.sm }}>🎉</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900], marginBottom: Spacing.xs }}>
                      그룹이 생성되었어요!
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.neutral[500], textAlign: "center", lineHeight: 20 }}>
                      멤버를 초대하고 함께 식단을 공유해보세요.{"\n"}첫 번째 피드를 작성해볼까요?
                    </Text>
                  </View>

                  {/* 액션 버튼들 */}
                  <View style={{ flexDirection: "row", marginTop: Spacing.md, gap: Spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => setShowInviteModal(true)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#FFFFFF",
                        paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.md,
                        gap: 6,
                      }}
                    >
                      <UserPlus size={16} color={Colors.primary[500]} />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[500] }}>
                        멤버 초대
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateFeed}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: Colors.primary[500],
                        paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.md,
                        gap: 6,
                      }}
                    >
                      <PenSquare size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                        피드 작성
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              feeds.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                  overflow: "hidden",
                }}
              >
                {item.type === "post" && item.feedType === "NEW_RECIPE_ADDED" ? (
                  // 레시피 추가 알림 피드 (특별한 스타일)
                  <View>
                    {/* 상단 알림 배너 */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        backgroundColor: Colors.primary[500],
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "rgba(255,255,255,0.2)",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <BookOpen size={16} color="#FFF" />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFF", flex: 1 }}>
                        새 레시피가 추가되었어요!
                      </Text>
                      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                        {item.time}
                      </Text>
                    </View>

                    {/* 콘텐츠 영역 */}
                    <View style={{ padding: Spacing.md, backgroundColor: Colors.primary[50] }}>
                      {/* 유저 정보 */}
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: Colors.primary[500],
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFF" }}>
                            {item.userAvatar}
                          </Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[900] }}>
                            {item.user}
                          </Text>
                          <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>
                            레시피북에 추가함
                          </Text>
                        </View>
                      </View>

                      {/* 레시피 카드 */}
                      <View
                        style={{
                          backgroundColor: Colors.neutral[0],
                          borderRadius: 16,
                          padding: 14,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: Colors.primary[100],
                          shadowColor: Colors.primary[500],
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        {/* 레시피 아이콘/썸네일 */}
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            backgroundColor: Colors.secondary[100],
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 28 }}>🍳</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <View
                            style={{
                              backgroundColor: Colors.primary[100],
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              alignSelf: "flex-start",
                              marginBottom: 6,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: Colors.primary[600] }}>
                              NEW
                            </Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: Colors.neutral[900],
                              lineHeight: 20,
                            }}
                            numberOfLines={2}
                          >
                            {item.content.match(/"([^"]+)"/)?.[1] || item.content}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : item.type === "post" ? (
                  // 사용자 생성 피드 (숏끼 스타일)
                  <View style={{ padding: Spacing.md }}>
                    {/* Post Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: Spacing.md,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: Colors.primary[500],
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: "#FFFFFF",
                          }}
                        >
                          {item.userAvatar}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: Colors.neutral[900],
                          }}
                        >
                          {item.user}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: Colors.neutral[400],
                            marginTop: 2,
                          }}
                        >
                          {item.time}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleFeedMenuPress(item.id)}
                        style={{
                          padding: Spacing.xs,
                          backgroundColor: Colors.neutral[100],
                          borderRadius: BorderRadius.full,
                        }}
                      >
                        <MoreHorizontal size={18} color={Colors.neutral[500]} />
                      </TouchableOpacity>
                    </View>

                    {/* Post Content */}
                    <Text
                      style={{
                        fontSize: 15,
                        color: Colors.neutral[800],
                        lineHeight: 22,
                        marginBottom: Spacing.md,
                      }}
                    >
                      {item.content}
                    </Text>

                    {/* Post Images */}
                    {item.images && item.images.length > 0 && (
                      <View
                        style={{
                          borderRadius: BorderRadius.xl,
                          overflow: "hidden",
                          marginBottom: Spacing.md,
                        }}
                      >
                        {item.images.length === 1 ? (
                          <Image
                            source={{ uri: item.images[0] }}
                            style={{
                              width: "100%",
                              height: 200,
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: Spacing.sm }}
                          >
                            {item.images.map((imageUri, imgIndex) => (
                              <Image
                                key={imgIndex}
                                source={{ uri: imageUri }}
                                style={{
                                  width: 160,
                                  height: 160,
                                  borderRadius: BorderRadius.lg,
                                }}
                                contentFit="cover"
                              />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}

                    {/* Like Button */}
                    <TouchableOpacity
                      onPress={() => toggleLike(item.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        backgroundColor: item.isLiked ? Colors.primary[50] : Colors.neutral[50],
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.full,
                      }}
                    >
                      <Heart
                        size={18}
                        color={item.isLiked ? Colors.primary[500] : Colors.neutral[500]}
                        fill={item.isLiked ? Colors.primary[500] : "transparent"}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: item.isLiked ? Colors.primary[500] : Colors.neutral[600],
                          marginLeft: 6,
                        }}
                      >
                        {item.likes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // 레시피 추가 피드 (기존 스타일)
                  <View style={{ padding: Spacing.md }}>
                    {/* Recipe Feed Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: Spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: Colors.secondary[100],
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <BookmarkPlus size={16} color={Colors.secondary[600]} />
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                        <Text style={{ fontSize: 14, color: Colors.neutral[900] }}>
                          <Text style={{ fontWeight: "600" }}>{item.user}</Text>
                          님이 {item.action}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Colors.neutral[400],
                            marginTop: 2,
                          }}
                        >
                          {item.time}
                        </Text>
                      </View>
                    </View>

                    {/* Recipe Card */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        item.recipe && handleRecipeCardPress(item.recipe.id)
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.neutral[50],
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.sm,
                      }}
                    >
                      <Image
                        source={{ uri: item.recipe?.thumbnail }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit="cover"
                      />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: "500",
                          color: Colors.neutral[800],
                          marginLeft: Spacing.md,
                        }}
                        numberOfLines={2}
                      >
                        {item.recipe?.title}
                      </Text>
                      <ChevronRight size={20} color={Colors.neutral[400]} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* 피드 작성 FAB */}
          <TouchableOpacity
            onPress={handleCreateFeed}
            activeOpacity={0.9}
            style={{
              position: "absolute",
              bottom: 24,
              right: Spacing.xl,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: Colors.primary[500],
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <PenSquare size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 피드 메뉴 바텀시트 */}
        <Modal visible={showFeedMenuModal} transparent animationType="slide">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => setShowFeedMenuModal(false)}
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

              {/* 메뉴 옵션들 */}
              <View style={{ paddingTop: Spacing.sm }}>
                {/* 수정 */}
                <TouchableOpacity
                  onPress={() => handleFeedMenuAction("edit")}
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
                    수정
                  </Text>
                </TouchableOpacity>

                {/* 삭제 */}
                <TouchableOpacity
                  onPress={() => handleFeedMenuAction("delete")}
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
                    삭제
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 취소 버튼 */}
              <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
                <TouchableOpacity
                  onPress={() => setShowFeedMenuModal(false)}
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

  // 그룹 목록 화면
  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
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
              fontSize: Typography.fontSize["2xl"],
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            그룹
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
            <TouchableOpacity onPress={handleNotifications} activeOpacity={0.7}>
              <Bell size={24} color={Colors.neutral[600]} />
            </TouchableOpacity>
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
        </View>

        {/* Group List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {groups.length > 0 ? (
            groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                }}
              >
                {/* Group Avatar */}
                {group.thumbnail ? (
                  <Image
                    source={{ uri: group.thumbnail }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: Colors.primary[100],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Users size={24} color={Colors.primary[500]} />
                  </View>
                )}

                {/* Group Info */}
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.base,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[900],
                    }}
                  >
                    {group.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
                      멤버 {group.memberCount}명
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.neutral[300], marginHorizontal: 6 }}>
                      •
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
                      {group.lastActivity}
                    </Text>
                  </View>
                </View>

                {/* Menu Button */}
                <Pressable
                  onPress={() => handleShowGroupMenu(group)}
                  style={{ padding: Spacing.sm }}
                >
                  <MoreHorizontal size={20} color={Colors.neutral[400]} />
                </Pressable>
              </Pressable>
            ))
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 100,
              }}
            >
              <Users size={48} color={Colors.neutral[300]} />
              <Text
                style={{
                  fontSize: 16,
                  color: Colors.neutral[500],
                  marginTop: Spacing.md,
                }}
              >
                아직 참여한 그룹이 없습니다
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.primary[500],
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  marginTop: Spacing.lg,
                }}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#FFFFFF",
                    marginLeft: Spacing.sm,
                  }}
                >
                  그룹 만들기
                </Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Create Group Modal */}
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
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.xl,
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                }}
              >
                새 그룹 만들기
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color={Colors.neutral[400]} />
              </Pressable>
            </View>

            {/* Input */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[600],
                marginBottom: Spacing.sm,
              }}
            >
              그룹 이름
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
              placeholder="예: 우리 가족 식단"
              placeholderTextColor={Colors.neutral[400]}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            {/* Group Type Selector */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[600],
                marginBottom: Spacing.sm,
                marginTop: Spacing.lg,
              }}
            >
              그룹 유형
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: Spacing.sm,
              }}
            >
              {GROUP_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setNewGroupType(type.value)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.full,
                    backgroundColor: newGroupType === type.value
                      ? Colors.primary[500]
                      : Colors.neutral[100],
                    borderWidth: 1,
                    borderColor: newGroupType === type.value
                      ? Colors.primary[500]
                      : Colors.neutral[200],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: newGroupType === type.value ? '600' : '400',
                      color: newGroupType === type.value
                        ? '#FFFFFF'
                        : Colors.neutral[700],
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Create Button */}
            <Pressable
              onPress={handleCreateGroup}
              disabled={isCreating}
              style={{
                backgroundColor: isCreating ? Colors.neutral[300] : Colors.primary[500],
                borderRadius: BorderRadius.lg,
                paddingVertical: Spacing.md,
                alignItems: "center",
                marginTop: Spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#FFFFFF",
                }}
              >
                {isCreating ? "생성 중..." : "그룹 만들기"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 그룹 메뉴 바텀시트 */}
      <Modal visible={showGroupMenuModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowGroupMenuModal(false)}
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
                {menuTargetGroup?.name}
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginTop: 4,
                }}
              >
                멤버 {menuTargetGroup?.memberCount}명
              </Text>
            </View>

            {/* 메뉴 옵션들 */}
            <View style={{ paddingTop: Spacing.sm }}>
              {/* 수정 */}
              <TouchableOpacity
                onPress={() => handleGroupMenuAction("edit")}
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
                  그룹 수정
                </Text>
              </TouchableOpacity>

              {/* 그룹 나가기 */}
              <TouchableOpacity
                onPress={() => handleGroupMenuAction("leave")}
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
                    backgroundColor: Colors.warning.light,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <LogOut size={20} color={Colors.warning.main} />
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
                  그룹 나가기
                </Text>
              </TouchableOpacity>

              {/* 삭제 */}
              <TouchableOpacity
                onPress={() => handleGroupMenuAction("delete")}
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
                  그룹 삭제
                </Text>
              </TouchableOpacity>
            </View>

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowGroupMenuModal(false)}
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

      {/* 피드 메뉴 바텀시트 */}
      <Modal visible={showFeedMenuModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowFeedMenuModal(false)}
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

            {/* 메뉴 옵션들 */}
            <View style={{ paddingTop: Spacing.sm }}>
              {/* 수정 */}
              <TouchableOpacity
                onPress={() => handleFeedMenuAction("edit")}
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
                  수정
                </Text>
              </TouchableOpacity>

              {/* 삭제 */}
              <TouchableOpacity
                onPress={() => handleFeedMenuAction("delete")}
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
                  삭제
                </Text>
              </TouchableOpacity>
            </View>

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowFeedMenuModal(false)}
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

      {/* 초대 모달 */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowInviteModal(false)}
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
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.xl,
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                }}
              >
                멤버 초대
              </Text>
              <Pressable onPress={() => setShowInviteModal(false)}>
                <X size={24} color={Colors.neutral[400]} />
              </Pressable>
            </View>

            {/* 초대 링크 */}
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[600],
                marginBottom: Spacing.sm,
              }}
            >
              초대 링크
            </Text>
            <View
              style={{
                backgroundColor: Colors.neutral[50],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[600],
                }}
                numberOfLines={1}
              >
                shortkki.com/invite/{selectedGroup?.id || "abc123"}
              </Text>
            </View>

            {/* 버튼들 */}
            <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
              {/* 링크 복사 */}
              <TouchableOpacity
                onPress={handleCopyInviteLink}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  gap: Spacing.sm,
                }}
              >
                <Copy size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  링크 복사
                </Text>
              </TouchableOpacity>

              {/* 공유하기 */}
              <TouchableOpacity
                onPress={() => {
                  setShowInviteModal(false);
                  Alert.alert("공유", "공유 기능이 호출되었습니다.");
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  gap: Spacing.sm,
                }}
              >
                <Share2 size={18} color={Colors.neutral[700]} />
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  다른 앱으로 공유
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 그룹 생성 성공 모달 */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowSuccessModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 32,
              marginHorizontal: 40,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 성공 아이콘 */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.primary[50],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <PartyPopper size={40} color={Colors.primary[500]} />
            </View>

            {/* 타이틀 */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: Colors.neutral[900],
                marginBottom: 8,
              }}
            >
              그룹 생성 완료!
            </Text>

            {/* 그룹 이름 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.neutral[100],
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Users size={18} color={Colors.primary[500]} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.neutral[800],
                  marginLeft: 8,
                }}
              >
                {createdGroupName}
              </Text>
            </View>

            {/* 설명 */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              멤버를 초대하고 함께{"\n"}식단을 관리해보세요!
            </Text>

            {/* 확인 버튼 */}
            <TouchableOpacity
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary[500],
                paddingVertical: 14,
                paddingHorizontal: 48,
                borderRadius: 14,
                marginTop: 24,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Check size={20} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 그룹 삭제 확인 모달 */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => !isDeleting && setShowDeleteModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 28,
              marginHorizontal: 40,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
              width: "85%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 경고 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.error.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <AlertTriangle size={36} color={Colors.error.main} />
            </View>

            {/* 타이틀 */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: Colors.neutral[900],
                marginBottom: 8,
              }}
            >
              그룹을 삭제할까요?
            </Text>

            {/* 그룹 정보 */}
            {deleteTargetGroup && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.neutral[100],
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Users size={18} color={Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: Colors.neutral[800],
                    marginLeft: 8,
                  }}
                  numberOfLines={1}
                >
                  {deleteTargetGroup.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.neutral[500],
                    marginLeft: 8,
                  }}
                >
                  · 멤버 {deleteTargetGroup.memberCount}명
                </Text>
              </View>
            )}

            {/* 경고 메시지 */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              그룹을 삭제하면 모든 피드와 레시피북이{"\n"}
              함께 삭제되며 복구할 수 없습니다.
            </Text>

            {/* 버튼들 */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 24,
                width: "100%",
              }}
            >
              {/* 취소 버튼 */}
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetGroup(null);
                }}
                disabled={isDeleting}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>

              {/* 삭제 버튼 */}
              <TouchableOpacity
                onPress={confirmDeleteGroup}
                disabled={isDeleting}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: isDeleting ? Colors.neutral[300] : Colors.error.main,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
