import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Plus,
  ChefHat,
  Flame,
  Clock,
  Sparkles,
  Check,
  Heart,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 요일 데이터 생성 (이번 주)
const generateWeekDays = () => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일 시작

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;

    return {
      id: date.toISOString().split("T")[0],
      day: days[i],
      date: date.getDate(),
      isToday,
      isPast,
      fullDate: date,
    };
  });
};

// 더미 식단 데이터
const DUMMY_MEALS: Record<string, Meal[]> = {
  "2026-01-19": [
    {
      id: "m1",
      title: "귀찮은 주말아침! 영양가득한 5분 완성 '머그컵밥'",
      mealType: "아침",
      thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
      duration: "5분",
      completed: false,
    },
    {
      id: "m2",
      title: "Instant Pot Chicken Pot Pie Casserole",
      mealType: "저녁",
      thumbnail: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400",
      duration: "25분",
      completed: true,
    },
  ],
  "2026-01-20": [
    {
      id: "m3",
      title: "바삭바삭 통닭구이",
      mealType: "저녁",
      thumbnail: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400",
      duration: "40분",
      completed: true,
    },
  ],
  "2026-01-21": [
    {
      id: "m4",
      title: "연어 아보카도 포케볼",
      mealType: "점심",
      thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      duration: "15분",
      completed: false,
    },
  ],
  "2026-01-22": [],
  "2026-01-23": [
    {
      id: "m5",
      title: "크림 파스타",
      mealType: "저녁",
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
      duration: "20분",
      completed: false,
    },
  ],
  "2026-01-24": [
    {
      id: "m6",
      title: "간단 김치볶음밥",
      mealType: "점심",
      thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
      duration: "10분",
      completed: false,
    },
    {
      id: "m7",
      title: "된장찌개",
      mealType: "저녁",
      thumbnail: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400",
      duration: "30분",
      completed: false,
    },
  ],
  "2026-01-25": [],
};

// 찜 목록 데이터
const SAVED_RECIPES = [
  {
    id: "s1",
    title: "매콤 닭갈비",
    thumbnail: "https://images.unsplash.com/photo-1567121938596-cf1366fb926a?w=200",
  },
  {
    id: "s2",
    title: "토마토 리조또",
    thumbnail: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200",
  },
  {
    id: "s3",
    title: "새우 볶음면",
    thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200",
  },
];

interface Meal {
  id: string;
  title: string;
  mealType: string;
  thumbnail: string;
  duration: string;
  completed: boolean;
}

