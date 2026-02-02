import React, { useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Clock,
  Bell,
  ChevronRight,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useShorts, useCurationSections } from "@/hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// YouTube 썸네일 URL 생성 함수
const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

// 쇼츠 카드 아이템 타입
interface ShortsCardItem {
  id: string;
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  views: string;
}

// 쇼츠 카드 컴포넌트 (9:16 비율) - 썸네일과 정보 분리
function ShortsCard({ item, onPress }: { item: ShortsCardItem; onPress: () => void }) {
  const CARD_WIDTH = 120;
  const CARD_HEIGHT = CARD_WIDTH * (16 / 9); // 9:16 비율

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ marginRight: Spacing.md, width: CARD_WIDTH }}
    >
      {/* 썸네일 영역 */}
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: BorderRadius.lg,
          overflow: "hidden",
          backgroundColor: Colors.neutral[900],
        }}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {/* Views Badge */}
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600" }}>
            {item.views}
          </Text>
        </View>
      </View>
      {/* 정보 영역 - 썸네일 하단에 분리 */}
      <View style={{ paddingTop: 8, paddingHorizontal: 2 }}>
        <Text
          style={{
            color: Colors.neutral[900],
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: Colors.neutral[500],
            fontSize: 11,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {item.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// 레시피 카드 컴포넌트 (가로 스크롤용)
function RecipeCard({ item, onPress, size = "medium" }: { item: any; onPress: () => void; size?: "small" | "medium" | "large" }) {
  const cardWidth = size === "large" ? SCREEN_WIDTH * 0.7 : size === "medium" ? 140 : 120;
  const cardHeight = size === "large" ? 200 : size === "medium" ? 180 : 150;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ marginRight: Spacing.md }}
    >
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: BorderRadius.lg,
          overflow: "hidden",
          backgroundColor: Colors.neutral[200],
        }}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {/* Duration Badge */}
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Clock size={10} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "600", marginLeft: 3 }}>
            {item.duration}
          </Text>
        </View>
        {/* Info */}
        <View style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: size === "large" ? 15 : 13,
              fontWeight: "600",
              textShadowColor: "rgba(0,0,0,0.8)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 11,
              marginTop: 2,
              textShadowColor: "rgba(0,0,0,0.8)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {item.author}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// 섹션 헤더 컴포넌트
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.lg,
          fontWeight: Typography.fontWeight.bold,
          color: Colors.neutral[900],
        }}
      >
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>더보기</Text>
          <ChevronRight size={16} color={Colors.neutral[500]} />
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  // hooks에서 데이터 가져오기
  const { shorts, loading: shortsLoading } = useShorts();
  const { sections, loading: sectionsLoading } = useCurationSections();

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleShortsPress = (shortsId: string) => {
    // 쇼츠 전체 화면으로 이동 (시작 인덱스 전달)
    router.push({
      pathname: "/(tabs)/shorts",
      params: { startIndex: shortsId },
    });
  };

  const handleSeeAllShorts = () => {
    router.push("/(tabs)/shorts");
  };

  const handleSearch = () => {
    router.push("/search");
  };

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleSeeAllSection = (sectionId: string) => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: { section: sectionId },
    });
  };

  const handleSeeAllTrending = () => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: { section: "trending" },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle="dark-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: 100 }}
      >
        {/* 로딩 상태 */}
        {(shortsLoading || sectionsLoading) && (
          <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={{ marginTop: Spacing.md, color: Colors.neutral[500] }}>
              로딩 중...
            </Text>
          </View>
        )}

        {/* 데이터가 없을 때 */}
        {!shortsLoading && !sectionsLoading && shorts.length === 0 && sections.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
            <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: "600", color: Colors.neutral[500] }}>
              콘텐츠가 없습니다
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[400], marginTop: Spacing.xs }}>
              서버 연결을 확인해주세요
            </Text>
          </View>
        )}

        {/* 🎬 쇼츠 섹션 - 최상단 */}
        {shorts.length > 0 && (
          <>
            <SectionHeader title="🎬 오늘의 쇼츠" onSeeAll={handleSeeAllShorts} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
            >
              {shorts.map((item) => (
                <ShortsCard
                  key={item.id}
                  item={{
                    id: item.id,
                    videoId: item.videoId,
                    title: item.title,
                    author: item.author,
                    thumbnail: item.thumbnail || getYoutubeThumbnail(item.videoId),
                    views: item.views || "0",
                  }}
                  onPress={() => handleShortsPress(item.id)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* 큐레이션 섹션들 */}
        {sections.map((section) => (
          <View key={section.id}>
            <SectionHeader title={section.title} onSeeAll={() => handleSeeAllSection(section.id)} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
            >
              {section.recipes?.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  item={recipe}
                  onPress={() => handleRecipePress(recipe.id)}
                  size="medium"
                />
              ))}
            </ScrollView>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Fixed Header - rendered after ScrollView to receive touch events */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: Colors.neutral[50],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: Colors.primary[500],
            }}
          >
            숏끼
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable
            style={{ padding: 8 }}
            onPress={() => {
              console.log("Search pressed");
              router.push("/search");
            }}
          >
            <Search size={24} color={Colors.neutral[700]} />
          </Pressable>
          <Pressable
            style={{ padding: 8 }}
            onPress={() => {
              console.log("Notifications pressed");
              router.push("/notifications");
            }}
          >
            <Bell size={24} color={Colors.neutral[700]} />
            {/* Notification badge */}
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
          </Pressable>
        </View>
      </View>
    </View>
  );
}
