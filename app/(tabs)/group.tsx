import React, { useState, useCallback, useEffect, useRef } from "react";
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
  BackHandler,
  Animated,
  Easing,
  Share,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Plus,
  MoreHorizontal,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  Calendar,
  ShoppingCart,
  Book,
  Edit3,
  Trash2,
  LogOut,
  PenSquare,
  Heart,
  Share2,
  PartyPopper,
  Check,
  AlertTriangle,
  Clock,
  Bookmark,
  MessageCircle,
  Copyright,
  Ban,
  Megaphone,
  HelpCircle,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { API_BASE_URL } from "@/constants/env";
import { useGroups, useGroupFeeds, useGroupMembers, getGroupInviteCode } from "@/hooks";
import { api } from "@/services/api";
import { FeedbackToast, useFeedbackToast } from "@/components/ui/FeedbackToast";
import { useUser } from "@/contexts/AuthContext";
import type { Group } from "@/data/mock";
import { parseServerDate } from "@/utils/date";

const REPORT_TYPES = [
  { id: "INACCURATE", label: "잘못된 정보", icon: AlertTriangle, description: "게시글에 사실과 다르거나 오해를 일으킬 수 있는 내용이 있어요" },
  { id: "COPYRIGHT_INFRINGEMENT", label: "저작권 침해", icon: Copyright, description: "다른 사람의 사진이나 글을 허락 없이 사용한 게시글이에요" },
  { id: "INAPPROPRIATE_CONTENT", label: "부적절한 콘텐츠", icon: Ban, description: "불쾌하거나 유해한 내용이 포함된 게시글이에요" },
  { id: "SPAM_AD", label: "스팸 / 광고", icon: Megaphone, description: "홍보 목적이거나 반복적으로 작성된 게시글이에요" },
  { id: "OTHER", label: "기타", icon: HelpCircle, description: "위 항목에 해당하지 않는 신고 사유예요" },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 그룹 타입 정의
const GROUP_TYPES = [
  { value: 'COUPLE', label: '커플' },
  { value: 'FAMILY', label: '가족' },
  { value: 'FRIENDS', label: '친구' },
  { value: 'ETC', label: '기타' },
] as const;

type GroupTypeValue = typeof GROUP_TYPES[number]['value'];

// 상대 시간 포맷 (lastFeedAt용)
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '피드 없음';

  const date = parseServerDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function GroupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string; _t?: string }>();
  const currentUser = useUser();

  // Hooks로 데이터 관리
  const { groups, createGroup, deleteGroup, leaveGroup, refetch: refetchGroups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { feeds, loading: feedsLoading, loadingMore, hasNext, toggleLike, deleteFeed, refetch: refetchFeeds, fetchNextPage } = useGroupFeeds(selectedGroup?.id);
  useGroupMembers(selectedGroup?.id);
  const appliedRouteTargetRef = useRef<string | null>(null);

  // 그룹 탭을 다시 누르면 그룹 목록으로 돌아가기
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      if (selectedGroup) {
        e.preventDefault();
        setSelectedGroup(null);
      }
    });
    return unsubscribe;
  }, [navigation, selectedGroup]);

  // 하드웨어 뒤로가기 시 그룹 상세 → 그룹 목록 (포커스 시에만 등록)
  useFocusEffect(
    useCallback(() => {
      if (!selectedGroup) return;
      const onBackPress = () => {
        setSelectedGroup(null);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [selectedGroup])
  );

  // params로 groupId가 전달되면 해당 그룹을 자동 선택
  useEffect(() => {
    if (!params.groupId || groups.length === 0) return;

    const routeTargetKey = `${params.groupId}:${params._t ?? ""}`;
    if (appliedRouteTargetRef.current === routeTargetKey) {
      return;
    }

    const target = groups.find(g => String(g.id) === String(params.groupId));
    if (target) {
      setSelectedGroup(target);
      appliedRouteTargetRef.current = routeTargetKey;
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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTargetGroup, setLeaveTargetGroup] = useState<Group | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveSuccessModal, setShowLeaveSuccessModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showDeleteFeedModal, setShowDeleteFeedModal] = useState(false);
  const [isDeletingFeed, setIsDeletingFeed] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  // 그룹 메뉴 바텀시트 애니메이션
  const groupMenuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const groupMenuSheetTranslateY = useRef(new Animated.Value(300)).current;

  const openGroupMenu = useCallback(() => {
    setShowGroupMenuModal(true);
    Animated.parallel([
      Animated.timing(groupMenuOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(groupMenuSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [groupMenuOverlayOpacity, groupMenuSheetTranslateY]);

  const closeGroupMenu = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(groupMenuOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(groupMenuSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowGroupMenuModal(false);
      onDone?.();
    });
  }, [groupMenuOverlayOpacity, groupMenuSheetTranslateY]);

  // 피드 메뉴 바텀시트 애니메이션
  const feedMenuOverlayOpacity = useRef(new Animated.Value(0)).current;
  const feedMenuSheetTranslateY = useRef(new Animated.Value(300)).current;

  const openFeedMenu = useCallback(() => {
    setShowFeedMenuModal(true);
    Animated.parallel([
      Animated.timing(feedMenuOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(feedMenuSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [feedMenuOverlayOpacity, feedMenuSheetTranslateY]);

  const closeFeedMenu = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(feedMenuOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(feedMenuSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFeedMenuModal(false);
      onDone?.();
    });
  }, [feedMenuOverlayOpacity, feedMenuSheetTranslateY]);

  // 피드백(신고) 관련 상태
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } =
    useFeedbackToast(1400);

  const handleFeedReport = useCallback(() => {
    closeFeedMenu(() => {
      setTimeout(() => {
        setFeedbackType(null);
        setFeedbackContent("");
        setShowFeedbackModal(true);
      }, 100);
    });
  }, [closeFeedMenu]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackType || !selectedFeedId) return;
    setFeedbackSubmitting(true);
    try {
      await api.post("/api/v1/feedback", {
        targetType: "FEED",
        targetId: selectedFeedId,
        feedbackType,
        ...(feedbackContent.trim() && { description: feedbackContent.trim() }),
      });
      setShowFeedbackModal(false);
      showToast("신고가 접수됐어요, 감사합니다!", "success");
    } catch {
      showToast("신고 접수에 실패했어요", "danger");
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackType, feedbackContent, selectedFeedId, showToast]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert("알림", "그룹 이름을 입력해주세요.");
      return;
    }

    if (isCreating) return;

    try {
      setIsCreating(true);

      // 서버 API 호출
      const newGroup = await createGroup({
        name: newGroupName,
        groupType: newGroupType,
      });

      // 새로 생성된 그룹을 선택 상태로 설정
      setSelectedGroup(newGroup);
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
    openGroupMenu();
  };

  const handleGroupMenuAction = (action: "edit" | "delete" | "leave") => {
    if (!menuTargetGroup) return;

    closeGroupMenu(() => {
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
          // 방장은 그룹을 나갈 수 없음
          if (menuTargetGroup.myRole === 'ADMIN') {
            Alert.alert(
              "그룹 나가기 불가",
              "방장은 그룹을 나갈 수 없습니다.\n그룹을 삭제하거나, 다른 멤버에게 방장을 위임해주세요."
            );
            return;
          }
          setLeaveTargetGroup(menuTargetGroup);
          setShowLeaveModal(true);
          break;
      }
    });
  };

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "식단표":
        router.push({
          pathname: "/group-calendar",
          params: { groupId: selectedGroup?.id, groupName: selectedGroup?.name },
        });
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

  const handleInviteShare = async () => {
    if (!selectedGroup) return;

    try {
      setIsInviting(true);

      // API에서 초대 코드 받기
      const inviteCode = await getGroupInviteCode(selectedGroup.id);

      // 딥링크 URL 생성
      const inviteUrl = `${API_BASE_URL}/group/invite/${inviteCode}`;

      // 시스템 공유 시트 열기
      await Share.share(
        Platform.OS === "ios"
          ? {
              message: `${selectedGroup.name} 그룹에 초대합니다!`,
              url: inviteUrl,
            }
          : {
              message: `${selectedGroup.name} 그룹에 초대합니다!\n${inviteUrl}`,
            }
      );
      setShowInviteModal(false);
    } catch (err) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if ((err as Error).message !== "User did not share") {
        Alert.alert("오류", "초대 링크를 생성할 수 없습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleFeedMenuPress = (feedId: string) => {
    setSelectedFeedId(feedId);
    openFeedMenu();
  };

  const handleFeedMenuAction = (action: "edit" | "delete") => {
    closeFeedMenu(() => {
      if (action === "edit") {
        router.push({
          pathname: "/group-feed-create",
          params: {
            groupId: selectedGroup?.id,
            groupName: selectedGroup?.name,
            feedId: selectedFeedId,
            isEdit: "true",
          },
        });
      } else if (action === "delete") {
        setShowDeleteFeedModal(true);
      }
    });
  };

  const handleDeleteFeed = async () => {
    if (!selectedFeedId || isDeletingFeed) return;

    try {
      setIsDeletingFeed(true);
      await deleteFeed(selectedFeedId);
      setShowDeleteFeedModal(false);
      setSelectedFeedId(null);
    } catch (error) {
      console.error("피드 삭제 실패:", error);
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "게시물 삭제에 실패했습니다."
      );
    } finally {
      setIsDeletingFeed(false);
    }
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
              <ChevronLeft size={28} color={Colors.neutral[700]} />
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
              { icon: Book, label: "레시피북" },
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
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
                fetchNextPage();
              }
            }}
            scrollEventThrottle={400}
          >
            {/* 피드 목록 */}
            {feeds.length === 0 ? (
              /* 축하 피드 (그룹 생성 시) */
              <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] }}>
                <View style={{ padding: Spacing.lg }}>
                  {/* 헤더 */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.md }}>
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
                      <PartyPopper size={18} color="#FFFFFF" />
                    </View>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: Colors.neutral[900],
                        marginLeft: Spacing.sm,
                      }}
                    >
                      숏끼
                    </Text>
                  </View>

                  {/* 콘텐츠 카드 */}
                  <View
                    style={{
                      backgroundColor: Colors.primary[50],
                      borderRadius: BorderRadius.xl,
                      padding: Spacing.xl,
                      alignItems: "center",
                      marginBottom: Spacing.md,
                    }}
                  >
                    <Text style={{ fontSize: 40, marginBottom: Spacing.sm }}>🎉</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900], marginBottom: Spacing.xs }}>
                      그룹이 생성되었어요!
                    </Text>
                    <Text style={{ fontSize: 14, color: Colors.neutral[500], textAlign: "center", lineHeight: 20 }}>
                      멤버를 초대하고 함께 식단을 공유해보세요.
                    </Text>
                  </View>

                  {/* 액션 버튼들 */}
                  <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <TouchableOpacity
                      onPress={handleInviteShare}
                      disabled={isInviting}
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
                        opacity: isInviting ? 0.6 : 1,
                      }}
                    >
                      {isInviting ? (
                        <ActivityIndicator size="small" color={Colors.primary[500]} />
                      ) : (
                        <>
                          <UserPlus size={18} color={Colors.primary[500]} />
                          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[500] }}>
                            멤버 초대
                          </Text>
                        </>
                      )}
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
                        paddingVertical: Spacing.md,
                        borderRadius: BorderRadius.lg,
                        gap: 6,
                      }}
                    >
                      <PenSquare size={18} color="#FFFFFF" />
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
                  backgroundColor: '#FFFFFF',
                  marginHorizontal: 16,
                  marginBottom: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#EEEEEE',
                  overflow: 'hidden',
                }}
              >
                {item.type === "post" ? (
                  <View>
                    {/* Post Header */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        paddingBottom: 12,
                      }}
                    >
                      {item.userProfileImgUrl ? (
                        <Image
                          source={{ uri: item.userProfileImgUrl }}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            borderWidth: 2,
                            borderColor: Colors.primary[100],
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: Colors.primary[50],
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: Colors.primary[500],
                            }}
                          >
                            {item.userAvatar}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: Colors.neutral[900],
                          }}
                        >
                          {item.user}
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
                      <TouchableOpacity
                        onPress={() => handleFeedMenuPress(item.id)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#F5F5F5',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <MoreHorizontal size={18} color={Colors.neutral[400]} />
                      </TouchableOpacity>
                    </View>

                    {/* Content Text - 이미지 위에 표시 */}
                    {item.content && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            color: Colors.neutral[800],
                            lineHeight: 22,
                          }}
                        >
                          {item.content}
                        </Text>
                      </View>
                    )}

                    {/* Post Images */}
                    {item.images && item.images.length > 0 && (
                      <View style={{ marginBottom: 0 }}>
                        {item.images.length === 1 ? (
                          <Image
                            source={{ uri: item.images[0] }}
                            style={{
                              width: "100%",
                              aspectRatio: 4/3,
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            contentContainerStyle={{ gap: 2 }}
                          >
                            {item.images.map((imageUri, imgIndex) => (
                              <Image
                                key={imgIndex}
                                source={{ uri: imageUri }}
                                style={{
                                  width: SCREEN_WIDTH - 34,
                                  aspectRatio: 4/3,
                                }}
                                contentFit="cover"
                              />
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    )}

                    {/* Recipe Card (NEW_RECIPE_ADDED) */}
                    {item.feedType === "NEW_RECIPE_ADDED" && item.recipe && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push(`/recipe/${item.recipe!.id}` as any)}
                        style={{
                          margin: 16,
                          marginTop: 0,
                          borderRadius: 16,
                          overflow: "hidden",
                          backgroundColor: '#F8F8F8',
                          borderWidth: 1,
                          borderColor: '#EEEEEE',
                        }}
                      >
                        {/* 썸네일 */}
                        {item.recipe.mainImgUrl ? (
                          <Image
                            source={{ uri: item.recipe.mainImgUrl }}
                            style={{ width: "100%", height: 140 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: "100%",
                              height: 140,
                              backgroundColor: Colors.neutral[100],
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Book size={32} color={Colors.neutral[300]} />
                          </View>
                        )}
                        {/* 레시피 정보 */}
                        <View
                          style={{
                            padding: 14,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "700",
                                color: Colors.neutral[900],
                                marginBottom: 6,
                              }}
                              numberOfLines={1}
                            >
                              {item.recipe.title}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Clock size={13} color={Colors.neutral[400]} />
                                <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>
                                  {item.recipe.cookingTime}분
                                </Text>
                              </View>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Bookmark size={13} color={Colors.neutral[400]} />
                                <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>
                                  {item.recipe.bookmarkCount}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: Colors.primary[500],
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                          >
                            <ChevronRight size={18} color="#FFFFFF" />
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Action Buttons */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderTopWidth: 1,
                        borderTopColor: '#F5F5F5',
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => toggleLike(item.id)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Heart
                          size={22}
                          color={item.isLiked ? Colors.primary[500] : Colors.neutral[400]}
                          fill={item.isLiked ? Colors.primary[500] : "transparent"}
                        />
                        {item.likes > 0 && (
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: item.isLiked ? Colors.primary[500] : Colors.neutral[500],
                            }}
                          >
                            {item.likes}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            ))
            )}

            {/* 하단: 로딩 or 완료 메시지 */}
            {loadingMore ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <ActivityIndicator size="small" color={Colors.neutral[400]} />
              </View>
            ) : !hasNext ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Check size={24} color={Colors.neutral[400]} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.neutral[500] }}>
                  모든 피드를 확인했어요
                </Text>
              </View>
            ) : null}

            <View style={{ height: 80 }} />
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
        <Modal
          visible={showFeedMenuModal}
          transparent
          statusBarTranslucent
          animationType="none"
          onRequestClose={() => closeFeedMenu()}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                opacity: feedMenuOverlayOpacity,
              }}
            >
              <Pressable style={{ flex: 1 }} onPress={() => closeFeedMenu()} />
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ translateY: feedMenuSheetTranslateY }],
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: BorderRadius.xl,
                borderTopRightRadius: BorderRadius.xl,
                paddingTop: Spacing.sm,
                paddingBottom: insets.bottom + Spacing.xl + 100,
                marginBottom: -100,
                paddingHorizontal: Spacing.xl,
              }}
            >
              <View style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: Colors.neutral[200],
                alignSelf: "center",
                marginBottom: Spacing.xl,
              }} />

              {(() => {
                const selectedFeed = feeds.find(f => f.id === selectedFeedId);
                const isMyFeed = !!(selectedFeed?.authorId && currentUser?.id && selectedFeed.authorId === currentUser.id);
                return isMyFeed ? (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleFeedMenuAction("edit")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.md,
                        paddingVertical: 14,
                      }}
                    >
                      <Edit3 size={20} color={Colors.neutral[600]} />
                      <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                        수정
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleFeedMenuAction("delete")}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.md,
                        paddingVertical: 14,
                      }}
                    >
                      <Trash2 size={20} color={Colors.error.main} />
                      <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                        삭제
                      </Text>
                    </TouchableOpacity>

                    {/* 구분선 */}
                    <View style={{ height: 1, backgroundColor: Colors.neutral[100], marginVertical: 4 }} />
                  </>
                ) : null;
              })()}

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleFeedReport}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                  paddingVertical: 14,
                }}
              >
                <MessageCircle size={20} color={Colors.neutral[600]} />
                <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                  신고하기
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* 피드 삭제 확인 모달 */}
        <Modal visible={showDeleteFeedModal} transparent animationType="fade">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => !isDeletingFeed && setShowDeleteFeedModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: Colors.neutral[0],
                borderRadius: 24,
                padding: 28,
                marginHorizontal: 32,
                width: "85%",
                maxWidth: 340,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 10,
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* 경고 아이콘 */}
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#FEE2E2",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: Colors.error.main,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={28} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>

              {/* 타이틀 */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginBottom: 8,
                }}
              >
                게시물 삭제
              </Text>

              {/* 설명 */}
              <Text
                style={{
                  fontSize: 15,
                  color: Colors.neutral[500],
                  textAlign: "center",
                  lineHeight: 22,
                  marginBottom: 24,
                }}
              >
                이 게시물을 삭제하시겠습니까?{"\n"}삭제된 게시물은 복구할 수 없습니다.
              </Text>

              {/* 버튼들 */}
              <View style={{ width: "100%", gap: 10 }}>
                {/* 삭제 버튼 */}
                <TouchableOpacity
                  onPress={handleDeleteFeed}
                  disabled={isDeletingFeed}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDeletingFeed ? Colors.neutral[300] : Colors.error.main,
                    paddingVertical: 14,
                    borderRadius: 14,
                    gap: 8,
                  }}
                >
                  {isDeletingFeed ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Trash2 size={18} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#FFFFFF",
                        }}
                      >
                        삭제하기
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 취소 버튼 */}
                <TouchableOpacity
                  onPress={() => setShowDeleteFeedModal(false)}
                  disabled={isDeletingFeed}
                  activeOpacity={0.8}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: Colors.neutral[400],
                    }}
                  >
                    취소
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* 신고하기 모달 */}
        <Modal
          visible={showFeedbackModal}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => {
            if (!feedbackSubmitting) setShowFeedbackModal(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => {
                if (!feedbackSubmitting) setShowFeedbackModal(false);
              }}
            >
              <Pressable
                style={{
                  width: "90%",
                  maxHeight: "80%",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  overflow: "hidden",
                }}
                onPress={(e) => e.stopPropagation()}
              >
                {/* 헤더 */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: 16,
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.neutral[900] }}>
                      신고하기
                    </Text>
                    <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 4 }}>
                      이 게시글을 신고하는 이유를 알려주세요
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowFeedbackModal(false)}
                    disabled={feedbackSubmitting}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: Colors.neutral[100],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <X size={20} color={Colors.neutral[500]} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: 460 }}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* 피드백 유형 선택 */}
                  <View style={{ gap: 8 }}>
                    {REPORT_TYPES.map((type) => {
                      const isSelected = feedbackType === type.id;
                      const Icon = type.icon;
                      return (
                        <TouchableOpacity
                          key={type.id}
                          onPress={() => setFeedbackType(isSelected ? null : type.id)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 14,
                            borderRadius: 14,
                            backgroundColor: isSelected ? Colors.primary[50] : Colors.neutral[50],
                            borderWidth: 1.5,
                            borderColor: isSelected ? Colors.primary[400] : Colors.neutral[200],
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Icon size={20} color={isSelected ? Colors.primary[500] : Colors.neutral[500]} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: isSelected ? Colors.primary[700] : Colors.neutral[900],
                              }}
                            >
                              {type.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: isSelected ? Colors.primary[400] : Colors.neutral[400],
                                marginTop: 2,
                              }}
                            >
                              {type.description}
                            </Text>
                          </View>
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: isSelected ? Colors.primary[500] : "transparent",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 상세 내용 입력 */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: Colors.neutral[700],
                      marginTop: 20,
                      marginBottom: 8,
                    }}
                  >
                    상세 내용 (선택)
                  </Text>
                  <TextInput
                    value={feedbackContent}
                    onChangeText={setFeedbackContent}
                    placeholder="구체적인 내용을 알려주시면 검토에 도움이 됩니다"
                    placeholderTextColor={Colors.neutral[300]}
                    multiline
                    textAlignVertical="top"
                    maxLength={500}
                    style={{
                      backgroundColor: Colors.neutral[50],
                      borderWidth: 1,
                      borderColor: Colors.neutral[200],
                      borderRadius: 14,
                      padding: 14,
                      fontSize: 14,
                      color: Colors.neutral[800],
                      minHeight: 100,
                      lineHeight: 20,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.neutral[300],
                      textAlign: "right",
                      marginTop: 6,
                    }}
                  >
                    {feedbackContent.length}/500
                  </Text>

                  {/* 제출 버튼 */}
                  <TouchableOpacity
                    onPress={handleSubmitFeedback}
                    disabled={!feedbackType || feedbackSubmitting}
                    activeOpacity={0.8}
                    style={{
                      marginTop: 16,
                      backgroundColor: !feedbackType ? Colors.neutral[200] : Colors.primary[500],
                      paddingVertical: 15,
                      borderRadius: BorderRadius.lg,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {feedbackSubmitting && (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    )}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: !feedbackType ? Colors.neutral[400] : "#FFFFFF",
                      }}
                    >
                      {feedbackSubmitting ? "접수 중..." : "신고 접수하기"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

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
              fontSize: Typography.fontSize.xl,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            그룹
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/group-edit")}
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

        {/* Group List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {groups.length > 0 ? (
            groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#F5F5F5' : '#FFFFFF',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: pressed ? Colors.primary[400] : '#D4D4D4',
                  padding: 16,
                  marginBottom: 20,
                })}
              >
                {/* 상단: 아바타 + 그룹명 + 뱃지 */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  {/* Group Avatar */}
                  {group.thumbnail ? (
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 22,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <Image
                        source={{ uri: group.thumbnail }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 22,
                        backgroundColor: Colors.primary[50],
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Users size={34} color={Colors.primary[500]} strokeWidth={1.8} />
                    </View>
                  )}

                  {/* Group Name + Badge */}
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "800",
                          color: Colors.neutral[900],
                          letterSpacing: -0.5,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Text>
                      {group.myRole === 'ADMIN' && (
                        <View
                          style={{
                            backgroundColor: Colors.primary[500],
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 8,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFF" }}>
                            방장
                          </Text>
                        </View>
                      )}
                    </View>
                    {group.description && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: Colors.neutral[500],
                          lineHeight: 20,
                        }}
                        numberOfLines={1}
                      >
                        {group.description}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 하단: 메타 정보 + 화살표 */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: '#FFFFFF',
                          justifyContent: 'center',
                          alignItems: 'center',
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <Users size={14} color={Colors.primary[500]} strokeWidth={2.5} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.neutral[700] }}>
                        {group.memberCount}명
                      </Text>
                    </View>
                    {group.lastFeedAt && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: '#FFFFFF',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <Clock size={14} color={Colors.neutral[500]} strokeWidth={2.5} />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.neutral[600] }}>
                          {formatRelativeTime(group.lastFeedAt)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShowGroupMenu(group);
                    }}
                    style={({ pressed }) => ({
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: pressed ? '#EEEEEE' : '#FFFFFF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    })}
                    hitSlop={8}
                  >
                    <MoreHorizontal size={18} color={Colors.neutral[500]} />
                  </Pressable>
                </View>
              </Pressable>
            ))
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 100,
                paddingHorizontal: 32,
              }}
            >
              {/* 일러스트 스타일 아이콘 */}
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: '#FFF7ED',
                    justifyContent: "center",
                    alignItems: "center",
                    position: 'relative',
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#FFEDD5',
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Users size={40} color={Colors.primary[500]} strokeWidth={1.5} />
                  </View>
                  {/* 데코레이션 */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#FEF3C7',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12 }}>✨</Text>
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 8,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#E0F2FE',
                    }}
                  />
                </View>
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: Colors.neutral[900],
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
              >
                아직 그룹이 없어요
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: Colors.neutral[500],
                  textAlign: "center",
                  lineHeight: 22,
                  marginBottom: 28,
                }}
              >
                그룹을 만들어 가족, 친구들과{"\n"}식단을 함께 관리해보세요
              </Text>
              <Pressable
                onPress={() => router.push("/group-edit")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: pressed ? '#E65100' : Colors.primary[500],
                  paddingHorizontal: 28,
                  paddingVertical: 16,
                  borderRadius: 16,
                  gap: 8,
                  shadowColor: Colors.primary[500],
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  첫 그룹 만들기
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
      <Modal
        visible={showGroupMenuModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeGroupMenu()}
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
              opacity: groupMenuOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => closeGroupMenu()} />
          </Animated.View>

          {/* 시트 */}
          <Animated.View
            style={{
              transform: [{ translateY: groupMenuSheetTranslateY }],
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

            {/* 그룹 수정 (방장만) */}
            {menuTargetGroup?.myRole === 'ADMIN' && (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleGroupMenuAction("edit")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                  paddingVertical: 14,
                }}
              >
                <Edit3 size={20} color={Colors.neutral[600]} />
                <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                  그룹 수정
                </Text>
              </TouchableOpacity>
            )}

            {/* 그룹 나가기 (방장이면 비활성화) */}
            <TouchableOpacity
              activeOpacity={menuTargetGroup?.myRole === 'ADMIN' ? 1 : 0.6}
              onPress={() => handleGroupMenuAction("leave")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
                opacity: menuTargetGroup?.myRole === 'ADMIN' ? 0.4 : 1,
              }}
            >
              <LogOut size={20} color={Colors.neutral[600]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                  그룹 나가기
                </Text>
                {menuTargetGroup?.myRole === 'ADMIN' && (
                  <Text style={{ fontSize: 12, color: Colors.neutral[400], marginTop: 2 }}>
                    방장은 그룹을 나갈 수 없습니다
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* 그룹 삭제 (방장만) */}
            {menuTargetGroup?.myRole === 'ADMIN' && (
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleGroupMenuAction("delete")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                  paddingVertical: 14,
                }}
              >
                <Trash2 size={20} color={Colors.error.main} />
                <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                  그룹 삭제
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 피드 메뉴 바텀시트 */}
      <Modal
        visible={showFeedMenuModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeFeedMenu()}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              opacity: feedMenuOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => closeFeedMenu()} />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: feedMenuSheetTranslateY }],
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingTop: Spacing.sm,
              paddingBottom: insets.bottom + Spacing.xl + 100,
              marginBottom: -100,
              paddingHorizontal: Spacing.xl,
            }}
          >
            <View style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.neutral[200],
              alignSelf: "center",
              marginBottom: Spacing.xl,
            }} />

            {(() => {
              const selectedFeed = feeds.find(f => f.id === selectedFeedId);
              const isMyFeed = !!(selectedFeed?.authorId && currentUser?.id && selectedFeed.authorId === currentUser.id);
              return isMyFeed ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleFeedMenuAction("edit")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      paddingVertical: 14,
                    }}
                  >
                    <Edit3 size={20} color={Colors.neutral[600]} />
                    <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                      수정
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleFeedMenuAction("delete")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      paddingVertical: 14,
                    }}
                  >
                    <Trash2 size={20} color={Colors.error.main} />
                    <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                      삭제
                    </Text>
                  </TouchableOpacity>

                  {/* 구분선 */}
                  <View style={{ height: 1, backgroundColor: Colors.neutral[100], marginVertical: 4 }} />
                </>
              ) : null;
            })()}

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleFeedReport}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
              }}
            >
              <MessageCircle size={20} color={Colors.neutral[600]} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                신고하기
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
          onPress={() => !isInviting && setShowInviteModal(false)}
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
              <Pressable
                onPress={() => !isInviting && setShowInviteModal(false)}
                disabled={isInviting}
              >
                <X size={24} color={Colors.neutral[400]} />
              </Pressable>
            </View>

            {/* 초대 안내 */}
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[600],
                textAlign: "center",
                marginBottom: Spacing.lg,
                lineHeight: 22,
              }}
            >
              초대 링크를 공유하여{"\n"}멤버를 초대해보세요
            </Text>

            {/* 공유하기 버튼 */}
            <TouchableOpacity
              onPress={handleInviteShare}
              activeOpacity={0.8}
              disabled={isInviting}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isInviting ? Colors.neutral[300] : Colors.primary[500],
                borderRadius: BorderRadius.lg,
                paddingVertical: Spacing.md,
                gap: Spacing.sm,
              }}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Share2 size={18} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: Typography.fontSize.base,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    초대 링크 공유하기
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
              padding: 24,
              width: "78%",
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
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: Colors.primary[50],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <PartyPopper size={32} color={Colors.primary[500]} />
            </View>

            {/* 타이틀 */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: Colors.neutral[900],
                marginBottom: 10,
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
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Users size={16} color={Colors.primary[500]} />
              <Text
                style={{
                  fontSize: 14,
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
                fontSize: 13,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 19,
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
                paddingVertical: 12,
                paddingHorizontal: 40,
                borderRadius: 12,
                marginTop: 18,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={17} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 14,
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

      {/* 그룹 나가기 확인 모달 */}
      <Modal visible={showLeaveModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => !isLeaving && setShowLeaveModal(false)}
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
            {/* 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.warning.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <LogOut size={36} color={Colors.warning.main} />
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
              그룹에서 나갈까요?
            </Text>

            {/* 그룹 정보 */}
            {leaveTargetGroup && (
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
                  {leaveTargetGroup.name}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.neutral[500],
                    marginLeft: 8,
                  }}
                >
                  · 멤버 {leaveTargetGroup.memberCount}명
                </Text>
              </View>
            )}

            {/* 안내 메시지 */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              그룹을 나가면 피드와 레시피북에{"\n"}
              더 이상 접근할 수 없습니다.
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
                  setShowLeaveModal(false);
                  setLeaveTargetGroup(null);
                }}
                disabled={isLeaving}
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

              {/* 나가기 버튼 */}
              <TouchableOpacity
                onPress={async () => {
                  if (!leaveTargetGroup) return;
                  setIsLeaving(true);
                  try {
                    await leaveGroup(leaveTargetGroup.id);
                    setShowLeaveModal(false);
                    setShowLeaveSuccessModal(true);
                  } catch (error) {
                    console.error("그룹 나가기 실패:", error);
                    Alert.alert(
                      "오류",
                      error instanceof Error ? error.message : "그룹 나가기에 실패했습니다."
                    );
                  } finally {
                    setIsLeaving(false);
                  }
                }}
                disabled={isLeaving}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: isLeaving ? Colors.neutral[300] : Colors.warning.main,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <LogOut size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: "#FFFFFF",
                  }}
                >
                  {isLeaving ? "나가는 중..." : "나가기"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 그룹 나가기 완료 모달 */}
      <Modal visible={showLeaveSuccessModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => {
            setShowLeaveSuccessModal(false);
            setLeaveTargetGroup(null);
          }}
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
            {/* 체크 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.success.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Check size={36} color={Colors.success.main} />
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
              그룹에서 나왔어요
            </Text>

            {/* 안내 메시지 */}
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              {leaveTargetGroup?.name ? `"${leaveTargetGroup.name}" ` : ""}그룹에서{"\n"}
              성공적으로 나왔습니다.
            </Text>

            {/* 확인 버튼 */}
            <TouchableOpacity
              onPress={() => {
                setShowLeaveSuccessModal(false);
                setLeaveTargetGroup(null);
              }}
              activeOpacity={0.8}
              style={{
                width: "100%",
                backgroundColor: Colors.primary[500],
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
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

      {/* 신고하기 모달 */}
      <Modal
        visible={showFeedbackModal}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => {
          if (!feedbackSubmitting) setShowFeedbackModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              if (!feedbackSubmitting) setShowFeedbackModal(false);
            }}
          >
            <Pressable
              style={{
                width: "90%",
                maxHeight: "80%",
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 16,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.neutral[900] }}>
                    신고하기
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 4 }}>
                    이 게시글을 신고하는 이유를 알려주세요
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFeedbackModal(false)}
                  disabled={feedbackSubmitting}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <X size={20} color={Colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 460 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* 피드백 유형 선택 */}
                <View style={{ gap: 8 }}>
                  {REPORT_TYPES.map((type) => {
                    const isSelected = feedbackType === type.id;
                    const Icon = type.icon;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() => setFeedbackType(isSelected ? null : type.id)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 14,
                          borderRadius: 14,
                          backgroundColor: isSelected ? Colors.primary[50] : Colors.neutral[50],
                          borderWidth: 1.5,
                          borderColor: isSelected ? Colors.primary[400] : Colors.neutral[200],
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Icon size={20} color={isSelected ? Colors.primary[500] : Colors.neutral[500]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isSelected ? Colors.primary[700] : Colors.neutral[900],
                            }}
                          >
                            {type.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isSelected ? Colors.primary[400] : Colors.neutral[400],
                              marginTop: 2,
                            }}
                          >
                            {type.description}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: isSelected ? Colors.primary[500] : "transparent",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 상세 내용 입력 */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                >
                  상세 내용 (선택)
                </Text>
                <TextInput
                  value={feedbackContent}
                  onChangeText={setFeedbackContent}
                  placeholder="구체적인 내용을 알려주시면 검토에 도움이 됩니다"
                  placeholderTextColor={Colors.neutral[300]}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                  style={{
                    backgroundColor: Colors.neutral[50],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 14,
                    color: Colors.neutral[800],
                    minHeight: 100,
                    lineHeight: 20,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.neutral[300],
                    textAlign: "right",
                    marginTop: 6,
                  }}
                >
                  {feedbackContent.length}/500
                </Text>

                {/* 제출 버튼 */}
                <TouchableOpacity
                  onPress={handleSubmitFeedback}
                  disabled={!feedbackType || feedbackSubmitting}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 16,
                    backgroundColor: !feedbackType ? Colors.neutral[200] : Colors.primary[500],
                    paddingVertical: 15,
                    borderRadius: BorderRadius.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {feedbackSubmitting && (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: !feedbackType ? Colors.neutral[400] : "#FFFFFF",
                    }}
                  >
                    {feedbackSubmitting ? "접수 중..." : "신고 접수하기"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

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
