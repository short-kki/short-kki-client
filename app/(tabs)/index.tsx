import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import {
  Search,
  Clock,
  Bell,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// YouTube 썸네일 URL 생성 함수
const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

// 쇼츠 데이터
const SHORTS_DATA = [
  {
    id: "1",
    videoId: "DkyZ9t12hpo",
    videoUrl: "https://www.youtube.com/shorts/DkyZ9t12hpo",
    title: "초간단 계란 볶음밥",
    author: "백종원",
    thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"),
    views: "152만",
  },
  {
    id: "2",
    videoId: "NnhIbr5lmEg",
    videoUrl: "https://www.youtube.com/shorts/NnhIbr5lmEg",
    title: "편스토랑 류수영의 꿀팁",
    author: "KBS",
    thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"),
    views: "89만",
  },
  {
    id: "3",
    videoId: "ZPFVC78A2jM",
    videoUrl: "https://www.youtube.com/shorts/ZPFVC78A2jM",
    title: "한국인이 좋아하는 속도",
    author: "뚝딱이형",
    thumbnail: getYoutubeThumbnail("ZPFVC78A2jM"),
    views: "228만",
  },
  {
    id: "4",
    videoId: "gQDByCdjUXw",
    videoUrl: "https://www.youtube.com/shorts/gQDByCdjUXw",
    title: "마약 옥수수 만들기",
    author: "요리왕비룡",
    thumbnail: getYoutubeThumbnail("gQDByCdjUXw"),
    views: "56만",
  },
  {
    id: "5",
    videoId: "oc1bnLR38fE",
    videoUrl: "https://www.youtube.com/shorts/oc1bnLR38fE",
    title: "크림파스타 황금레시피",
    author: "자취생요리",
    thumbnail: getYoutubeThumbnail("oc1bnLR38fE"),
    views: "183만",
  },
];

// 큐레이션 섹션 데이터 - 인기 급상승은 레시피 형태, 나머지는 숏폼 형태
const TRENDING_RECIPES = [
  { id: "t1", title: "마약계란장", thumbnail: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400", duration: "10분", author: "요리왕" },
  { id: "t2", title: "크림파스타", thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", duration: "20분", author: "파스타킹" },
  { id: "t3", title: "김치볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "10분", author: "백종원" },
  { id: "t4", title: "된장찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "25분", author: "집밥선생" },
];

// 숏폼 큐레이션 섹션 데이터
const SHORTS_CURATION_SECTIONS = [
  {
    id: "quick",
    title: "⏱️ 5분 안에 뚝딱",
    items: [
      { id: "q1", videoId: "DkyZ9t12hpo", title: "계란후라이 덮밥", thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"), author: "간편요리", views: "45만" },
      { id: "q2", videoId: "NnhIbr5lmEg", title: "참치마요 주먹밥", thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"), author: "도시락왕", views: "32만" },
      { id: "q3", videoId: "ZPFVC78A2jM", title: "토스트 샌드위치", thumbnail: getYoutubeThumbnail("ZPFVC78A2jM"), author: "아침식사", views: "28만" },
      { id: "q4", videoId: "gQDByCdjUXw", title: "컵라면 업그레이드", thumbnail: getYoutubeThumbnail("gQDByCdjUXw"), author: "라면마스터", views: "67만" },
    ],
  },
  {
    id: "single",
    title: "🏠 자취생 필수 레시피",
    items: [
      { id: "s1", videoId: "oc1bnLR38fE", title: "원팬 파스타", thumbnail: getYoutubeThumbnail("oc1bnLR38fE"), author: "자취생", views: "183만" },
      { id: "s2", videoId: "DkyZ9t12hpo", title: "간장계란밥", thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"), author: "혼밥러", views: "92만" },
      { id: "s3", videoId: "NnhIbr5lmEg", title: "참치김치찌개", thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"), author: "자취요리", views: "54만" },
      { id: "s4", videoId: "ZPFVC78A2jM", title: "스팸마요덮밥", thumbnail: getYoutubeThumbnail("ZPFVC78A2jM"), author: "덮밥맛집", views: "127만" },
    ],
  },
  {
    id: "healthy",
    title: "🥗 건강한 한 끼",
    items: [
      { id: "hl1", videoId: "gQDByCdjUXw", title: "닭가슴살 샐러드", thumbnail: getYoutubeThumbnail("gQDByCdjUXw"), author: "헬시쿡", views: "76만" },
      { id: "hl2", videoId: "oc1bnLR38fE", title: "연어 포케볼", thumbnail: getYoutubeThumbnail("oc1bnLR38fE"), author: "다이어터", views: "41만" },
      { id: "hl3", videoId: "DkyZ9t12hpo", title: "두부 스테이크", thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"), author: "비건요리", views: "38만" },
      { id: "hl4", videoId: "NnhIbr5lmEg", title: "오트밀 죽", thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"), author: "아침메뉴", views: "29만" },
    ],
  },
];

// 쇼츠 카드 컴포넌트 (9:16 비율) - 썸네일과 정보 분리
function ShortsCard({ item, onPress }: { item: typeof SHORTS_DATA[0]; onPress: () => void }) {
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
        {/* 🎬 쇼츠 섹션 - 최상단 */}
        <SectionHeader title="🎬 오늘의 쇼츠" onSeeAll={handleSeeAllShorts} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
        >
          {SHORTS_DATA.map((shorts) => (
            <ShortsCard
              key={shorts.id}
              item={shorts}
              onPress={() => handleShortsPress(shorts.id)}
            />
          ))}
        </ScrollView>

        {/* 🔥 인기 급상승 섹션 - 레시피 카드 형태, 클릭 시 레시피 상세로 이동 */}
        <SectionHeader title="🔥 인기 급상승" onSeeAll={handleSeeAllTrending} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
        >
          {TRENDING_RECIPES.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              item={recipe}
              onPress={() => handleRecipePress(recipe.id)}
              size="large"
            />
          ))}
        </ScrollView>

        {/* 숏폼 큐레이션 섹션들 */}
        {SHORTS_CURATION_SECTIONS.map((section) => (
          <View key={section.id}>
            <SectionHeader title={section.title} onSeeAll={() => handleSeeAllSection(section.id)} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
            >
              {section.items.map((item) => (
                <ShortsCard
                  key={item.id}
                  item={item}
                  onPress={() => handleShortsPress(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        ))}

        {/* Continue Watching Style Section */}
        <SectionHeader title="📺 이어서 보기" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
        >
          {TRENDING_RECIPES.slice(0, 3).map((recipe, index) => (
            <TouchableOpacity
              key={recipe.id}
              onPress={() => handleRecipePress(recipe.id)}
              activeOpacity={0.8}
              style={{ marginRight: Spacing.md }}
            >
              <View
                style={{
                  width: 160,
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.lg,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: Colors.neutral[100],
                }}
              >
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: recipe.thumbnail }}
                    style={{ width: 160, height: 90 }}
                    contentFit="cover"
                  />
                  {/* Progress Bar */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: "rgba(0,0,0,0.3)",
                    }}
                  >
                    <View
                      style={{
                        width: `${30 + index * 25}%`,
                        height: "100%",
                        backgroundColor: Colors.primary[500],
                      }}
                    />
                  </View>
                </View>
                <View style={{ padding: Spacing.sm }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: Colors.neutral[900] }}
                    numberOfLines={1}
                  >
                    {recipe.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.neutral[500], marginTop: 2 }}>
                    {recipe.author}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
