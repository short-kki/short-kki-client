import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  SectionList,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Bell,
  ChevronRight,
  Bookmark,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows, SemanticColors } from "@/constants/design-system";
import { useRecommendedCurations } from "@/hooks";
import type { CurationSection } from "@/data/mock";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

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
  bookmarks?: number;
  creatorName?: string;
}

function formatBookmarkCount(count?: number) {
  if (!count) return "0";
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return `${count}`;
}

function YouTubeBadge({ creatorName }: { creatorName?: string }) {
  if (!creatorName) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        maxWidth: 110,
        overflow: "hidden",
        ...Shadows.xs,
      }}
    >
      <View
        style={{
          width: 18,
          height: 12,
          borderRadius: 3,
          backgroundColor: "#FF0000",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 6,
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 24 24">
          <Path d="M8 6.5l10 5.5-10 5.5z" fill="#FFFFFF" />
        </Svg>
      </View>
      <Text
        style={{ fontSize: 11, fontWeight: "600", color: Colors.neutral[800], flexShrink: 1 }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {creatorName}
      </Text>
    </View>
  );
}

const TopRankCard = React.memo(function TopRankCard({
  item,
  rank,
  onPress,
}: {
  item: ShortsCardItem;
  rank: number;
  onPress: () => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const CARD_WIDTH = Math.min(220, Math.max(170, Math.round(screenWidth * 0.55)));
  const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.42);
  const titleLineHeight = 20;
  const rankLineHeight = 40;
  const gradientId = `topCardOverlay-${item.id}`;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ marginRight: Spacing.md, width: CARD_WIDTH }}
    >
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: BorderRadius.lg,
            overflow: "hidden",
            backgroundColor: Colors.neutral[900],
            renderToHardwareTextureAndroid: true,
            shouldRasterizeIOS: true,
          }}
        >
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          contentPosition="center"
        />
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
              <Stop offset="0.8" stopColor="#000000" stopOpacity="0.25" />
              <Stop offset="1" stopColor="#000000" stopOpacity="0.55" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
        <View
          style={{
            position: "absolute",
            left: 12,
            bottom: 10,
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "900",
              color: "#FFFFFF",
              lineHeight: rankLineHeight,
              textShadowColor: "rgba(0,0,0,0.7)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 3,
            }}
            includeFontPadding={false}
          >
            {rank}
          </Text>
          <View
            style={{
              marginLeft: 10,
              maxWidth: Math.max(80, Math.round(CARD_WIDTH * 0.6)),
              height: rankLineHeight,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
                lineHeight: titleLineHeight,
                textShadowColor: "rgba(0,0,0,0.7)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
              includeFontPadding={false}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 통일 카드 컴포넌트
const ShortsCard = React.memo(function ShortsCard({ item, onPress }: { item: ShortsCardItem; onPress: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
  const CARD_WIDTH = Math.min(190, Math.max(150, Math.round(screenWidth * 0.48)));
  const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9));
  const topGradientId = `cardOverlayTop-${item.id}`;
  const bottomGradientId = `cardOverlayBottom-${item.id}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{ marginRight: Spacing.md, width: CARD_WIDTH }}
    >
      <View
        style={{
          width: CARD_WIDTH,
          borderRadius: BorderRadius.md,
          backgroundColor: Colors.neutral[0],
          ...Shadows.xs,
          renderToHardwareTextureAndroid: true,
          shouldRasterizeIOS: true,
        }}
      >
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: Colors.neutral[200],
            borderRadius: BorderRadius.md,
            overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            contentPosition="center"
          />
          <Svg
            width="100%"
            height="30%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, right: 0, top: 0 }}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient id={topGradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity="0.35" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="-1" y="-1" width="102%" height="102%" fill={`url(#${topGradientId})`} />
          </Svg>
          <YouTubeBadge creatorName={item.creatorName} />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: Math.round(CARD_HEIGHT * 0.35),
              justifyContent: "flex-end",
              borderBottomLeftRadius: BorderRadius.md,
              borderBottomRightRadius: BorderRadius.md,
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient id={bottomGradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.4" stopColor="#000000" stopOpacity="0" />
                  <Stop offset="0.7" stopColor="#000000" stopOpacity="0.45" />
                  <Stop offset="1" stopColor="#000000" stopOpacity="0.8" />
                </LinearGradient>
              </Defs>
              <Rect x="-1" y="-1" width="102%" height="102%" fill={`url(#${bottomGradientId})`} />
            </Svg>
            <View style={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <Bookmark size={12} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontSize: 12, marginLeft: 4 }}>
                  {formatBookmarkCount(item.bookmarks)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 레시피 카드 컴포넌트 (가로 스크롤용)
const RecipeCard = React.memo(function RecipeCard({ item, onPress, size = "medium" }: { item: any; onPress: () => void; size?: "small" | "medium" | "large" }) {
  void size;
  return (
    <ShortsCard
      item={{
        id: item.id,
        videoId: item.videoId ?? item.id,
        title: item.title,
        author: item.author,
        thumbnail: item.thumbnail,
        views: item.views ?? "0",
        bookmarks: item.bookmarks,
        creatorName: item.creatorName,
      }}
      onPress={onPress}
    />
  );
});

// 섹션 헤더 컴포넌트
const SectionHeader = React.memo(function SectionHeader({
  title,
  description,
  onSeeAll,
}: {
  title: string;
  description?: string;
  onSeeAll?: () => void;
}) {
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
      <View style={{ flex: 1, paddingRight: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: Typography.fontWeight.bold,
            color: Colors.neutral[900],
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        {description && (
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: Colors.neutral[500],
            }}
          >
            {description}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.neutral[100],
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: BorderRadius.full,
          }}
        >
          <Text style={{ fontSize: 12, color: Colors.neutral[600], fontWeight: "600" }}>더보기</Text>
          <ChevronRight size={16} color={Colors.neutral[600]} />
        </Pressable>
      )}
    </View>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const FILTER_BAR_HEIGHT = 44;
  const HEADER_BAR_HEIGHT = 48;
  const [headerHeight, setHeaderHeight] = useState(
    insets.top + HEADER_BAR_HEIGHT + FILTER_BAR_HEIGHT
  );
  const headerTranslate = Animated.diffClamp(scrollY, 0, headerHeight);
  const logoSize = Math.min(52, Math.max(40, Math.round(screenWidth * 0.12)));

  // hooks에서 데이터 가져오기
  const {
    topRecipes,
    topCuration,
    sections,
    loading,
    loadingMore,
    hasNext,
    fetchNextPage,
    refetch,
  } = useRecommendedCurations();

  const handleRecipePress = (recipeId: string, section: CurationSection) => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: {
        startIndex: recipeId,
        curationId: section.id,
        curationRecipes: JSON.stringify(section.recipes ?? []),
      },
    });
  };

  const handleShortsPress = (shortsId: string) => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: { startIndex: shortsId },
    });
  };

  const handleTopCurationPress = (shortsId: string) => {
    if (!topCuration) {
      handleShortsPress(shortsId);
      return;
    }
    router.push({
      pathname: "/(tabs)/shorts",
      params: {
        startIndex: shortsId,
        curationId: topCuration.id,
        curationRecipes: JSON.stringify(topCuration.recipes ?? []),
      },
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

  const FILTERS = ["전체", "한식", "양식", "일식", "디저트", "안주"];
  const AnimatedSectionList = useRef(Animated.createAnimatedComponent(SectionList)).current;
  const curationSections = sections.map((section) => ({
    ...section,
    data: [section],
  }));
  const topShorts = useMemo(
    () =>
      topRecipes.slice(0, 5).map((item, index) => ({
        key: item.id,
        rank: index + 1,
        item: {
          id: item.id,
          videoId: item.videoId,
          title: item.title,
          author: item.author,
          thumbnail: item.thumbnail || getYoutubeThumbnail(item.videoId),
          views: item.views || "0",
          creatorName: item.creatorName,
          bookmarks: item.bookmarks,
        },
      })),
    [topRecipes]
  );

  return (
    <View style={{ flex: 1, backgroundColor: SemanticColors.backgroundSecondary }}>
      <StatusBar barStyle="dark-content" />

      <AnimatedSectionList
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setIsRefreshing(false);
              }
            }}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
            progressViewOffset={headerHeight + Spacing.sm}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.sm,
          paddingBottom: 16,
        }}
        sections={curationSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: Spacing.base }}>
            <SectionHeader
              title={section.title.trim().startsWith("#") ? section.title : `# ${section.title}`}
              description={section.description}
              onSeeAll={() => handleSeeAllSection(section.id)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              removeClippedSubviews
              contentContainerStyle={{ paddingLeft: Spacing.xl, paddingRight: Spacing.sm, paddingBottom: Spacing.sm }}
            >
              {section.recipes?.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  item={recipe}
                  onPress={() => handleRecipePress(recipe.id, section)}
                  size="medium"
                />
              ))}
            </ScrollView>
          </View>
        )}
        ListHeaderComponent={
          <View>
            {/* 로딩 상태 */}
            {loading && !isRefreshing && (
              <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
                <Text style={{ marginTop: Spacing.md, color: Colors.neutral[500] }}>
                  로딩 중...
                </Text>
              </View>
            )}

            {/* 데이터가 없을 때 */}
            {!loading && !isRefreshing && topRecipes.length === 0 && sections.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
                <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: "600", color: Colors.neutral[500] }}>
                  콘텐츠가 없습니다
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[400], marginTop: Spacing.xs }}>
                  서버 연결을 확인해주세요
                </Text>
              </View>
            )}

            {/* TOP 레시피 랭킹 */}
            {topRecipes.length > 0 && (
              <View style={{ paddingTop: Spacing.base, paddingBottom: Spacing.lg }}>
                <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.base }}>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: Colors.neutral[900], letterSpacing: -0.4 }}>
                    TOP 레시피
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.neutral[600], marginTop: 2 }}>
                    가장 많이 저장된 레시피
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  removeClippedSubviews
                  contentContainerStyle={{ paddingLeft: Spacing.xl, paddingRight: Spacing.sm, paddingBottom: Spacing.sm }}
                >
                  {topShorts.map(({ key, item, rank }) => (
                    <TopRankCard
                      key={key}
                      item={item}
                      rank={rank}
                      onPress={() => handleTopCurationPress(item.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        }
        onEndReached={() => {
          if (hasNext && !loadingMore) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: Spacing.lg }}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
          ) : null
        }
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        updateCellsBatchingPeriod={50}
      >
      </AnimatedSectionList>

      {/* Fixed Header - rendered after ScrollView to receive touch events */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && h !== headerHeight) setHeaderHeight(h);
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: SemanticColors.backgroundSecondary,
          transform: [{ translateY: Animated.multiply(headerTranslate, -1) }],
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
          <Image
            source={require("@/assets/images/icon_resized.png")}
            style={{ width: logoSize, height: logoSize }}
            contentFit="contain"
          />
          <View style={{ flex: 1 }} />
          <Pressable
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.neutral[100],
              marginRight: 6,
            }}
            onPress={() => {
              console.log("Search pressed");
              router.push("/search");
            }}
          >
            <Search size={24} color={Colors.neutral[700]} />
          </Pressable>
          <Pressable
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.neutral[100],
            }}
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
        <View style={{ height: FILTER_BAR_HEIGHT }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: Spacing.xl,
              paddingRight: Spacing.sm,
              alignItems: "center",
              height: FILTER_BAR_HEIGHT,
            }}
          >
            {FILTERS.map((label) => {
              const isSelected = selectedFilter === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => setSelectedFilter(label)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: isSelected ? Colors.neutral[900] : Colors.neutral[100],
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isSelected ? "#FFF" : Colors.neutral[700],
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={{ height: 1, backgroundColor: Colors.neutral[100] }} />
      </Animated.View>
    </View>
  );
}
