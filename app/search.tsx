import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, X, Clock, Play } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 검색용 더미 데이터 (레시피 + 숏폼 통합)
const SEARCH_DATA = [
  { id: "t1", type: "recipe", title: "마약계란장", thumbnail: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400", duration: "10분", author: "요리왕" },
  { id: "t2", type: "recipe", title: "크림파스타", thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", duration: "20분", author: "파스타킹" },
  { id: "t3", type: "recipe", title: "김치볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "10분", author: "백종원" },
  { id: "s1", type: "shorts", title: "초간단 계란 볶음밥", thumbnail: "https://i.ytimg.com/vi/DkyZ9t12hpo/hq720.jpg", author: "백종원", views: "152만" },
  { id: "s2", type: "shorts", title: "원팬 파스타 레시피", thumbnail: "https://i.ytimg.com/vi/oc1bnLR38fE/hq720.jpg", author: "자취생요리", views: "183만" },
  { id: "s3", type: "shorts", title: "김치찌개 황금비율", thumbnail: "https://i.ytimg.com/vi/NnhIbr5lmEg/hq720.jpg", author: "집밥선생", views: "89만" },
  { id: "s4", type: "shorts", title: "마약토스트 만들기", thumbnail: "https://i.ytimg.com/vi/ZPFVC78A2jM/hq720.jpg", author: "간편요리", views: "228만" },
  { id: "s5", type: "shorts", title: "간장계란밥 꿀팁", thumbnail: "https://i.ytimg.com/vi/gQDByCdjUXw/hq720.jpg", author: "혼밥러", views: "56만" },
];

// 상황 태그
const SITUATION_TAGS = [
  { id: "s1", label: "혼밥" },
  { id: "s2", label: "야식" },
  { id: "s3", label: "손님접대" },
  { id: "s4", label: "술안주" },
];

// 테마 태그
const THEME_TAGS = [
  { id: "t1", label: "다이어트" },
  { id: "t2", label: "간편요리" },
  { id: "t3", label: "영양만점" },
  { id: "t4", label: "가성비" },
];

// 음식 종류 태그
const FOOD_TYPE_TAGS = [
  { id: "f1", label: "한식" },
  { id: "f2", label: "양식" },
  { id: "f3", label: "중식" },
  { id: "f4", label: "일식" },
];

function Tag({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? Colors.primary[500] : Colors.neutral[300],
        backgroundColor: selected ? Colors.primary[50] : Colors.neutral[0],
        marginRight: 10,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: selected ? Colors.primary[600] : Colors.neutral[700],
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// 검색 결과 카드 컴포넌트
function SearchResultCard({ item, onPress }: { item: typeof SEARCH_DATA[0]; onPress: () => void }) {
  const isShorts = item.type === "shorts";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        backgroundColor: Colors.neutral[0],
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.neutral[100],
      }}
    >
      {/* 썸네일 */}
      <View style={{ width: 100, height: 100, position: "relative" }}>
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        {isShorts && (
          <View
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Play size={10} color="#FFF" fill="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "600", marginLeft: 3 }}>
              숏폼
            </Text>
          </View>
        )}
        {!isShorts && item.duration && (
          <View
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={10} color="#FFF" />
            <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "600", marginLeft: 3 }}>
              {item.duration}
            </Text>
          </View>
        )}
      </View>
      {/* 정보 */}
      <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: Colors.neutral[900],
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
          {item.author}
          {isShorts && item.views && ` · 조회수 ${item.views}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSituation, setSelectedSituation] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 검색 결과 필터링
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return SEARCH_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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

  const handleSearch = () => {
    setHasSearched(true);
  };

  // 검색 결과 클릭 → 항상 레시피 상세로 이동
  const handleResultPress = (item: typeof SEARCH_DATA[0]) => {
    router.push(`/recipe/${item.id}`);
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
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={24} color={Colors.neutral[900]} />
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
            height: 44,
          }}
        >
          <Search size={20} color={Colors.neutral[400]} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 16,
              color: Colors.neutral[900],
            }}
            placeholder="제목/재료 입력"
            placeholderTextColor={Colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={20} color={Colors.neutral[400]} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
      >
        {/* 검색 결과 표시 */}
        {hasSearched && searchQuery.trim() ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                marginBottom: 16,
              }}
            >
              검색 결과 {searchResults.length}개
            </Text>
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onPress={() => handleResultPress(item)}
                />
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Text style={{ fontSize: 16, color: Colors.neutral[400] }}>
                  검색 결과가 없습니다
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* 상황 Section */}
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginBottom: 12,
                }}
              >
                상황
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {SITUATION_TAGS.map((tag) => (
                  <Tag
                    key={tag.id}
                    label={tag.label}
                    selected={selectedSituation.includes(tag.id)}
                    onPress={() => toggleTag(tag.id, selectedSituation, setSelectedSituation)}
                  />
                ))}
              </View>
            </View>

            {/* 테마 Section */}
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginBottom: 12,
                }}
              >
                테마
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {THEME_TAGS.map((tag) => (
                  <Tag
                    key={tag.id}
                    label={tag.label}
                    selected={selectedTheme.includes(tag.id)}
                    onPress={() => toggleTag(tag.id, selectedTheme, setSelectedTheme)}
                  />
                ))}
              </View>
            </View>

            {/* 음식종류 Section */}
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginBottom: 12,
                }}
              >
                음식종류
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {FOOD_TYPE_TAGS.map((tag) => (
                  <Tag
                    key={tag.id}
                    label={tag.label}
                    selected={selectedFoodType.includes(tag.id)}
                    onPress={() => toggleTag(tag.id, selectedFoodType, setSelectedFoodType)}
                  />
                ))}
              </View>
            </View>

            {/* 인기 검색어 */}
            <View style={{ marginTop: 32 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginBottom: 12,
                }}
              >
                인기 검색어
              </Text>
              <View style={{ gap: 8 }}>
                {["계란볶음밥", "원팬파스타", "김치찌개", "마약토스트", "간장계란밥"].map(
                  (keyword, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSearchQuery(keyword);
                        setHasSearched(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        style={{
                          width: 24,
                          fontSize: 16,
                          fontWeight: "700",
                          color: Colors.primary[500],
                        }}
                      >
                        {index + 1}
                      </Text>
                      <Text style={{ fontSize: 16, color: Colors.neutral[700] }}>
                        {keyword}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 검색 버튼 */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: Colors.neutral[0],
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
        }}
      >
        <TouchableOpacity
          onPress={handleSearch}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFF" }}>
            검색하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
