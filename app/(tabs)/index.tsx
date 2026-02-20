import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Search,
  Bell,
  ChevronRight,
  Bookmark,
  User,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows, SemanticColors } from "@/constants/design-system";
import { useRecommendedCurations, useUnreadNotificationCount } from "@/hooks";
import { FeedbackToast, useFeedbackToast } from "@/components/ui/FeedbackToast";
import type { CurationSection } from "@/data/mock";
import Svg, { Path } from "react-native-svg";

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
  cardWidth,
  onPress,
}: {
  item: ShortsCardItem;
  rank: number;
  cardWidth: number;
  onPress: () => void;
}) {
  const CARD_WIDTH = cardWidth;
  const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.42);
  const titleLineHeight = 20;
  const rankLineHeight = 40;
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
          }}
        >
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          contentPosition="center"
          recyclingKey={item.id}
          cachePolicy="memory-disk"
        />
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 80,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
          pointerEvents="none"
        />
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
const ShortsCard = React.memo(function ShortsCard({ item, onPress, cardWidth }: { item: ShortsCardItem; onPress: () => void; cardWidth: number }) {
  const CARD_WIDTH = cardWidth;
  const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9));

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
            recyclingKey={item.id}
            cachePolicy="memory-disk"
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: "30%",
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
            pointerEvents="none"
          />
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
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
              pointerEvents="none"
            />
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
const RecipeCard = React.memo(function RecipeCard({ item, onPress, cardWidth }: { item: any; onPress: () => void; cardWidth: number }) {
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
      cardWidth={cardWidth}
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
          numberOfLines={1}
          adjustsFontSizeToFit
          {...(Platform.OS === 'ios' && { minimumFontScale: 0.7 })}
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

// 큐레이션 섹션 행 컴포넌트 (renderItem에서 사용)
const CurationSectionRow = React.memo(function CurationSectionRow({
  section,
  cardWidth,
  onRecipePress,
  onSeeAll,
}: {
  section: CurationSection;
  cardWidth: number;
  onRecipePress: (recipeId: string, section: CurationSection) => void;
  onSeeAll: (sectionId: string, sectionTitle: string) => void;
}) {
  return (
    <View style={{ marginBottom: Spacing.base }}>
      <SectionHeader
        title={section.title.trim().startsWith("#") ? section.title : `# ${section.title}`}
        description={section.description}
        onSeeAll={() => onSeeAll(section.id, section.title)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: Spacing.xl, paddingRight: Spacing.sm, paddingBottom: Spacing.sm }}
      >
        {section.recipes?.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            item={recipe}
            onPress={() => onRecipePress(recipe.id, section)}
            cardWidth={cardWidth}
          />
        ))}
      </ScrollView>
    </View>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } = useFeedbackToast(2500);
  const lastHandledToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    if (lastHandledToastRef.current === toast) return;
    lastHandledToastRef.current = toast;
    showToast(toast);
  }, [toast, showToast]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const logoSize = Math.min(52, Math.max(40, Math.round(screenWidth * 0.12)));
  const topCardWidth = Math.min(220, Math.max(170, Math.round(screenWidth * 0.55)));
  const shortsCardWidth = Math.min(190, Math.max(150, Math.round(screenWidth * 0.48)));
  const FILTER_BAR_HEIGHT = 44;
  const HEADER_BAR_HEIGHT = logoSize + Spacing.sm * 2; // logo + paddingVertical
  const SEPARATOR_HEIGHT = 1;
  const [headerHeight, setHeaderHeight] = useState(
    insets.top + HEADER_BAR_HEIGHT + FILTER_BAR_HEIGHT + SEPARATOR_HEIGHT
  );

  // 커스텀 리프레시 인디케이터 (YouTube 스타일)
  const REFRESH_INDICATOR_SIZE = 36;
  const PULL_THRESHOLD = 80; // 당기는 임계값

  // 당기는 거리에 따른 인디케이터 진행률 (0~1)
  const pullProgress = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // 인디케이터 scale (당길수록 커짐)
  const indicatorScale = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD, -PULL_THRESHOLD * 0.3, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });

  // 인디케이터 위치 (당길수록 내려옴)
  const indicatorTranslateY = scrollY.interpolate({
    inputRange: [-PULL_THRESHOLD * 1.5, -PULL_THRESHOLD, 0],
    outputRange: [PULL_THRESHOLD * 0.8, PULL_THRESHOLD * 0.5, 0],
    extrapolate: 'clamp',
  });

  // iOS 바운스 시 scrollY가 음수가 되면 diffClamp가 오동작하므로 0 이하를 클램프
  const clampedScrollY = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
  });
  const headerTranslate = Animated.diffClamp(clampedScrollY, 0, headerHeight);

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

  // 읽지 않은 알림 수 조회
  const { count: unreadNotificationCount } = useUnreadNotificationCount();

  const handleRecipePress = useCallback((recipeId: string, section: CurationSection) => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: {
        startIndex: recipeId,
        curationId: section.id,
        curationRecipes: JSON.stringify(section.recipes ?? []),
      },
    });
  }, [router]);

  const handleShortsPress = useCallback((shortsId: string) => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: { startIndex: shortsId },
    });
  }, [router]);

  const handleTopCurationPress = useCallback((shortsId: string) => {
    if (!topCuration) {
      router.push({
        pathname: "/(tabs)/shorts",
        params: { startIndex: shortsId },
      });
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
  }, [router, topCuration]);

  const handleSeeAllShorts = useCallback(() => {
    router.push("/(tabs)/shorts");
  }, [router]);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  const handleNotifications = useCallback(() => {
    router.push("/notifications");
  }, [router]);

  const handleSeeAllSection = useCallback((sectionId: string, sectionTitle: string) => {
    router.push(`/search-results?curationId=${sectionId}&curationTitle=${encodeURIComponent(sectionTitle)}` as any);
  }, [router]);

  const handleSeeAllTrending = useCallback(() => {
    router.push({
      pathname: "/(tabs)/shorts",
      params: { section: "trending" },
    });
  }, [router]);

  const FILTERS = ["전체", "한식", "양식", "일식", "디저트", "안주"];

  const FILTER_MAP: Record<string, { type: "cuisine" | "meal"; value: string }> = {
    "한식": { type: "cuisine", value: "KOREAN" },
    "양식": { type: "cuisine", value: "WESTERN" },
    "일식": { type: "cuisine", value: "JAPANESE" },
    "디저트": { type: "meal", value: "DESSERT" },
    "안주": { type: "meal", value: "SIDE_FOR_DRINK" },
  };

  const filteredSections = useMemo(() => {
    if (selectedFilter === "전체") return sections;
    const filterConfig = FILTER_MAP[selectedFilter];
    if (!filterConfig) return sections;
    return sections.filter((section) => {
      if (filterConfig.type === "cuisine") {
        return section.cuisineTypes?.includes(filterConfig.value);
      }
      return section.mealTypes?.includes(filterConfig.value);
    });
  }, [sections, selectedFilter]);

  const AnimatedSectionList = useRef(Animated.createAnimatedComponent(SectionList)).current;
  const curationSections = useMemo(
    () => filteredSections.map((section) => ({
      ...section,
      data: [section],
    })),
    [filteredSections]
  );
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

  // SectionList 콜백 메모이제이션
  const keyExtractor = useCallback((item: unknown) => (item as CurationSection).id, []);

  const renderCurationItem = useCallback(({ item }: { item: unknown }) => {
    const section = item as CurationSection;
    return (
      <CurationSectionRow
        section={section}
        cardWidth={shortsCardWidth}
        onRecipePress={handleRecipePress}
        onSeeAll={handleSeeAllSection}
      />
    );
  }, [shortsCardWidth, handleRecipePress, handleSeeAllSection]);

  const handleEndReached = useCallback(() => {
    if (hasNext && !loadingMore) fetchNextPage();
  }, [hasNext, loadingMore, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const onScrollEvent = useMemo(
    () => Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    ),
    [scrollY]
  );

  const contentContainerStyle = useMemo(
    () => ({ paddingTop: headerHeight, paddingBottom: 16 }),
    [headerHeight]
  );

  const listHeaderComponent = useMemo(() => (
    <View>
      {/* 초기 로딩 상태 (새로고침이 아닐 때만) */}
      {loading && !isRefreshing && topRecipes.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={{ marginTop: Spacing.md, color: Colors.neutral[500] }}>
            로딩 중...
          </Text>
        </View>
      )}

      {/* 데이터가 없을 때 (로딩 완료 후) */}
      {!loading && topRecipes.length === 0 && sections.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
          <Text style={{ fontSize: Typography.fontSize.lg, fontWeight: "600", color: Colors.neutral[500] }}>
            콘텐츠가 없습니다
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[400], marginTop: Spacing.xs }}>
            서버 연결을 확인해주세요
          </Text>
        </View>
      )}

      {/* TOP 레시피 랭킹 - 데이터가 있으면 항상 표시 */}
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
            contentContainerStyle={{ paddingLeft: Spacing.xl, paddingRight: Spacing.sm, paddingBottom: Spacing.sm }}
          >
            {topShorts.map(({ key, item, rank }) => (
              <TopRankCard
                key={key}
                item={item}
                rank={rank}
                cardWidth={topCardWidth}
                onPress={() => handleTopCurationPress(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  ), [loading, isRefreshing, topRecipes, sections.length, topShorts, topCardWidth, handleTopCurationPress]);

  const listFooterComponent = useMemo(() =>
    loadingMore ? (
      <View style={{ paddingVertical: Spacing.lg }}>
        <ActivityIndicator size="small" color={Colors.primary[500]} />
      </View>
    ) : null,
    [loadingMore]
  );

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      {...(Platform.OS === 'ios'
        ? { tintColor: "transparent" }
        : { colors: [Colors.primary[500]], progressBackgroundColor: Colors.neutral[0], progressViewOffset: headerHeight }
      )}
    />
  ), [isRefreshing, handleRefresh, headerHeight]);

  return (
    <View style={{ flex: 1, backgroundColor: SemanticColors.backgroundSecondary }}>
      <StatusBar barStyle="dark-content" />

      <AnimatedSectionList
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="always"
        refreshControl={refreshControl}
        onScroll={onScrollEvent}
        scrollEventThrottle={32}
        contentContainerStyle={contentContainerStyle}
        sections={curationSections}
        keyExtractor={keyExtractor}
        renderItem={renderCurationItem}
        ListHeaderComponent={listHeaderComponent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={listFooterComponent}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        updateCellsBatchingPeriod={150}
        stickySectionHeadersEnabled={false}
      />

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
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            gap: Spacing.md,
          }}
        >
          {/* 로고 */}
          <Image
            source={require("@/assets/images/icon_resized.png")}
            style={{ width: logoSize, height: logoSize }}
            contentFit="contain"
          />

          {/* 검색 바 (가운데 정렬) */}
          <Pressable
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.xl,
              paddingHorizontal: Spacing.md,
              paddingVertical: 10,
              gap: Spacing.sm,
            }}
            onPress={() => {
              console.log("Search pressed");
              router.push("/search");
            }}
          >
            <Search size={18} color={Colors.neutral[400]} />
            <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>
              레시피 검색
            </Text>
          </Pressable>

          {/* 알림 아이콘 */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              console.log("Notifications pressed");
              router.push("/notifications");
            }}
          >
            <Bell size={22} color={Colors.neutral[600]} />
            {/* Notification badge - 읽지 않은 알림이 있을 때만 표시 */}
            {unreadNotificationCount > 0 && (
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
            )}
          </Pressable>

          {/* 프로필 아이콘 */}
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              console.log("Profile pressed");
              router.push("/profile-edit");
            }}
          >
            <User size={22} color={Colors.neutral[600]} />
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

      {/* 커스텀 리프레시 인디케이터 (YouTube 스타일, iOS only - Android는 네이티브 RefreshControl 사용) */}
      {Platform.OS === 'ios' && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: headerHeight,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 99,
            transform: [{ translateY: indicatorTranslateY }],
            opacity: isRefreshing ? 1 : pullProgress,
          }}
        >
          <Animated.View
            style={{
              width: REFRESH_INDICATOR_SIZE,
              height: REFRESH_INDICATOR_SIZE,
              borderRadius: REFRESH_INDICATOR_SIZE / 2,
              backgroundColor: Colors.neutral[0],
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: isRefreshing ? 1 : indicatorScale }],
              ...Shadows.md,
            }}
          >
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          </Animated.View>
        </Animated.View>
      )}

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
