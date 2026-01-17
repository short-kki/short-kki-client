import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

const mockMeals = {
  15: [
    { type: "아침", recipe: "그릭요거트 볼", emoji: "🥣" },
    { type: "점심", recipe: "닭가슴살 샐러드", emoji: "🥗" },
  ],
  16: [
    { type: "아침", recipe: "토스트", emoji: "🍞" },
    { type: "점심", recipe: "김치볶음밥", emoji: "🍳" },
    { type: "저녁", recipe: "된장찌개", emoji: "🍲" },
  ],
  17: [{ type: "점심", recipe: "파스타", emoji: "🍝" }],
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const today = 17;

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <View
      className="flex-1 bg-cream"
      style={{ paddingTop: insets.top, backgroundColor: "#F9F5F0" }}
    >
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-dark-gray">식단 캘린더</Text>
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: "#FF6B00" }}
        >
          <Plus size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Month Navigator */}
      <View className="flex-row items-center justify-center py-4 gap-6">
        <Pressable className="p-2">
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-xl font-bold text-dark-gray">2025년 1월</Text>
        <Pressable className="p-2">
          <ChevronRight size={24} color="#1A1A1A" />
        </Pressable>
      </View>

      {/* Week Days Header */}
      <View className="flex-row px-2 mb-2">
        {weekDays.map((day, index) => (
          <View key={index} className="flex-1 items-center py-2">
            <Text
              className={`text-sm font-medium ${
                index === 0 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap px-2">
          {/* Empty cells for January 2025 (starts on Wednesday) */}
          {[0, 1, 2].map((_, index) => (
            <View key={`empty-${index}`} className="w-[14.28%] h-20" />
          ))}

          {days.map((day) => {
            const hasMeals = mockMeals[day as keyof typeof mockMeals];
            const isToday = day === today;

            return (
              <Pressable
                key={day}
                className={`w-[14.28%] h-20 items-center py-1 ${
                  isToday ? "bg-orange-50 rounded-xl" : ""
                }`}
              >
                <Text
                  className={`text-sm font-medium mb-1 ${
                    isToday ? "text-primary" : "text-dark-gray"
                  }`}
                  style={isToday ? { color: "#FF6B00" } : {}}
                >
                  {day}
                </Text>
                {hasMeals && (
                  <View className="flex-row gap-0.5">
                    {hasMeals.slice(0, 3).map((meal, index) => (
                      <Text key={index} className="text-xs">
                        {meal.emoji}
                      </Text>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Today's Meals */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-bold text-dark-gray mb-4">
            오늘의 식단
          </Text>
          {mockMeals[17]?.map((meal, index) => (
            <View
              key={index}
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
            >
              <Text className="text-3xl mr-4">{meal.emoji}</Text>
              <View>
                <Text className="text-gray-500 text-sm">{meal.type}</Text>
                <Text className="text-dark-gray font-bold text-base">
                  {meal.recipe}
                </Text>
              </View>
            </View>
          )) || (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-gray-400">아직 등록된 식단이 없어요</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}
