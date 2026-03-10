import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Keyboard,
  BackHandler,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Bookmark, SearchX, Search, SlidersHorizontal, X, Clock } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { Colors, Shadows } from "@/constants/design-system";
import { useRecipeSearch, useCurationShorts } from "@/hooks";
import type { SearchRecipeItem, ShortsItem } from "@/data/mock";
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  type SearchHistoryItem,
} from "@/utils/search-history";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

function formatBookmarkCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

function SquareThumbnail({ uri }: { uri?: string }) {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: Colors.neutral[200],
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          contentPosition="center"
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>🍽</Text>
        </View>
      )}
    </View>
  );
}

function YouTubeBadge({ creatorName }: { creatorName?: string }) {
  if (!creatorName) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: 8,
        right: 8,
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

const SearchResultCard = React.memo(function SearchResultCard({
  item,
  onPress,
}: {
  item: SearchRecipeItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={cardStyles.card}
    >
      <View style={cardStyles.thumbnailWrap}>
        <SquareThumbnail uri={item.mainImgUrl ?? undefined} />
        {item.platform === "YOUTUBE" && (
          <YouTubeBadge creatorName={item.creatorName ?? item.authorName ?? undefined} />
        )}
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={cardStyles.bookmarkRow}>
          <Bookmark
            size={12}
            color={Colors.neutral[400]}
            fill={item.isBookmarked ? Colors.neutral[400] : "none"}
          />
          <Text style={cardStyles.bookmarkText}>
            {formatBookmarkCount(item.bookmarkCount ?? 0)}
          </Text>
          {item.cookingTime ? (
            <>
              <Clock size={12} color={Colors.neutral[400]} style={{ marginLeft: 8 }} />
              <Text style={cardStyles.bookmarkText}>{item.cookingTime}분</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.neutral[0],
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: CARD_GAP,
    ...Shadows.xs,
  },
  thumbnailWrap: {
    width: "100%",
    height: CARD_WIDTH,
    position: "relative",
    backgroundColor: Colors.neutral[200],
    overflow: "hidden",
  },
  info: { paddingHorizontal: 10, paddingVertical: 8 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral[900],
    lineHeight: 21,
  },
  bookmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  bookmarkText: {
    fontSize: 12,
    color: Colors.neutral[400],
    fontWeight: "500",
    marginLeft: 4,
  },
});

// ShortsItem → SearchRecipeItem 변환
function mapShortsToSearchItem(item: ShortsItem): SearchRecipeItem {
  return {
    id: Number(item.id) || 0,
    title: item.title,
    mainImgUrl: item.thumbnail || null,
    platform: item.creatorName ? "YOUTUBE" : null,
    creatorName: item.creatorName ?? null,
    authorName: item.author || null,
    authorProfileImgUrl: item.authorProfileImgUrl ?? null,
    bookmarkCount: item.bookmarks ?? 0,
    sourceUrl: item.videoUrl || null,
    recipeSource: item.creatorName ? "IMPORT" : "USER",
    isBookmarked: item.isBookmarked ?? false,
    cookingTime: null,
    creatorProfileImgUrl: null,
  };
}

// ─── 큐레이션 모드 컨텐츠 (FlatList) ───
function CurationContent({
  items,
  loading,
  loadingMore,
  hasNext,
  fetchNextPage,
  refetch,
  onItemPress,
}: {
  items: SearchRecipeItem[];
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  fetchNextPage: () => void;
  refetch: () => Promise<void>;
  onItemPress: (item: SearchRecipeItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNext && !loadingMore) fetchNextPage();
  }, [hasNext, loadingMore, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: SearchRecipeItem }) => (
      <SearchResultCard item={item} onPress={() => onItemPress(item)} />
    ),
    [onItemPress]
  );

  const keyExtractor = useCallback((item: SearchRecipeItem) => String(item.id), []);

  const isInitialLoading = loading && items.length === 0;

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={items.length > 0 ? { justifyContent: "space-between" } : undefined}
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 14,
        paddingBottom: insets.bottom + 20,
        ...(isInitialLoading && { flex: 1 }),
      }}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[Colors.primary[500]]}
          tintColor={Colors.primary[500]}
        />
      }
      ListHeaderComponent={
        !isInitialLoading ? (
          <Text style={{ fontSize: 13, color: Colors.neutral[500], marginBottom: 12 }}>
            {items.length}개의 레시피
          </Text>
        ) : null
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isInitialLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <SearchX size={48} color={Colors.neutral[300]} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[500], marginTop: 16 }}>
              레시피가 없습니다
            </Text>
            <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 6, textAlign: "center" }}>
              아직 이 큐레이션에 레시피가 없어요
            </Text>
          </View>
        )
      }
      removeClippedSubviews
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
    />
  );
}