export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const weekDays = generateWeekDays();
  const todayId = weekDays.find(d => d.isToday)?.id || weekDays[0].id;

  const [selectedDate, setSelectedDate] = useState(todayId);
  const [meals, setMeals] = useState(DUMMY_MEALS);
  const [showSaved, setShowSaved] = useState(false);

  const selectedMeals = meals[selectedDate] || [];
  const completedCount = Object.values(meals).flat().filter(m => m.completed).length;
  const totalCount = Object.values(meals).flat().length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleMealComplete = (mealId: string) => {
    setMeals(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate]?.map(meal =>
        meal.id === mealId ? { ...meal, completed: !meal.completed } : meal
      ) || [],
    }));
  };

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "아침": return "#FFB347";
      case "점심": return "#87CEEB";
      case "저녁": return "#DDA0DD";
      default: return Colors.primary[500];
    }
  };

  const handleAddMeal = () => {
    Alert.alert(
      "식단 추가",
      "어떤 방식으로 추가할까요?",
      [
        {
          text: "레시피북에서 선택",
          onPress: () => router.push("/(tabs)/recipe-book"),
        },
        {
          text: "쇼츠에서 찾기",
          onPress: () => router.push("/(tabs)/shorts"),
        },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const handleSavedRecipePress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleRecommendationPress = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFEFE" }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* 헤더 - 이번 주 진행률 */}
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 14, color: Colors.neutral[500], marginBottom: 4 }}>
                이번 주 요리
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: Colors.neutral[900] }}>
                {completedCount}/{totalCount} <Text style={{ fontSize: 18, fontWeight: "500" }}>완료</Text>
              </Text>
            </View>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: Colors.primary[50],
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Flame size={28} color={Colors.primary[500]} />
            </View>
          </View>

          {/* 진행 바 */}
          <View style={{
            marginTop: Spacing.lg,
            height: 8,
            backgroundColor: Colors.neutral[100],
            borderRadius: 4,
            overflow: "hidden",
          }}>
            <View style={{
              height: "100%",
              width: `${progressPercent}%`,
              backgroundColor: Colors.primary[500],
              borderRadius: 4,
            }} />
          </View>
        </View>

        {/* 주간 날짜 선택 */}
        <View style={{ marginTop: Spacing.xl }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: 8,
            }}
          >
            {weekDays.map((day) => {
              const isSelected = selectedDate === day.id;
              const hasMeals = (meals[day.id]?.length || 0) > 0;
              const allCompleted = meals[day.id]?.every(m => m.completed) && hasMeals;

              return (
                <Pressable
                  key={day.id}
                  onPress={() => setSelectedDate(day.id)}
                  style={{
                    width: (SCREEN_WIDTH - 32 - 48) / 7,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.xl,
                    backgroundColor: isSelected
                      ? Colors.primary[500]
                      : day.isToday
                        ? Colors.primary[50]
                        : "transparent",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: isSelected
                      ? "#FFFFFF"
                      : day.isPast
                        ? Colors.neutral[400]
                        : Colors.neutral[600],
                    marginBottom: 6,
                  }}>
                    {day.day}
                  </Text>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: isSelected || day.isToday ? "700" : "500",
                    color: isSelected
                      ? "#FFFFFF"
                      : day.isToday
                        ? Colors.primary[600]
                        : day.isPast
                          ? Colors.neutral[400]
                          : Colors.neutral[900],
                  }}>
                    {day.date}
                  </Text>

                  {/* 식단 인디케이터 */}
                  {hasMeals && !isSelected && (
                    <View style={{
                      position: "absolute",
                      bottom: 6,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: allCompleted ? "#4CAF50" : Colors.primary[400],
                    }} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* 찜 목록 토글 */}
        <Pressable
          onPress={() => setShowSaved(!showSaved)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: Spacing.xl,
            marginTop: Spacing.xl,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            backgroundColor: Colors.neutral[50],
            borderRadius: BorderRadius.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Heart size={18} color={Colors.primary[500]} fill={Colors.primary[500]} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[800] }}>
              찜한 레시피
            </Text>
            <View style={{
              backgroundColor: Colors.primary[100],
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.primary[600] }}>
                {SAVED_RECIPES.length}
              </Text>
            </View>
          </View>
          <Sparkles size={16} color={Colors.neutral[400]} />
        </Pressable>

        {/* 찜 목록 (펼쳐졌을 때) */}
        {showSaved && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: Spacing.md }}
            contentContainerStyle={{
              paddingHorizontal: Spacing.xl,
              gap: Spacing.sm,
            }}
          >
            {SAVED_RECIPES.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                activeOpacity={0.8}
                onPress={() => handleSavedRecipePress(recipe.id)}
                style={{
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: recipe.thumbnail }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                  }}
                  contentFit="cover"
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.neutral[700],
                    marginTop: 6,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {recipe.title}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/shorts")}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: Colors.neutral[300],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Plus size={24} color={Colors.neutral[400]} />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* 선택된 날짜의 식단 */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900] }}>
              {weekDays.find(d => d.id === selectedDate)?.isToday
                ? "오늘의 식단"
                : `${weekDays.find(d => d.id === selectedDate)?.date}일 식단`}
            </Text>
            <TouchableOpacity
              onPress={handleAddMeal}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.full,
              }}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#FFFFFF" }}>
                추가
              </Text>
            </TouchableOpacity>
          </View>

          {selectedMeals.length > 0 ? (
            <View style={{ gap: Spacing.md }}>
              {selectedMeals.map((meal, index) => (
                <Pressable
                  key={meal.id}
                  onPress={() => router.push(`/recipe/${meal.id}`)}
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#FFFFFF",
                    borderRadius: BorderRadius.xl,
                    padding: Spacing.md,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                    opacity: meal.completed ? 0.7 : 1,
                  }}
                >
                  {/* 썸네일 */}
                  <View style={{ position: "relative" }}>
                    <Image
                      source={{ uri: meal.thumbnail }}
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 12,
                      }}
                      contentFit="cover"
                    />
                    {meal.completed && (
                      <View style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <Check size={32} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  {/* 정보 */}
                  <View style={{ flex: 1, marginLeft: Spacing.md, justifyContent: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: getMealTypeColor(meal.mealType) + "30",
                        borderRadius: 6,
                      }}>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: getMealTypeColor(meal.mealType),
                        }}>
                          {meal.mealType}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Clock size={12} color={Colors.neutral[400]} />
                        <Text style={{ fontSize: 11, color: Colors.neutral[500] }}>
                          {meal.duration}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: Colors.neutral[900],
                        lineHeight: 20,
                        textDecorationLine: meal.completed ? "line-through" : "none",
                      }}
                      numberOfLines={2}
                    >
                      {meal.title}
                    </Text>
                  </View>

                  {/* 완료 버튼 */}
                  <Pressable
                    onPress={() => toggleMealComplete(meal.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: meal.completed ? Colors.primary[500] : Colors.neutral[100],
                      justifyContent: "center",
                      alignItems: "center",
                      alignSelf: "center",
                    }}
                  >
                    <Check
                      size={18}
                      color={meal.completed ? "#FFFFFF" : Colors.neutral[400]}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : (
            /* 빈 상태 */
            <View style={{
              paddingVertical: Spacing["3xl"],
              alignItems: "center",
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}>
                <ChefHat size={36} color={Colors.neutral[400]} />
              </View>
              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: Colors.neutral[600],
                marginBottom: 4,
              }}>
                아직 식단이 없어요
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.neutral[400],
                marginBottom: Spacing.lg,
              }}>
                찜한 레시피를 추가해보세요
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddMeal}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.full,
                }}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
                  레시피 추가하기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 추천 섹션 */}
        <View style={{ marginTop: Spacing["2xl"], paddingBottom: 120 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: Spacing.xl,
            marginBottom: Spacing.md,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} color={Colors.primary[500]} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.neutral[900] }}>
                이런 레시피는 어때요?
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.xl,
              gap: Spacing.md,
            }}
          >
            {[
              { id: "r1", title: "15분 완성 돈까스", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f25?w=300" },
              { id: "r2", title: "초간단 계란찜", image: "https://images.unsplash.com/photo-1482049016gy-2d3e7fd9b1e3?w=300" },
              { id: "r3", title: "원팬 치킨 스테이크", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300" },
            ].map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                activeOpacity={0.8}
                onPress={() => handleRecommendationPress(recipe.id)}
                style={{
                  width: 160,
                  backgroundColor: "#FFFFFF",
                  borderRadius: BorderRadius.xl,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Image
                  source={{ uri: recipe.image }}
                  style={{ width: 160, height: 100 }}
                  contentFit="cover"
                />
                <View style={{ padding: Spacing.sm }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[900] }}
                    numberOfLines={1}
                  >
                    {recipe.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
