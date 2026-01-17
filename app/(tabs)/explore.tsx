import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, TrendingUp } from "lucide-react-native";

const trendingTags = [
  "자취요리",
  "다이어트",
  "한끼뚝딱",
  "도시락",
  "간식",
  "초간단",
  "밀프렙",
  "비건",
];

const categories = [
  { name: "한식", emoji: "🍚" },
  { name: "양식", emoji: "🍝" },
  { name: "중식", emoji: "🥟" },
  { name: "일식", emoji: "🍣" },
  { name: "디저트", emoji: "🍰" },
  { name: "음료", emoji: "🧋" },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-cream"
      style={{ paddingTop: insets.top, backgroundColor: "#F9F5F0" }}
    >
      {/* Header */}
      <View className="px-4 py-3">
        <Text className="text-2xl font-bold text-dark-gray">탐색</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 mb-6">
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
          <Search size={20} color="#9CA3AF" />
          <TextInput
            placeholder="레시피 검색..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-base text-dark-gray"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Trending Tags */}
        <View className="mb-8">
          <View className="flex-row items-center px-4 mb-4">
            <TrendingUp size={18} color="#FF6B00" />
            <Text className="text-lg font-bold text-dark-gray ml-2">
              인기 태그
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            <View className="flex-row gap-2">
              {trendingTags.map((tag, index) => (
                <Pressable
                  key={index}
                  className="bg-white px-4 py-2 rounded-full border border-gray-100"
                >
                  <Text className="text-dark-gray font-medium">#{tag}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Categories */}
        <View className="px-4 mb-8">
          <Text className="text-lg font-bold text-dark-gray mb-4">
            카테고리
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {categories.map((category, index) => (
              <Pressable
                key={index}
                className="bg-white w-[30%] py-5 rounded-2xl items-center shadow-sm"
              >
                <Text className="text-3xl mb-2">{category.emoji}</Text>
                <Text className="text-dark-gray font-medium">
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
