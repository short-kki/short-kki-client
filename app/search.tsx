import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, X } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSituation, setSelectedSituation] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);

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
    router.push("/(tabs)/shorts");
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
