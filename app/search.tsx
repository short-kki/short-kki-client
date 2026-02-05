import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Keyboard,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Search, X, RotateCcw, Clock } from "lucide-react-native";
import { Colors } from "@/constants/design-system";
import {
  getSearchHistory,
  addSearchHistory,
  removeSearchHistory,
  clearSearchHistory,
  type SearchHistoryItem,
} from "@/utils/search-history";

// 음식 종류 (CuisineType)
const CUISINE_TYPE_TAGS = [
  { id: "KOREAN", label: "한식" },
  { id: "WESTERN", label: "양식" },
  { id: "JAPANESE", label: "일식" },
  { id: "CHINESE", label: "중식" },
  { id: "FUSION", label: "퓨전" },
  { id: "ASIAN", label: "아시아" },
];

// 식사 유형 (MealType)
const MEAL_TYPE_TAGS = [
  { id: "MAIN", label: "주메뉴" },
  { id: "SIDE_DISH", label: "사이드" },
  { id: "SNACK", label: "간식" },
  { id: "DESSERT", label: "디저트" },
  { id: "SIDE_FOR_DRINK", label: "안주" },
];

// 난이도 (Difficulty)
const DIFFICULTY_TAGS = [
  { id: "BEGINNER", label: "초급" },
  { id: "INTERMEDIATE", label: "중급" },
  { id: "ADVANCED", label: "고급" },
];

