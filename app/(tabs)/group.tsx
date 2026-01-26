import React, { useState } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  Bookmark,
  Settings,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 더미 그룹 데이터
const DUMMY_GROUPS = [
  {
    id: "1",
    name: "우리 가족 식단",
    memberCount: 4,
    thumbnail: null,
    lastActivity: "오늘",
  },
  {
    id: "2",
    name: "자취생 요리 모임",
    memberCount: 12,
    thumbnail: null,
    lastActivity: "어제",
  },
  {
    id: "3",
    name: "다이어트 챌린지",
    memberCount: 8,
    thumbnail: null,
    lastActivity: "3일 전",
  },
];

// 더미 피드 데이터
const DUMMY_FEED = [
  {
    id: "f1",
    type: "recipe",
    user: "엄마",
    action: "레시피를 등록했습니다",
    recipe: {
      title: "초간단 계란 볶음밥",
      thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
    },
    time: "2시간 전",
  },
  {
    id: "f2",
    type: "cook",
    user: "아빠",
    action: "요리를 완성했습니다",
    recipe: {
      title: "김치찌개",
      thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
    },
    time: "5시간 전",
  },
  {
    id: "f3",
    type: "plan",
    user: "동생",
    action: "식단을 추가했습니다",
    recipe: {
      title: "연어 스테이크",
      thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200",
    },
    time: "어제",
  },
];

interface Group {
  id: string;
  name: string;
  memberCount: number;
  thumbnail: string | null;
  lastActivity: string;
}

export default function GroupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>(DUMMY_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert("알림", "그룹 이름을 입력해주세요.");
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      memberCount: 1,
      thumbnail: null,
      lastActivity: "방금",
    };

    setGroups((prev) => [newGroup, ...prev]);
    setNewGroupName("");
    setShowCreateModal(false);
    Alert.alert("완료", `"${newGroupName}" 그룹이 생성되었습니다.`);
  };

  const handleDeleteGroup = (groupId: string) => {
    Alert.alert("그룹 삭제", "정말 이 그룹을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
        },
      },
    ]);
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
      case "장보기":
        Alert.alert("장보기", "장보기 기능은 준비 중입니다.");
        break;
      case "북마크":
        router.push("/(tabs)/recipe-book");
        break;
      case "멤버관리":
        Alert.alert("멤버 관리", "멤버 관리 기능은 준비 중입니다.");
        break;
    }
  };

  const handleRecipeCardPress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleInviteMember = () => {
    Alert.alert("멤버 초대", "초대 링크가 복사되었습니다!", [
      { text: "확인" },
    ]);
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
              justifyContent: "space-between",
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: Colors.neutral[100],
            }}
          >
            <Pressable onPress={() => setSelectedGroup(null)}>
              <Text style={{ fontSize: 16, color: Colors.primary[500] }}>← 뒤로</Text>
            </Pressable>
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
              }}
            >
              {selectedGroup.name}
            </Text>
            <TouchableOpacity onPress={handleInviteMember} activeOpacity={0.7}>
              <UserPlus size={24} color={Colors.neutral[600]} />
            </TouchableOpacity>
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
              { icon: ShoppingCart, label: "장보기" },
              { icon: Bookmark, label: "북마크" },
              { icon: Settings, label: "멤버관리" },
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
            contentContainerStyle={{ padding: Spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontWeight: Typography.fontWeight.semiBold,
                color: Colors.neutral[700],
                marginBottom: Spacing.md,
              }}
            >
              최근 활동
            </Text>

            {DUMMY_FEED.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                }}
              >
                {/* Activity Header */}
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
                      backgroundColor: Colors.primary[100],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: Colors.primary[600],
                      }}
                    >
                      {item.user.substring(0, 1)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={{ fontSize: 14, color: Colors.neutral[900] }}>
                      <Text style={{ fontWeight: "600" }}>{item.user}</Text>
                      님이 {item.action}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: Colors.neutral[400], marginTop: 2 }}
                    >
                      {item.time}
                    </Text>
                  </View>
                </View>

                {/* Recipe Card */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleRecipeCardPress(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[50],
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.sm,
                  }}
                >
                  <Image
                    source={{ uri: item.recipe.thumbnail }}
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
                    {item.recipe.title}
                  </Text>
                  <ChevronRight size={20} color={Colors.neutral[400]} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
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
              fontWeight: Typography.fontWeight.bold,
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
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.primary[500],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Plus size={20} color="#FFFFFF" />
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
                  onPress={() => {
                    Alert.alert(group.name, "그룹 관리", [
                      { text: "취소", style: "cancel" },
                      { text: "수정", onPress: () => {} },
                      {
                        text: "삭제",
                        style: "destructive",
                        onPress: () => handleDeleteGroup(group.id),
                      },
                    ]);
                  }}
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

            {/* Create Button */}
            <Pressable
              onPress={handleCreateGroup}
              style={{
                backgroundColor: Colors.primary[500],
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
                그룹 만들기
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
