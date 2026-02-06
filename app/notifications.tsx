import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  ChefHat,
  Bell,
  Check,
} from "lucide-react-native";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/design-system";

// 알림 타입
type NotificationType = "like" | "comment" | "follow" | "recipe" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  user?: string;
  avatar?: string;
  content: string;
  time: string;
  read: boolean;
}

// 알림 목데이터
const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    user: "요리왕비룡",
    avatar: "https://i.pravatar.cc/100?img=1",
    content: "님이 회원님의 레시피를 좋아합니다.",
    time: "방금 전",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    user: "맛있는집밥",
    avatar: "https://i.pravatar.cc/100?img=2",
    content: '님이 댓글을 남겼습니다: "이거 진짜 맛있어 보여요!"',
    time: "5분 전",
    read: false,
  },
  {
    id: "3",
    type: "follow",
    user: "자취생요리",
    avatar: "https://i.pravatar.cc/100?img=3",
    content: "님이 회원님을 팔로우하기 시작했습니다.",
    time: "1시간 전",
    read: false,
  },
  {
    id: "4",
    type: "recipe",
    user: "백종원",
    avatar: "https://i.pravatar.cc/100?img=4",
    content: "님이 새 레시피를 올렸습니다.",
    time: "2시간 전",
    read: true,
  },
  {
    id: "5",
    type: "like",
    user: "집밥마스터",
    avatar: "https://i.pravatar.cc/100?img=5",
    content: "님이 회원님의 레시피를 좋아합니다.",
    time: "어제",
    read: true,
  },
  {
    id: "6",
    type: "comment",
    user: "요리초보",
    avatar: "https://i.pravatar.cc/100?img=6",
    content: '님이 댓글을 남겼습니다: "따라해봤는데 성공했어요!"',
    time: "어제",
    read: true,
  },
];

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = { size: 14, color: "#FFF" };
  switch (type) {
    case "like":
      return <Heart {...iconProps} fill="#FFF" />;
    case "comment":
      return <MessageCircle {...iconProps} />;
    case "follow":
      return <UserPlus {...iconProps} />;
    case "recipe":
      return <ChefHat {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

const getIconBackground = (type: NotificationType) => {
  switch (type) {
    case "like":
      return "#FF6B6B";
    case "comment":
      return Colors.primary[500];
    case "follow":
      return "#845EF7";
    case "recipe":
      return "#51CF66";
    default:
      return Colors.neutral[400];
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayNotifications = notifications.filter(
    (n) => n.time.includes("전") || n.time === "방금 전"
  );
  const earlierNotifications = notifications.filter(
    (n) => !n.time.includes("전") && n.time !== "방금 전"
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationPress = (notification: Notification) => {
    // 읽음 처리
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    // TODO: 알림 타입에 따라 해당 화면으로 이동
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(notification)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: notification.read ? "transparent" : Colors.primary[50],
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
        borderRadius: BorderRadius.xl,
      }}
    >
      {/* 아바타 + 타입 아이콘 */}
      <View style={{ position: "relative" }}>
        {notification.avatar ? (
          <Image
            source={{ uri: notification.avatar }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: Colors.neutral[100],
            }}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Bell size={24} color={Colors.neutral[400]} />
          </View>
        )}
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: getIconBackground(notification.type),
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: notification.read ? Colors.neutral[50] : Colors.primary[50],
          }}
        >
          {getNotificationIcon(notification.type)}
        </View>
      </View>

      {/* 내용 */}
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: Colors.neutral[900],
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {notification.user && (
            <Text style={{ fontWeight: "700" }}>{notification.user}</Text>
          )}
          {notification.content}
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.xs,
            color: Colors.neutral[400],
            marginTop: 4,
          }}
        >
          {notification.time}
        </Text>
      </View>

      {/* 읽지 않음 표시 */}
      {!notification.read && (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: Colors.primary[500],
            marginLeft: Spacing.sm,
          }}
        />
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = (title: string) => (
    <View
      style={{
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.xs,
          fontWeight: "600",
          color: Colors.neutral[400],
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
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
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          backgroundColor: Colors.neutral[50],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: Spacing.sm,
              marginLeft: -Spacing.sm,
              borderRadius: BorderRadius.full,
            }}
          >
            <ArrowLeft size={24} color={Colors.neutral[900]} />
          </Pressable>
          <Text
            style={{
              fontSize: Typography.fontSize.xl,
              fontWeight: "800",
              color: Colors.neutral[900],
              marginLeft: Spacing.sm,
            }}
          >
            알림
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.full,
                paddingHorizontal: 10,
                paddingVertical: 3,
                marginLeft: Spacing.sm,
                ...Shadows.xs,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#FFF",
                }}
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: Spacing.xs,
              paddingHorizontal: Spacing.md,
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.full,
            }}
          >
            <Check size={14} color={Colors.neutral[600]} />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[600],
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              모두 읽음
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* 오늘 알림 */}
        {todayNotifications.length > 0 && (
          <>
            {renderSectionHeader("오늘")}
            {todayNotifications.map(renderNotificationItem)}
          </>
        )}

        {/* 이전 알림 */}
        {earlierNotifications.length > 0 && (
          <>
            {renderSectionHeader("이전")}
            {earlierNotifications.map(renderNotificationItem)}
          </>
        )}

        {/* 빈 상태 */}
        {notifications.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 80,
              paddingHorizontal: Spacing.xl,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <Bell size={36} color={Colors.neutral[300]} />
            </View>
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "700",
                color: Colors.neutral[700],
                marginBottom: Spacing.xs,
              }}
            >
              알림이 없어요
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              새로운 소식이 있으면{"\n"}여기에서 알려드릴게요
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