export default function SearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    searchWord?: string;
    cuisineTypes?: string;
    mealTypes?: string;
    difficulties?: string;
    curationId?: string;
    curationTitle?: string;
  }>();

  // 큐레이션 모드 판별
  const isCurationMode = !!params.curationId;

  // URL 파라미터에서 필터 값 (고정)
  const cuisineTypes = params.cuisineTypes ? params.cuisineTypes.split(",") : [];
  const mealTypes = params.mealTypes ? params.mealTypes.split(",") : [];
  const difficulties = params.difficulties ? params.difficulties.split(",") : [];
  const activeFilters = [...cuisineTypes, ...mealTypes, ...difficulties];

  // 검색어는 로컬 상태로 관리
  const [activeSearchWord, setActiveSearchWord] = useState(params.searchWord?.trim() || "");
  const [inputValue, setInputValue] = useState(params.searchWord?.trim() || "");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 모드별 데이터 훅 (큐레이션 모드에서는 검색 훅 비활성화)
  const searchData = useRecipeSearch({
    searchWord: isCurationMode ? "" : activeSearchWord,
    cuisineTypes: cuisineTypes.length > 0 ? cuisineTypes : undefined,
    mealTypes: mealTypes.length > 0 ? mealTypes : undefined,
    difficulties: difficulties.length > 0 ? difficulties : undefined,
    enabled: !isCurationMode,
  });

  const curationData = useCurationShorts(isCurationMode ? params.curationId : undefined);

  // 큐레이션 데이터 매핑 캐싱
  const curationItems = useMemo(
    () => (isCurationMode ? curationData.shorts.map(mapShortsToSearchItem) : []),
    [isCurationMode, curationData.shorts]
  );

  // 큐레이션 카드 프레스 핸들러 → 레시피 상세 화면으로 이동
  const handleCurationItemPress = useCallback(
    (item: SearchRecipeItem) => {
      router.push(`/recipe/${item.id}`);
    },
    [router]
  );

  // ─── 검색 모드 로직 (큐레이션과 분리) ───
  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  useFocusEffect(
    useCallback(() => {
      if (isCurationMode) return;
      loadSearchHistory();

      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (isInputFocused) {
          Keyboard.dismiss();
          setIsInputFocused(false);
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }, [isInputFocused, isCurationMode])
  );

  const handleSearchResultPress = useCallback(
    (item: SearchRecipeItem) => { router.push(`/recipe/${item.id}`); },
    [router]
  );

  const handleScroll = useCallback(
    (e: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 300 && searchData.hasNext && !searchData.loadingMore) {
        searchData.fetchNextPage();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchData.hasNext, searchData.loadingMore, searchData.fetchNextPage]
  );

  const handleBackPress = () => {
    if (isInputFocused) {
      Keyboard.dismiss();
      setIsInputFocused(false);
      setInputValue(activeSearchWord);
    } else {
      router.back();
    }
  };

  const executeSearch = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    await addSearchHistory(trimmed);
    loadSearchHistory();
    Keyboard.dismiss();
    setIsInputFocused(false);
    setInputValue(trimmed);
    if (trimmed === activeSearchWord) {
      searchData.refetch();
    } else {
      setActiveSearchWord(trimmed);
    }
  };

  // ─── 렌더 ───
  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50], paddingTop: insets.top }}>
      {/* Header */}
      {isCurationMode ? (
        <View style={headerStyles.container}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={22} color={Colors.neutral[900]} />
          </Pressable>
          <View style={{ flex: 1, height: 42, justifyContent: "center" }}>
            <Text style={headerStyles.curationTitle} numberOfLines={1}>
              {params.curationTitle || "큐레이션"}
            </Text>
          </View>
        </View>
      ) : (
        <View style={headerStyles.container}>
          <Pressable onPress={handleBackPress} style={{ padding: 4 }}>
            <ArrowLeft size={22} color={Colors.neutral[900]} />
          </Pressable>
          <View
            style={[
              headerStyles.searchBar,
              isInputFocused && { borderWidth: 1.5, borderColor: Colors.primary[500] },
            ]}
          >
            <Search size={18} color={Colors.neutral[400]} />
            <TextInput
              ref={inputRef}
              style={headerStyles.searchInput}
              placeholder="제목/재료/태그 입력"
              placeholderTextColor={Colors.neutral[400]}
              value={inputValue}
              onChangeText={setInputValue}
              returnKeyType="search"
              onSubmitEditing={() => executeSearch(inputValue)}
              onFocus={() => { setIsInputFocused(true); loadSearchHistory(); }}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 100)}
            />
            {inputValue.length > 0 && (
              <Pressable onPress={() => setInputValue("")} style={{ padding: 2 }}>
                <X size={18} color={Colors.neutral[400]} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={() => router.back()} style={{ padding: 8, position: "relative" }}>
            <SlidersHorizontal size={22} color={activeFilters.length > 0 ? Colors.primary[500] : Colors.neutral[600]} />
            {activeFilters.length > 0 && (
              <View style={headerStyles.filterBadge}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>{activeFilters.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      {/* 큐레이션 모드: FlatList */}
      {isCurationMode ? (
        <CurationContent
          items={curationItems}
          loading={curationData.loading}
          loadingMore={curationData.loadingMore}
          hasNext={curationData.hasNext}
          fetchNextPage={curationData.fetchNextPage}
          refetch={curationData.refetch}
          onItemPress={handleCurationItemPress}
        />
      ) : (
        <>
          {/* 최근 검색어 오버레이 */}
          {isInputFocused && (
            <View style={{ position: "absolute", top: insets.top + 62, left: 0, right: 0, bottom: 0, backgroundColor: Colors.neutral[50], zIndex: 5 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 }}
              >
                {searchHistory.length > 0 ? (
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[600], marginBottom: 8 }}>최근 검색어</Text>
                    <View style={{ gap: 0 }}>
                      {searchHistory.map((item) => (
                        <TouchableOpacity
                          key={item.keyword}
                          onPress={() => executeSearch(item.keyword)}
                          activeOpacity={0.7}
                          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
                        >
                          <Clock size={16} color={Colors.neutral[400]} />
                          <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, color: Colors.neutral[800] }}>{item.keyword}</Text>
                          <Pressable
                            onPress={async (e) => { e.stopPropagation(); await removeSearchHistory(item.keyword); loadSearchHistory(); }}
                            hitSlop={8}
                            style={{ padding: 4 }}
                          >
                            <X size={18} color={Colors.neutral[400]} />
                          </Pressable>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>최근 검색어가 없습니다</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* 검색 결과 */}
          {searchData.loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={{ fontSize: 14, color: Colors.neutral[500], marginTop: 12 }}>검색 중...</Text>
            </View>
          ) : searchData.error ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[500], marginBottom: 8 }}>오류가 발생했습니다</Text>
              <Text style={{ fontSize: 13, color: Colors.neutral[400], textAlign: "center", marginBottom: 16 }}>{searchData.error.message}</Text>
              <TouchableOpacity onPress={searchData.refetch} activeOpacity={0.7} style={{ backgroundColor: Colors.primary[500], paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 14, paddingBottom: insets.bottom + 20 }}
            >
              <Text style={{ fontSize: 13, color: Colors.neutral[500], marginBottom: 12 }}>
                검색 결과 {searchData.results.length}개
              </Text>
              {searchData.results.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                  {searchData.results.map((item) => (
                    <SearchResultCard key={item.id} item={item} onPress={() => handleSearchResultPress(item)} />
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <SearchX size={48} color={Colors.neutral[300]} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[500], marginTop: 16 }}>검색 결과가 없습니다</Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 6, textAlign: "center" }}>
                    다른 키워드로 검색하거나{"\n"}필터를 변경해 보세요
                  </Text>
                </View>
              )}
              {searchData.loadingMore && (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[0],
    zIndex: 10,
  },
  curationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.neutral[900],
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.neutral[900],
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
