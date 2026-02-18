import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Clock,
} from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/design-system";
import { useRecipeCalendar } from "@/hooks";
import type { CalendarMeal } from "@/data/mock";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const getMonthCalendar = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: Date[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month + 1, nextDay++));
  }
  return cells;
};

const formatDateId = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const EMPTY_MEALS: CalendarMeal[] = [];

export default function GroupCalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(formatDateId(today));
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });

  // 월간 뷰 기준 조회 기간
  const dateRange = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.year, viewMonth.month, 1);
    const lastOfMonth = new Date(viewMonth.year, viewMonth.month + 1, 0);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(gridEnd.getDate() + (6 - lastOfMonth.getDay()));
    return {
      startDate: formatDateId(gridStart),
      endDate: formatDateId(gridEnd),
    };
  }, [viewMonth]);

  const { groupMealsByGroup, loading, error, refetch } = useRecipeCalendar(dateRange.startDate, dateRange.endDate);

  // 해당 그룹의 식단만 필터링
  const groupMeals = useMemo(() => {
    if (!params.groupId) return {};
    return groupMealsByGroup[params.groupId] || {};
  }, [groupMealsByGroup, params.groupId]);

  const selectedMeals = groupMeals[selectedDate] ?? EMPTY_MEALS;

  // 월간 캘린더
  const monthCalendar = useMemo(() => getMonthCalendar(viewMonth.year, viewMonth.month), [viewMonth]);
  const monthRows = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < monthCalendar.length; i += 7) {
      rows.push(monthCalendar.slice(i, i + 7));
    }
    return rows;
  }, [monthCalendar]);

  // 식단 있는 날짜
  const datesWithMeals = useMemo(() => {
    const set = new Set<string>();
    for (const dateId of Object.keys(groupMeals)) {
      if (groupMeals[dateId].length > 0) set.add(dateId);
    }
    return set;
  }, [groupMeals]);

  const monthLabel = `${viewMonth.year}년 ${viewMonth.month + 1}월`;

  const navigateMonth = useCallback((direction: number) => {
    setViewMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      if (newMonth > 11) { newMonth = 0; newYear++; }
      return { year: newYear, month: newMonth };
    });
  }, []);

  const selectedDayLabel = useMemo(() => {
    const parts = selectedDate.split("-");
    return `${parseInt(parts[1])}월 ${parseInt(parts[2])}일 식단`;
  }, [selectedDate]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFEFE", paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
        </Pressable>
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            식단표
          </Text>
          {params.groupName && (
            <Text
              style={{
                fontSize: 13,
                color: Colors.neutral[500],
                marginTop: 2,
              }}
            >
              {params.groupName}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 월 네비게이션 */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.sm,
        }}>
          <Pressable
            onPress={() => navigateMonth(-1)}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={20} color={Colors.neutral[600]} />
          </Pressable>

          <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.neutral[900] }}>
            {monthLabel}
          </Text>

          <Pressable
            onPress={() => navigateMonth(1)}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronRight size={20} color={Colors.neutral[600]} />
          </Pressable>
        </View>

        {/* 월간 캘린더 */}
        <View style={{
          marginTop: Spacing.md,
          paddingHorizontal: Spacing.lg,
        }}>
          {/* 요일 헤더 */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
            {DAY_LABELS.map((label) => (
              <View key={label} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: Colors.neutral[400],
                }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={{ gap: 4 }}>
            {monthRows.map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: "row", gap: 6 }}>
                {row.map((date, colIndex) => {
                  const dateId = formatDateId(date);
                  const isSelected = selectedDate === dateId;
                  const isToday = date.toDateString() === today.toDateString();
                  const hasMeals = datesWithMeals.has(dateId);
                  const isSunday = colIndex === 0;
                  const isOtherMonth = date.getMonth() !== viewMonth.month;

                  return (
                    <Pressable
                      key={dateId}
                      onPress={() => setSelectedDate(dateId)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.xl,
                        alignItems: "center",
                        position: "relative",
                        backgroundColor: isSelected
                          ? Colors.primary[500]
                          : isToday
                            ? Colors.neutral[100]
                            : "transparent",
                      }}
                    >
                      <Text style={{
                        fontSize: 17,
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected
                          ? "#FFFFFF"
                          : isOtherMonth
                            ? Colors.neutral[300]
                            : isSunday
                              ? "#F0816C"
                              : Colors.neutral[800],
                      }}>
                        {date.getDate()}
                      </Text>
                      {hasMeals && (
                        <View style={{
                          position: "absolute",
                          bottom: 5,
                          width: 5,
                          height: 5,
                          borderRadius: 2.5,
                          backgroundColor: isSelected ? "#FFFFFF" : "#66BB6A",
                        }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* 구분선 */}
        <View style={{
          height: 1,
          backgroundColor: Colors.neutral[100],
          marginHorizontal: Spacing.xl,
          marginTop: Spacing.lg,
        }} />

        {/* 선택된 날짜의 식단 */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900], marginBottom: Spacing.md }}>
            {selectedDayLabel}
          </Text>

          {/* 로딩 상태 */}
          {loading && (
            <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
              <ActivityIndicator size="small" color={Colors.neutral[400]} />
              <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: Spacing.xs }}>
                식단을 불러오는 중...
              </Text>
            </View>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
              <Text style={{ fontSize: 13, color: Colors.error.main, marginBottom: Spacing.xs }}>
                식단을 불러오지 못했어요
              </Text>
              <Pressable onPress={() => refetch({ force: true })}>
                <Text style={{ fontSize: 13, color: Colors.primary[500], fontWeight: "600" }}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {/* 식단 목록 */}
          {!loading && !error && (
            selectedMeals.length > 0 ? (
              <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
                {selectedMeals.map((meal) => (
                  <Pressable
                    key={meal.id}
                    onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#FFFFFF",
                      borderRadius: BorderRadius.xl,
                      padding: Spacing.md,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    {meal.mainImgUrl && meal.mainImgUrl.trim() ? (
                      <Image
                        source={{ uri: meal.mainImgUrl }}
                        style={{ width: 72, height: 72, borderRadius: 12 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        backgroundColor: Colors.neutral[200],
                        justifyContent: "center",
                        alignItems: "center",
                      }}>
                        <ChefHat size={24} color={Colors.neutral[400]} />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: Spacing.md, justifyContent: "center" }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900], lineHeight: 20, marginBottom: 6 }}
                        numberOfLines={2}
                      >
                        {meal.recipeTitle}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Clock size={13} color={Colors.neutral[400]} />
                        <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
                          {meal.cookingTime ? `${meal.cookingTime}분` : "-"}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: Spacing["3xl"], alignItems: "center" }}>
                <ChefHat size={32} color={Colors.neutral[300]} />
                <Text style={{ fontSize: 14, color: Colors.neutral[400], marginTop: Spacing.sm }}>
                  등록된 식단이 없어요
                </Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/(tabs)/meal-plan', params: { date: selectedDate, tab: 'group' } })}
                  style={{
                    marginTop: Spacing.lg,
                    paddingHorizontal: Spacing.xl,
                    paddingVertical: Spacing.md,
                    backgroundColor: Colors.primary[500],
                    borderRadius: BorderRadius.xl,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                    식단표에서 추가하기
                  </Text>
                </Pressable>
              </View>
            )
          )}
        </View>

        {/* 하단 여백 */}
        <View style={{ paddingBottom: Spacing["3xl"] }} />
      </ScrollView>
    </View>
  );
}
