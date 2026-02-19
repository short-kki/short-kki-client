import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Users,
  UserPlus,
  ChefHat,
  Bell,
  Check,
  Calendar,
  MessageCircle,
  FileText,
  Import,
} from "lucide-react-native";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/design-system";
import {
  useNotifications,
  useUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from "@/hooks";

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = { size: 14, color: "#FFF" };
  switch (type) {
    case "GROUP_INVITE":
      return <Users {...iconProps} />;
    case "GROUP_MEMBER_JOINED":
      return <UserPlus {...iconProps} />;
    case "RECIPE_SHARED":
      return <ChefHat {...iconProps} />;
    case "RECIPE_IMPORT_COMPLETED":
      return <Import {...iconProps} />;
    case "CALENDAR_UPDATE":
      return <Calendar {...iconProps} />;
    case "COMMENT_ADDED":
      return <MessageCircle {...iconProps} />;
    case "FEED_ADDED":
      return <FileText {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

const getIconBackground = (type: NotificationType) => {
  switch (type) {
    case "GROUP_INVITE":
      return "#845EF7";
    case "GROUP_MEMBER_JOINED":
      return "#51CF66";
    case "RECIPE_SHARED":
      return Colors.primary[500];
    case "RECIPE_IMPORT_COMPLETED":
      return "#339AF0";
    case "CALENDAR_UPDATE":
      return "#FF6B6B";
    case "COMMENT_ADDED":
      return "#20C997";
    case "FEED_ADDED":
      return "#FAB005";
    default:
      return Colors.neutral[400];
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    notifications,
    loading,
    hasNext,
    loadingMore,
    fetchNextPage,
    refetch,
    setNotifications,
  } = useNotifications();
  const { count: unreadCount, refetch: refetchUnreadCount, setCount: setUnreadCount } = useUnreadNotificationCount();

  const todayNotifications = notifications.filter(
    (n) => n.time.includes("전") || n.time === "방금 전"
  );
  const earlierNotifications = notifications.filter(
    (n) => !n.time.includes("전") && n.time !== "방금 전"
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      // 로컬 상태 업데이트
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [setNotifications, setUnreadCount]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // 읽음 처리
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // 알림 타입에 따라 해당 화면으로 이동
    switch (notification.type) {
      case "GROUP_INVITE":
      case "GROUP_MEMBER_JOINED":
      case "CALENDAR_UPDATE":
        router.push(`/group-detail?id=${notification.targetId}`);
        break;
      case "RECIPE_SHARED":
      case "RECIPE_IMPORT_COMPLETED":
        router.push(`/recipe/${notification.targetId}`);
        break;
      case "COMMENT_ADDED":
      case "FEED_ADDED":
        // 피드 상세로 이동 (그룹 피드)
        const groupId = notification.payload?.groupId;
        if (groupId) {
          router.push(`/group-detail?id=${groupId}`);
        }
        break;
    }
  }, [router, setNotifications, setUnreadCount]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    refetchUnreadCount();
  }, [refetch, refetchUnreadCount]);

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
        backgroundColor: notification.isRead ? "transparent" : Colors.primary[50],
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.xs,
        borderRadius: BorderRadius.xl,
      }}
    >
      {/* 아이콘 */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: getIconBackground(notification.type),
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {getNotificationIcon(notification.type)}
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
      {!notification.isRead && (
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

      {/* 로딩 상태 */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
              tintColor={Colors.primary[500]}
              colors={[Colors.primary[500]]}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isEndReached =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
            if (isEndReached && hasNext && !loadingMore) {
              fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
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

          {/* 더 불러오는 중 */}
          {loadingMore && (
            <View style={{ paddingVertical: Spacing.lg, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
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
      )}
    </View>
  );
}
