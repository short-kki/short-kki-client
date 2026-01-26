import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  Heart,
  Bookmark,
  ChefHat,
  LogOut,
  Bell,
  Grid3X3,
  List,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

const stats = [
  { label: "레시피", value: 12 },
  { label: "팔로워", value: 234 },
  { label: "팔로잉", value: 89 },
];

const myRecipes = [
  {
    id: "1",
    title: "마약토스트",
    likes: 156,
    thumbnail: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
  },
  {
    id: "2",
    title: "계란볶음밥",
    likes: 89,
    thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
  },
  {
    id: "3",
    title: "원팬파스타",
    likes: 234,
    thumbnail: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400",
  },
  {
    id: "4",
    title: "김치찌개",
    likes: 312,
    thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400",
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "숏끼에서 요리조리님의 프로필을 확인해보세요!",
        url: "https://shortkki.com/profile/요리조리",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleProfileEdit = () => {
    router.push("/profile-edit");
  };

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleLikes = () => {
    // 좋아요한 레시피 목록으로 이동
    router.push("/(tabs)/recipe-book");
  };

  const handleSaved = () => {
    // 저장한 레시피 목록으로 이동
    router.push("/(tabs)/recipe-book");
  };

  const handleQueue = () => {
    // 큐(나중에 볼 레시피)로 이동
    router.push("/(tabs)/recipe-book");
  };

  // 사용자 정보 표시 (로그인된 경우 실제 정보, 아니면 기본값)
  const displayName = user?.name || "요리조리";
  const profileImage = user?.profileImage || "https://i.pravatar.cc/200?img=10";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize["2xl"],
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            프로필
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              onPress={handleNotifications}
              activeOpacity={0.7}
              style={{ padding: 8 }}
            >
              <Bell size={24} color={Colors.neutral[900]} />
              {/* 알림 배지 */}
              <View
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: Colors.primary[500],
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              style={{ padding: 8 }}
            >
              <LogOut size={24} color={Colors.error.main} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSettings}
              activeOpacity={0.7}
              style={{ padding: 8 }}
            >
              <Settings size={24} color={Colors.neutral[900]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: "hidden",
              marginBottom: Spacing.md,
              borderWidth: 3,
              borderColor: Colors.primary[500],
            }}
          >
            <Image
              source={{ uri: profileImage }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <Text
            style={{
              fontSize: Typography.fontSize.xl,
              fontWeight: "700",
              color: Colors.neutral[900],
              marginBottom: 4,
            }}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.neutral[500],
              marginBottom: Spacing.md,
            }}
          >
            {user?.email || "자취 5년차 집밥 마스터"}
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: Spacing["3xl"] }}>
            {stats.map((stat, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                style={{ alignItems: "center" }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.xl,
                    fontWeight: "700",
                    color: Colors.neutral[900],
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.neutral[500],
                  }}
                >
                  {stat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: Spacing.lg,
            gap: Spacing.md,
            marginBottom: Spacing.lg,
          }}
        >
          <TouchableOpacity
            onPress={handleProfileEdit}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.xl,
              alignItems: "center",
              backgroundColor: Colors.primary[500],
            }}
          >
            <Text
              style={{
                color: "#FFF",
                fontWeight: "700",
                fontSize: Typography.fontSize.base,
              }}
            >
              프로필 편집
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            style={{
              flex: 1,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.xl,
              alignItems: "center",
              backgroundColor: Colors.neutral[0],
              borderWidth: 1,
              borderColor: Colors.neutral[200],
            }}
          >
            <Text
              style={{
                color: Colors.neutral[900],
                fontWeight: "700",
                fontSize: Typography.fontSize.base,
              }}
            >
              공유
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: Spacing.lg,
            marginBottom: Spacing.xl,
            gap: Spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={handleLikes}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.md,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Heart size={24} color={Colors.primary[500]} />
            <Text
              style={{
                color: Colors.neutral[900],
                fontWeight: "600",
                marginTop: Spacing.xs,
              }}
            >
              좋아요
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaved}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.md,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Bookmark size={24} color={Colors.primary[500]} />
            <Text
              style={{
                color: Colors.neutral[900],
                fontWeight: "600",
                marginTop: Spacing.xs,
              }}
            >
              저장됨
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleQueue}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.md,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <ChefHat size={24} color={Colors.primary[500]} />
            <Text
              style={{
                color: Colors.neutral[900],
                fontWeight: "600",
                marginTop: Spacing.xs,
              }}
            >
              큐
            </Text>
          </TouchableOpacity>
        </View>

        {/* My Recipes Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: Spacing.lg,
            marginBottom: Spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.lg,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            내 레시피
          </Text>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
              style={{
                padding: 8,
                backgroundColor:
                  viewMode === "grid" ? Colors.neutral[200] : "transparent",
                borderRadius: BorderRadius.md,
              }}
            >
              <Grid3X3
                size={20}
                color={
                  viewMode === "grid"
                    ? Colors.neutral[900]
                    : Colors.neutral[400]
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
              style={{
                padding: 8,
                backgroundColor:
                  viewMode === "list" ? Colors.neutral[200] : "transparent",
                borderRadius: BorderRadius.md,
              }}
            >
              <List
                size={20}
                color={
                  viewMode === "list"
                    ? Colors.neutral[900]
                    : Colors.neutral[400]
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Recipes Grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: Spacing.lg,
            gap: Spacing.sm,
          }}
        >
          {myRecipes.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => handleRecipePress(recipe.id)}
              activeOpacity={0.8}
              style={{
                width: viewMode === "grid" ? "48%" : "100%",
                aspectRatio: viewMode === "grid" ? 3 / 4 : 16 / 9,
                borderRadius: BorderRadius.xl,
                overflow: "hidden",
              }}
            >
              <Image
                source={{ uri: recipe.thumbnail }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: Spacing.sm,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                }}
              >
                <Text
                  style={{
                    color: "#FFF",
                    fontWeight: "700",
                    fontSize: Typography.fontSize.sm,
                    textShadowColor: "rgba(0,0,0,0.8)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {recipe.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 2,
                  }}
                >
                  <Heart size={12} color="#FFF" fill="#FFF" />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: Typography.fontSize.xs,
                      marginLeft: 4,
                    }}
                  >
                    {recipe.likes}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}
