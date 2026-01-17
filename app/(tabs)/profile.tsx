import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Heart, Bookmark, ChefHat } from "lucide-react-native";

const stats = [
  { label: "레시피", value: 12 },
  { label: "팔로워", value: 234 },
  { label: "팔로잉", value: 89 },
];

const myRecipes = [
  { id: "1", title: "마약토스트", likes: 156, backgroundColor: "#4A5568" },
  { id: "2", title: "계란볶음밥", likes: 89, backgroundColor: "#2D3748" },
  { id: "3", title: "원팬파스타", likes: 234, backgroundColor: "#553C9A" },
  { id: "4", title: "김치찌개", likes: 312, backgroundColor: "#744210" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-cream"
      style={{ paddingTop: insets.top, backgroundColor: "#F9F5F0" }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-2xl font-bold text-dark-gray">프로필</Text>
          <Pressable className="p-2">
            <Settings size={24} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Profile Info */}
        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4">
            <Image
              source={{ uri: "https://i.pravatar.cc/200?img=10" }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <Text className="text-xl font-bold text-dark-gray mb-1">
            요리조리
          </Text>
          <Text className="text-gray-500 mb-4">
            자취 5년차 집밥 마스터
          </Text>

          {/* Stats */}
          <View className="flex-row gap-8">
            {stats.map((stat, index) => (
              <View key={index} className="items-center">
                <Text className="text-xl font-bold text-dark-gray">
                  {stat.value}
                </Text>
                <Text className="text-gray-500 text-sm">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-4 gap-3 mb-6">
          <Pressable
            className="flex-1 py-3 rounded-2xl items-center"
            style={{ backgroundColor: "#FF6B00" }}
          >
            <Text className="text-white font-bold">프로필 편집</Text>
          </Pressable>
          <Pressable className="flex-1 py-3 rounded-2xl items-center bg-white border border-gray-200">
            <Text className="text-dark-gray font-bold">공유</Text>
          </Pressable>
        </View>

        {/* Quick Links */}
        <View className="flex-row px-4 mb-6 gap-3">
          <Pressable className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <Heart size={24} color="#FF6B00" />
            <Text className="text-dark-gray font-medium mt-2">좋아요</Text>
          </Pressable>
          <Pressable className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <Bookmark size={24} color="#FF6B00" />
            <Text className="text-dark-gray font-medium mt-2">저장됨</Text>
          </Pressable>
          <Pressable className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm">
            <ChefHat size={24} color="#FF6B00" />
            <Text className="text-dark-gray font-medium mt-2">큐</Text>
          </Pressable>
        </View>

        {/* My Recipes */}
        <View className="px-4">
          <Text className="text-lg font-bold text-dark-gray mb-4">
            내 레시피
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {myRecipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                className="w-[48%] aspect-[3/4] rounded-2xl overflow-hidden"
                style={{ backgroundColor: recipe.backgroundColor }}
              >
                <View className="flex-1 justify-end p-3">
                  <Text className="text-white font-bold">{recipe.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Heart size={12} color="#FFFFFF" fill="#FFFFFF" />
                    <Text className="text-white/80 text-xs ml-1">
                      {recipe.likes}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}
