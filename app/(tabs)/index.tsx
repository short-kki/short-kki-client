import { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, Share2, Plus, User } from "lucide-react-native";
import { mockRecipes, Recipe } from "@/data/mock-recipes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function formatLikes(likes: number): string {
  if (likes >= 1000) {
    return (likes / 1000).toFixed(1) + "K";
  }
  return likes.toString();
}

interface RecipeCardProps {
  recipe: Recipe;
  isActive: boolean;
}

function RecipeCard({ recipe, isActive }: RecipeCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(recipe.likes);
  const [queued, setQueued] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
  };

  const handleQueue = () => {
    setQueued(!queued);
  };

  return (
    <View
      className="flex-1 relative"
      style={{
        height: SCREEN_HEIGHT,
        backgroundColor: recipe.backgroundColor,
      }}
    >
      {/* Video Placeholder Area */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-white/30 text-lg">Video Placeholder</Text>
      </View>

      {/* Right Side Interaction Buttons */}
      <View
        className="absolute right-4 items-center gap-6"
        style={{ bottom: insets.bottom + 100 }}
      >
        {/* Profile Image */}
        <Pressable className="items-center">
          <View className="w-12 h-12 rounded-full bg-white/20 overflow-hidden border-2 border-white">
            <Image
              source={{ uri: recipe.author.profileImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        </Pressable>

        {/* Like Button */}
        <Pressable className="items-center" onPress={handleLike}>
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${
              liked ? "bg-red-500/20" : "bg-white/10"
            }`}
          >
            <Heart
              size={28}
              color={liked ? "#EF4444" : "#FFFFFF"}
              fill={liked ? "#EF4444" : "transparent"}
            />
          </View>
          <Text className="text-white text-xs mt-1 font-medium">
            {formatLikes(likeCount)}
          </Text>
        </Pressable>

        {/* Queue Button (Primary Action) */}
        <Pressable className="items-center" onPress={handleQueue}>
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${
              queued ? "bg-primary" : "bg-primary"
            }`}
            style={{ backgroundColor: "#FF6B00" }}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={queued ? 3 : 2} />
          </View>
          <Text className="text-white text-xs mt-1 font-medium">
            {queued ? "담김" : "큐담기"}
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable className="items-center">
          <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
            <Share2 size={26} color="#FFFFFF" />
          </View>
          <Text className="text-white text-xs mt-1 font-medium">공유</Text>
        </Pressable>
      </View>

      {/* Bottom Left Text Overlay */}
      <View
        className="absolute left-4 right-20"
        style={{ bottom: insets.bottom + 100 }}
      >
        {/* Recipe Title */}
        <Text className="text-white text-xl font-bold mb-2">
          {recipe.title}
        </Text>

        {/* Author Name */}
        <View className="flex-row items-center mb-3">
          <User size={14} color="#FFFFFF" />
          <Text className="text-white/80 text-sm ml-1">
            @{recipe.author.name}
          </Text>
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2">
          {recipe.tags.map((tag, index) => (
            <View
              key={index}
              className="bg-white/20 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm">#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={mockRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RecipeCard recipe={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}
