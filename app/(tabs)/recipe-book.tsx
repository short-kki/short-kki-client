import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Plus,
  Heart,
  Clock,
  ChefHat,
  Folder,
  MoreVertical,
  BookOpen,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 카테고리 데이터
const CATEGORIES = [
  { id: "all", name: "전체", count: 24, emoji: "📚" },
  { id: "korean", name: "한식", count: 8, emoji: "🍚" },
  { id: "western", name: "양식", count: 6, emoji: "🍝" },
  { id: "quick", name: "초간단", count: 5, emoji: "⚡" },
  { id: "healthy", name: "건강식", count: 3, emoji: "🥗" },
  { id: "dessert", name: "디저트", count: 2, emoji: "🍰" },
];

// 저장된 레시피 데이터
const SAVED_RECIPES = [
  {
    id: "r1",
    title: "백종원 계란볶음밥",
    author: "백종원",
    thumbnail: "https://i.ytimg.com/vi/DkyZ9t12hpo/hq720.jpg",
    duration: "5분",
    likes: 15234,
    category: "korean",
    savedAt: "2일 전",
  },
  {
    id: "r2",
    title: "크림파스타 황금레시피",
    author: "자취생요리",
    thumbnail: "https://i.ytimg.com/vi/oc1bnLR38fE/hq720.jpg",
    duration: "15분",
    likes: 8921,
    category: "western",
    savedAt: "3일 전",
  },
  {
    id: "r3",
    title: "마약 옥수수",
    author: "요리왕비룡",
    thumbnail: "https://i.ytimg.com/vi/gQDByCdjUXw/hq720.jpg",
    duration: "10분",
    likes: 5629,
    category: "quick",
    savedAt: "1주 전",
  },
  {
    id: "r4",
    title: "뚝딱이형 속도 요리",
    author: "1분요리 뚝딱이형",
    thumbnail: "https://i.ytimg.com/vi/ZPFVC78A2jM/hq720.jpg",
    duration: "3분",
    likes: 22847,
    category: "quick",
    savedAt: "1주 전",
  },
  {
    id: "r5",
    title: "편스토랑 류수영 꿀팁",
    author: "KBS 편스토랑",
    thumbnail: "https://i.ytimg.com/vi/NnhIbr5lmEg/hq720.jpg",
    duration: "8분",
    likes: 12453,
    category: "korean",
    savedAt: "2주 전",
  },
  {
    id: "r6",
    title: "건강한 샐러드 볼",
    author: "헬시쿡",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    duration: "10분",
    likes: 3421,
    category: "healthy",
    savedAt: "2주 전",
  },
];

// 레시피 카드 컴포넌트
function RecipeCard({
  recipe,
  onPress,
}: {
  recipe: typeof SAVED_RECIPES[0];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: "48%",
        marginBottom: Spacing.md,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.neutral[0],
          borderRadius: BorderRadius.xl,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* 썸네일 */}
        <View style={{ aspectRatio: 3 / 4, position: "relative" }}>
          <Image
            source={{ uri: recipe.thumbnail }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          {/* 시간 배지 */}
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: BorderRadius.sm,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={10} color="#FFF" />
            <Text
              style={{
                color: "#FFF",
                fontSize: 10,
                fontWeight: "600",
                marginLeft: 3,
              }}
            >
              {recipe.duration}
            </Text>
          </View>
          {/* 더보기 버튼 */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 12,
              padding: 4,
            }}
            activeOpacity={0.7}
          >
            <MoreVertical size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        {/* 정보 */}
        <View style={{ padding: Spacing.sm }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.neutral[900],
            }}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <Text
            style={{
              fontSize: Typography.fontSize.xs,
              color: Colors.neutral[500],
              marginTop: 2,
            }}
          >
            {recipe.author}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Heart size={10} color={Colors.primary[500]} fill={Colors.primary[500]} />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[500],
                marginLeft: 3,
              }}
            >
              {recipe.likes.toLocaleString()}
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[400],
                marginLeft: "auto",
              }}
            >
              {recipe.savedAt}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeBookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 카테고리별 필터링
  const filteredRecipes =
    selectedCategory === "all"
      ? SAVED_RECIPES
      : SAVED_RECIPES.filter((r) => r.category === selectedCategory);

  const handleRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleAddRecipe = () => {
    router.push("/(tabs)/add");
  };

  const handleSearch = () => {
    router.push("/(tabs)/explore");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BookOpen size={24} color={Colors.primary[500]} />
          <Text
            style={{
              fontSize: Typography.fontSize["2xl"],
              fontWeight: "700",
              color: Colors.neutral[900],
              marginLeft: Spacing.sm,
            }}
          >
            레시피북
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={handleSearch}
            activeOpacity={0.7}
            style={{
              padding: 8,
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.full,
            }}
          >
            <Search size={20} color={Colors.neutral[700]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddRecipe}
            activeOpacity={0.7}
            style={{
              padding: 8,
              backgroundColor: Colors.primary[500],
              borderRadius: BorderRadius.full,
            }}
          >
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 50 }}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          gap: 8,
        }}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: BorderRadius.full,
              backgroundColor:
                selectedCategory === category.id
                  ? Colors.primary[500]
                  : Colors.neutral[0],
              borderWidth: 1,
              borderColor:
                selectedCategory === category.id
                  ? Colors.primary[500]
                  : Colors.neutral[200],
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 4 }}>{category.emoji}</Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color:
                  selectedCategory === category.id
                    ? "#FFF"
                    : Colors.neutral[700],
              }}
            >
              {category.name}
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color:
                  selectedCategory === category.id
                    ? "rgba(255,255,255,0.8)"
                    : Colors.neutral[400],
                marginLeft: 4,
              }}
            >
              {category.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 레시피 그리드 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: 120,
        }}
      >
        {/* 레시피 수 표시 */}
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: Colors.neutral[500],
            marginBottom: Spacing.md,
          }}
        >
          {filteredRecipes.length}개의 레시피
        </Text>

        {/* 레시피 그리드 */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => handleRecipePress(recipe.id)}
            />
          ))}
        </View>

        {/* 빈 상태 */}
        {filteredRecipes.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing["4xl"],
            }}
          >
            <ChefHat size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginTop: Spacing.md,
              }}
            >
              저장된 레시피가 없어요
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                marginTop: Spacing.xs,
                textAlign: "center",
              }}
            >
              마음에 드는 레시피를 저장해보세요
            </Text>
            <TouchableOpacity
              onPress={handleSearch}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary[500],
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: BorderRadius.full,
                marginTop: Spacing.lg,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                레시피 찾아보기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