function Tag({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: selected ? Colors.primary[500] : Colors.neutral[200],
        backgroundColor: selected ? Colors.primary[50] : Colors.neutral[0],
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? "600" : "400",
          color: selected ? Colors.primary[600] : Colors.neutral[600],
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// 필터 섹션 헤더
function FilterSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: Colors.neutral[800],
        }}
      >
        {title}
      </Text>
      {count > 0 && (
        <View
          style={{
            marginLeft: 6,
            backgroundColor: Colors.primary[500],
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFF" }}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    focusInput?: string;
    searchWord?: string;
    cuisineTypes?: string;
    mealTypes?: string;
    difficulties?: string;
  }>();
  const inputRef = useRef<TextInput>(null);

  // 쿼리 파라미터에서 초기값 설정
  const [searchQuery, setSearchQuery] = useState(params.searchWord?.trim() || "");
  const [selectedCuisineType, setSelectedCuisineType] = useState<string[]>(
    params.cuisineTypes ? params.cuisineTypes.split(",") : []
  );
  const [selectedMealType, setSelectedMealType] = useState<string[]>(
    params.mealTypes ? params.mealTypes.split(",") : []
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>(
    params.difficulties ? params.difficulties.split(",") : []
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const totalFilterCount =
    selectedCuisineType.length + selectedMealType.length + selectedDifficulty.length;

  // focusInput 파라미터가 있으면 검색창에 포커스
  useEffect(() => {
    if (params.focusInput === "true") {
      setIsInputFocused(true);
      // 약간의 딜레이 후 포커스 (화면 렌더링 완료 후)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [params.focusInput]);

  // 화면 진입 시 검색 기록 로드
  useFocusEffect(
    useCallback(() => {
      loadSearchHistory();

      // Android 뒤로가기 버튼 처리
      const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (isInputFocused) {
          Keyboard.dismiss();
          setIsInputFocused(false);
          return true; // 이벤트 소비 (화면 이탈 방지)
        }
        return false; // 기본 동작 (화면 이탈)
      });

      return () => backHandler.remove();
    }, [isInputFocused])
  );

  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  const toggleTag = (
    tagId: string,
    selectedList: string[],
    setSelectedList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedList.includes(tagId)) {
      setSelectedList(selectedList.filter((id) => id !== tagId));
    } else {
      setSelectedList([...selectedList, tagId]);
    }
  };

  const resetFilters = () => {
    setSelectedCuisineType([]);
    setSelectedMealType([]);
    setSelectedDifficulty([]);
  };

  const navigateToResults = async (query: string) => {
    const trimmedQuery = query.trim();

    // 검색어가 있으면 검색 기록에 저장
    if (trimmedQuery) {
      await addSearchHistory(trimmedQuery);
      loadSearchHistory(); // 기록 갱신
    }

    const searchParams = new URLSearchParams();
    if (trimmedQuery) searchParams.set("searchWord", trimmedQuery);
    if (selectedCuisineType.length > 0) searchParams.set("cuisineTypes", selectedCuisineType.join(","));
    if (selectedMealType.length > 0) searchParams.set("mealTypes", selectedMealType.join(","));
    if (selectedDifficulty.length > 0) searchParams.set("difficulties", selectedDifficulty.join(","));

    const qs = searchParams.toString();
    Keyboard.dismiss();
    router.push(`/search-results${qs ? `?${qs}` : ""}` as any);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && totalFilterCount === 0) return;
    navigateToResults(searchQuery);
  };

  const handleHistoryItemPress = (keyword: string) => {
    setSearchQuery(keyword);
    navigateToResults(keyword);
  };

  const handleRemoveHistoryItem = async (keyword: string) => {
    await removeSearchHistory(keyword);
    loadSearchHistory();
  };

  const handleClearAllHistory = async () => {
    await clearSearchHistory();
    setSearchHistory([]);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    // 약간의 딜레이를 줘서 최근 검색어 클릭이 먼저 처리되도록
    setTimeout(() => {
      setIsInputFocused(false);
    }, 100);
  };

  const handleBackPress = () => {
    if (isInputFocused) {
      // 검색창 포커스 상태면 키보드 닫고 필터 화면으로
      Keyboard.dismiss();
      setIsInputFocused(false);
    } else {
      // 필터 화면이면 이전 화면으로 나가기
      router.back();
    }
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
        }}
      >
        <Pressable onPress={handleBackPress} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={Colors.neutral[900]} />
        </Pressable>

        {/* Search Input */}
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={{ padding: 2 }}>
              <X size={18} color={Colors.neutral[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 검색창 포커스 시: 최근 검색어 */}
      {isInputFocused ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
        >
          {/* 최근 검색어 */}
          {searchHistory.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: Colors.neutral[600],
                  }}
                >
                  최근 검색어
                </Text>
                <TouchableOpacity
                  onPress={handleClearAllHistory}
                  activeOpacity={0.7}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 12, color: Colors.neutral[400] }}>
                    전체 삭제
                  </Text>
                </TouchableOpacity>
              </View>
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
      ) : (
        /* 검색창 포커스 해제 시: 필터 + 인기 검색어 */
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 100,
          }}
        >
          {/* 필터 헤더 + 초기화 */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: Colors.neutral[900],
              }}
            >
              필터
            </Text>
            {totalFilterCount > 0 && (
              <TouchableOpacity
                onPress={resetFilters}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                }}
              >
                <RotateCcw size={13} color={Colors.neutral[400]} />
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.neutral[400],
                    marginLeft: 4,
                  }}
                >
                  초기화
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 음식 종류 Section */}
          <View style={{ marginTop: 16 }}>
            <FilterSectionHeader title="음식 종류" count={selectedCuisineType.length} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CUISINE_TYPE_TAGS.map((tag) => (
                <Tag
                  key={tag.id}
                  label={tag.label}
                  selected={selectedCuisineType.includes(tag.id)}
                  onPress={() => toggleTag(tag.id, selectedCuisineType, setSelectedCuisineType)}
                />
              ))}
            </View>
          </View>

          {/* 식사 유형 Section */}
          <View style={{ marginTop: 20 }}>
            <FilterSectionHeader title="식사 유형" count={selectedMealType.length} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MEAL_TYPE_TAGS.map((tag) => (
                <Tag
                  key={tag.id}
                  label={tag.label}
                  selected={selectedMealType.includes(tag.id)}
                  onPress={() => toggleTag(tag.id, selectedMealType, setSelectedMealType)}
                />
              ))}
            </View>
          </View>

          {/* 난이도 Section */}
          <View style={{ marginTop: 20 }}>
            <FilterSectionHeader title="난이도" count={selectedDifficulty.length} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DIFFICULTY_TAGS.map((tag) => (
                <Tag
                  key={tag.id}
                  label={tag.label}
                  selected={selectedDifficulty.includes(tag.id)}
                  onPress={() => toggleTag(tag.id, selectedDifficulty, setSelectedDifficulty)}
                />
              ))}
            </View>
          </View>

          {/* 구분선 */}
          <View
            style={{
              height: 1,
              backgroundColor: Colors.neutral[200],
              marginTop: 24,
              marginBottom: 8,
            }}
          />

          {/* 인기 검색어 */}
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: 12,
              }}
            >
              인기 검색어
            </Text>
            <View style={{ gap: 4 }}>
              {["계란볶음밥", "원팬파스타", "김치찌개", "마약토스트", "간장계란밥", "떡볶이", "제육볶음", "된장찌개", "불고기", "연어덮밥"].map(
                (keyword, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => navigateToResults(keyword)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        width: 24,
                        fontSize: 14,
                        fontWeight: "700",
                        color: index < 3 ? Colors.primary[500] : Colors.neutral[400],
                      }}
                    >
                      {index + 1}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: index < 3 ? "500" : "400",
                        color: Colors.neutral[700],
                      }}
                    >
                      {keyword}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 검색 버튼 (필터 화면에서만 표시) */}
      {!isInputFocused && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
            backgroundColor: Colors.neutral[0],
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
          }}
        >
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.8}
            disabled={!searchQuery.trim()}
            style={{
              backgroundColor: searchQuery.trim() ? Colors.primary[500] : Colors.neutral[300],
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Search size={16} color="#FFF" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF", marginLeft: 6 }}>
              검색하기
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
