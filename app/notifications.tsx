import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
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
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 알림 목데이터
const NOTIFICATIONS = [
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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "like":
      return <Heart size={16} color="#FFF" fill="#FFF" />;
    case "comment":
      return <MessageCircle size={16} color="#FFF" />;
    case "follow":
      return <UserPlus size={16} color="#FFF" />;
    case "recipe":
      return <ChefHat size={16} color="#FFF" />;
    default:
      return <Bell size={16} color="#FFF" />;
  }
};

const getIconBackground = (type: string) => {
  switch (type) {
    case "like":
      return Colors.error.main;
    case "comment":
      return Colors.info.main;
    case "follow":
      return Colors.primary[500];
    case "recipe":
      return Colors.success.main;
    default:
      return Colors.neutral[500];
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

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
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
          >
            알림
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#FFF",
                }}
              >
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Text
            style={{
              fontSize: 14,
              color: Colors.primary[500],
              fontWeight: "600",
            }}
          >
            모두 읽음
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {NOTIFICATIONS.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: notification.read
                ? "transparent"
                : Colors.primary[50],
              borderBottomWidth: 1,
              borderBottomColor: Colors.neutral[100],
            }}
          >
            {/* 아바타 + 아이콘 */}
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: notification.avatar }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                }}
              />
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
                  borderColor: Colors.neutral[50],
                }}
              >
                {getNotificationIcon(notification.type)}
              </View>
            </View>

            {/* 내용 */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.neutral[900],
                  lineHeight: 20,
                }}
              >
                <Text style={{ fontWeight: "700" }}>{notification.user}</Text>
                {notification.content}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.neutral[500],
                  marginTop: 2,
                }}
              >
                {notification.time}
              </Text>
            </View>

            {/* 읽지 않음 표시 */}
            {!notification.read && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary[500],
                }}
              />
            )}
          </TouchableOpacity>
        ))}

        {/* 빈 상태 */}
        {NOTIFICATIONS.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 60,
            }}
          >
            <Bell size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginTop: 12,
              }}
            >
              알림이 없어요
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
