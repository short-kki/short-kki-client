import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  TextInput,
  Keyboard,
  BackHandler,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Bookmark, SearchX, Search, SlidersHorizontal, X, Clock } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { Colors, Shadows } from "@/constants/design-system";
import { useRecipeSearch } from "@/hooks";
import type { SearchRecipeItem } from "@/data/mock";
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

// 북마크 수 포맷팅 (1000 이상이면 1.0k 형식)
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

function SearchResultCard({ item, onPress }: { item: SearchRecipeItem; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: CARD_WIDTH,
        backgroundColor: Colors.neutral[0],
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: CARD_GAP,
        ...Shadows.xs,
      }}
    >
      {/* 썸네일 */}
      <View
        style={{
          width: "100%",
          height: CARD_WIDTH,
          position: "relative",
          backgroundColor: Colors.neutral[200],
          overflow: "hidden",
        }}
      >
        <SquareThumbnail uri={item.mainImgUrl ?? undefined} />
        {/* 유튜브 배지 (홈과 동일 스타일) */}
        {item.platform === "YOUTUBE" && (
          <YouTubeBadge creatorName={item.creatorName ?? item.authorName ?? undefined} />
        )}
      </View>

      {/* 정보 */}
      <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: Colors.neutral[900],
            lineHeight: 21,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Bookmark size={12} color={Colors.neutral[400]} />
          <Text
            style={{
              fontSize: 12,
              color: Colors.neutral[400],
              fontWeight: "500",
              marginLeft: 4,
            }}
          >
            {formatBookmarkCount(item.bookmarkCount ?? 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
  }>();

  // URL 파라미터에서 필터 값 (고정)
  const cuisineTypes = params.cuisineTypes ? params.cuisineTypes.split(",") : [];
  const mealTypes = params.mealTypes ? params.mealTypes.split(",") : [];
  const difficulties = params.difficulties ? params.difficulties.split(",") : [];
  const activeFilters = [...cuisineTypes, ...mealTypes, ...difficulties];

  // 검색어는 로컬 상태로 관리 (재검색 시 화면 전환 없이 업데이트)
  const [activeSearchWord, setActiveSearchWord] = useState(params.searchWord?.trim() || "");
  const [inputValue, setInputValue] = useState(params.searchWord?.trim() || "");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const {
    results: searchResults,
    loading,
    loadingMore,
    error,
    hasNext,
    fetchNextPage,
    refetch,
  } = useRecipeSearch({
    searchWord: activeSearchWord,
    cuisineTypes: cuisineTypes.length > 0 ? cuisineTypes : undefined,
    mealTypes: mealTypes.length > 0 ? mealTypes : undefined,
    difficulties: difficulties.length > 0 ? difficulties : undefined,
  });

  // 검색 기록 로드
  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  // 화면 포커스 시 검색 기록 로드 및 백 버튼 처리
  useFocusEffect(
    useCallback(() => {
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
    }, [isInputFocused])
  );

  const handleResultPress = (item: SearchRecipeItem) => {
    router.push(`/recipe/${item.id}`);
  };

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 300 && hasNext && !loadingMore) {
        fetchNextPage();
      }
    },
    [hasNext, loadingMore, fetchNextPage]
  );

  const handleBackPress = () => {
    if (isInputFocused) {
      Keyboard.dismiss();
      setIsInputFocused(false);
      setInputValue(activeSearchWord); // 현재 검색어로 복원
    } else {
      router.back(); // 필터 화면으로 돌아가기
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    loadSearchHistory();
  };

  const handleInputBlur = () => {
    // 딜레이를 줘서 최근 검색어 클릭이 먼저 처리되도록
    setTimeout(() => {
      setIsInputFocused(false);
    }, 100);
  };

  // 재검색 (화면 전환 없이 데이터만 업데이트)
  const executeSearch = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    await addSearchHistory(trimmed);
    loadSearchHistory();
    Keyboard.dismiss();
    setIsInputFocused(false);
    setInputValue(trimmed);
    setActiveSearchWord(trimmed); // 이것만 바꾸면 useRecipeSearch가 다시 실행됨
  };

  const handleHistoryItemPress = (keyword: string) => {
    executeSearch(keyword);
  };

  const handleRemoveHistoryItem = async (keyword: string) => {
    await removeSearchHistory(keyword);
    loadSearchHistory();
  };

  const handleSearchSubmit = () => {
    executeSearch(inputValue);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          backgroundColor: Colors.neutral[0],
          zIndex: 10,
        }}
      >
        <Pressable onPress={handleBackPress} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={Colors.neutral[900]} />
        </Pressable>

        {/* 검색창 */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: Colors.neutral[100],
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 42,
            borderWidth: isInputFocused ? 1.5 : 0,
            borderColor: Colors.primary[500],
          }}
        >
          <Search size={18} color={Colors.neutral[400]} />
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: Colors.neutral[900],
            }}
            placeholder="제목/재료/태그 입력"
            placeholderTextColor={Colors.neutral[400]}
            value={inputValue}
            onChangeText={setInputValue}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {inputValue.length > 0 && (
            <Pressable onPress={() => setInputValue("")} style={{ padding: 2 }}>
              <X size={18} color={Colors.neutral[400]} />
            </Pressable>
          )}
        </View>

        {/* 필터 버튼 */}
        <Pressable
          onPress={() => router.back()}
          style={{
            padding: 8,
            position: "relative",
          }}
        >
          <SlidersHorizontal size={22} color={activeFilters.length > 0 ? Colors.primary[500] : Colors.neutral[600]} />
          {activeFilters.length > 0 && (
            <View
              style={{
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
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>
                {activeFilters.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 최근 검색어 오버레이 */}
      {isInputFocused && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 62, // 헤더 높이
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.neutral[50],
            zIndex: 5,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 100,
            }}
          >
            {searchHistory.length > 0 ? (
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: Colors.neutral[600],
                    marginBottom: 8,
                  }}
                >
                  최근 검색어
                </Text>
                <View style={{ gap: 0 }}>
                  {searchHistory.map((item) => (
                    <TouchableOpacity
                      key={item.keyword}
                      onPress={() => handleHistoryItemPress(item.keyword)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                      }}
                    >
                      <Clock size={16} color={Colors.neutral[400]} />
                      <Text
                        style={{
                          flex: 1,
                          marginLeft: 12,
                          fontSize: 15,
                          color: Colors.neutral[800],
                        }}
                      >
                        {item.keyword}
                      </Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveHistoryItem(item.keyword);
                        }}
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
                <Text style={{ fontSize: 14, color: Colors.neutral[400] }}>
                  최근 검색어가 없습니다
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* 로딩 상태 */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={{ fontSize: 14, color: Colors.neutral[500], marginTop: 12 }}>
            검색 중...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[500], marginBottom: 8 }}>
            오류가 발생했습니다
          </Text>
          <Text style={{ fontSize: 13, color: Colors.neutral[400], textAlign: "center", marginBottom: 16 }}>
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            activeOpacity={0.7}
            style={{
              backgroundColor: Colors.primary[500],
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            contentContainerStyle={{
              paddingHorizontal: HORIZONTAL_PADDING,
              paddingTop: 14,
              paddingBottom: insets.bottom + 20,
            }}
          >
          {/* 결과 개수 */}
          <Text
            style={{
              fontSize: 13,
              color: Colors.neutral[500],
              marginBottom: 12,
            }}
          >
            검색 결과 {searchResults.length}개
          </Text>

          {/* 2열 그리드 */}
          {searchResults.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {searchResults.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onPress={() => handleResultPress(item)}
                />
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <SearchX size={48} color={Colors.neutral[300]} />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.neutral[500],
                  marginTop: 16,
                }}
              >
                검색 결과가 없습니다
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.neutral[400],
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                다른 키워드로 검색하거나{"\n"}필터를 변경해 보세요
              </Text>
            </View>
          )}

          {/* 추가 로딩 인디케이터 */}
          {loadingMore && (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
