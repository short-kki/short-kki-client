import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions,
  Animated as RNAnimated,
  Easing,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import {
  Plus,
  ChefHat,
  Clock,
  EllipsisVertical,
  Trash2,
  ListPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  List,
  Minus,
  User,
  Users,
} from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/design-system";
import { useRecipeCalendar, useRecipeQueue } from "@/hooks";
import type { CalendarMeal } from "@/data/mock";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 임시 ID는 음수로 시작해서 서버 ID(양수)와 충돌 방지
let _tempIdCounter = -1;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================================
// 날짜 유틸리티
// ============================================================================

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekOfMonth = (date: Date): number => {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstOfMonth.getDay();
  return Math.ceil((date.getDate() + firstDayOfWeek) / 7);
};

const getWeekDays = (weekStart: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    return {
      id: formatDateId(date),
      day: DAY_LABELS[i],
      date: date.getDate(),
      isToday,
      isPast,
      fullDate: date,
    };
  });
};

const getMonthCalendar = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

const formatDateId = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const EMPTY_MEALS: CalendarMeal[] = [];

// ============================================================================
// 드랍 플레이스홀더
// ============================================================================

const DropPlaceholder = React.memo(function DropPlaceholder() {
  return (
    <View style={{
      flexDirection: "row",
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 2,
      borderColor: Colors.primary[300],
      borderStyle: "dashed",
      backgroundColor: Colors.primary[50],
      alignItems: "center",
      marginBottom: Spacing.md,
    }}>
      <View style={{
        width: 72,
        height: 72,
        borderRadius: 12,
        backgroundColor: Colors.primary[100],
        justifyContent: "center",
        alignItems: "center",
      }}>
        <Plus size={22} color={Colors.primary[400]} />
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[400] }}>
          여기에 놓아서 추가
        </Text>
      </View>
    </View>
  );
});

// ============================================================================
// 드래그 가능한 대기열 아이템
// ============================================================================

interface DraggableQueueItemProps {
  recipe: { id: string; recipeId: string; title: string; thumbnail: string };
  isDragged: boolean;
  ghostX: Animated.SharedValue<number>;
  ghostY: Animated.SharedValue<number>;
  onDragStart: (recipe: { id: string; recipeId: string; title: string; thumbnail: string }, x: number, y: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: (y: number) => void;
  onDelete: (id: string) => void;
  onPress: (recipeId: string) => void;
}

const DraggableQueueItem = React.memo(function DraggableQueueItem({
  recipe,
  isDragged,
  ghostX,
  ghostY,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDelete,
  onPress,
}: DraggableQueueItemProps) {
  const didEnd = useRef(false);
  const pan = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart((e) => {
      didEnd.current = false;
      runOnJS(onDragStart)(recipe, e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      ghostX.value = e.absoluteX;
      ghostY.value = e.absoluteY;
      runOnJS(onDragMove)(e.absoluteY);
    })
    .onEnd((e) => {
      didEnd.current = true;
      runOnJS(onDragEnd)(e.absoluteY);
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={{ width: 84, alignItems: "center", opacity: isDragged ? 0.3 : 1 }}>
        <View style={{ position: "relative" }}>
          <Pressable onPress={() => onPress(recipe.recipeId)}>
            <Image
              source={{ uri: recipe.thumbnail }}
              style={{ width: 76, height: 76, borderRadius: 16 }}
              contentFit="cover"
            />
          </Pressable>
          <Pressable
            onPress={() => onDelete(recipe.id)}
            hitSlop={4}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#FEE2E2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Minus size={12} color="#EF4444" strokeWidth={3} />
          </Pressable>
        </View>
        <Text
          style={{
            fontSize: 11,
            color: Colors.neutral[700],
            marginTop: 4,
            textAlign: "center",
            width: 80,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {recipe.title}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
});

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export default function MealPlanScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(formatDateId(today));
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(today));
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [viewMonth, setViewMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [localMeals, setLocalMeals] = useState<Record<string, CalendarMeal[]>>({});
  const [localGroupMeals, setLocalGroupMeals] = useState<Record<string, Record<string, CalendarMeal[]>>>({});
  const [showQueue, setShowQueue] = useState(false);
  const [showPersonalMeals, setShowPersonalMeals] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<
    | { mealId: string; source: "personal" }
    | { mealId: string; source: "group"; groupId: string }
    | null
  >(null);

  // 활성 월 계산: 주간 뷰는 목요일 기준, 월간 뷰는 viewMonth
  const activeMonth = useMemo(() => {
    if (viewMode === "month") {
      return { year: viewMonth.year, month: viewMonth.month };
    }
    // 주간 뷰: 목요일(+3일) 기준
    const refDate = new Date(currentWeekStart);
    refDate.setDate(refDate.getDate() + 3);
    return { year: refDate.getFullYear(), month: refDate.getMonth() };
  }, [viewMode, viewMonth, currentWeekStart]);

  // 캘린더 API 훅
  const { personalMeals: apiMeals, groupMealsByGroup: apiGroupMeals, loading: calendarLoading, error: calendarError, refetch: refetchCalendar, deleteCalendarMeal } = useRecipeCalendar(activeMonth.year, activeMonth.month);

  // 대기열 API 훅
  const { queues: savedRecipes, loading: queueLoading, addQueue, deleteQueue, addToCalendar, refetch: refetchQueue } = useRecipeQueue();
  const queueInitializedRef = useRef(false);

  // 탭 포커스 시 대기열 새로고침
  useFocusEffect(
    useCallback(() => {
      refetchQueue();
    }, [refetchQueue])
  );

  // 대기열 초기 로드 완료 시 항목이 있으면 열기
  useEffect(() => {
    if (!queueLoading && !queueInitializedRef.current) {
      queueInitializedRef.current = true;
      if (savedRecipes.length > 0) {
        setShowQueue(true);
      }
    }
  }, [queueLoading, savedRecipes.length]);

  // API 데이터가 변경되면 localMeals 동기화
  useEffect(() => {
    setLocalMeals(apiMeals);
  }, [apiMeals]);
  useEffect(() => {
    setLocalGroupMeals(apiGroupMeals);
  }, [apiGroupMeals]);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const menuOverlayOpacity = useRef(new RNAnimated.Value(0)).current;
  const menuSheetTranslateY = useRef(new RNAnimated.Value(300)).current;

  const openMealMenu = useCallback((target: NonNullable<typeof menuTarget>) => {
    setMenuTarget(target);
    setMenuModalVisible(true);
    RNAnimated.parallel([
      RNAnimated.timing(menuOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      RNAnimated.timing(menuSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuOverlayOpacity, menuSheetTranslateY]);

  const closeMealMenu = useCallback(() => {
    RNAnimated.parallel([
      RNAnimated.timing(menuOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(menuSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuModalVisible(false);
    });
  }, [menuOverlayOpacity, menuSheetTranslateY]);

  // ========== 드래그 앤 드랍 ==========
  const [draggedRecipe, setDraggedRecipe] = useState<{ id: string; recipeId: string; title: string; thumbnail: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ type: "personal" } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const dragScale = useSharedValue(0);
  const personalSectionRef = useRef<View>(null);
  const personalLayout = useRef({ pageY: 0, height: 0, pageX: 0, width: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAutoScrollSpeed = useRef(0);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const monthCalendar = useMemo(() => getMonthCalendar(viewMonth.year, viewMonth.month), [viewMonth]);
  const monthRows = useMemo(() => {
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < monthCalendar.length; i += 7) {
      rows.push(monthCalendar.slice(i, i + 7));
    }
    return rows;
  }, [monthCalendar]);

  const selectedMeals = localMeals[selectedDate] ?? EMPTY_MEALS;

  // 그룹별 섹션 정보: groupId → { groupName, meals by date }
  const groupSections = useMemo(() => {
    const sections: { groupId: string; groupName: string; meals: Record<string, CalendarMeal[]> }[] = [];
    for (const [groupId, dateMap] of Object.entries(localGroupMeals)) {
      // 첫 번째 meal에서 groupName 추출
      const firstMeal = Object.values(dateMap).flat()[0];
      const groupName = firstMeal?.groupName || `그룹 ${groupId}`;
      sections.push({ groupId, groupName, meals: dateMap });
    }
    return sections;
  }, [localGroupMeals]);

  const datesWithMeals = useMemo(() => {
    const set = new Set<string>();
    for (const dateId of Object.keys(localMeals)) {
      if (localMeals[dateId].length > 0) set.add(dateId);
    }
    for (const group of groupSections) {
      for (const dateId of Object.keys(group.meals)) {
        if (group.meals[dateId].length > 0) set.add(dateId);
      }
    }
    return set;
  }, [localMeals, groupSections]);

  // 주차 라벨 (목요일 기준으로 월/주차 결정)
  const weekLabel = useMemo(() => {
    const refDate = new Date(currentWeekStart);
    refDate.setDate(refDate.getDate() + 3);
    const m = refDate.getMonth() + 1;
    const w = getWeekOfMonth(refDate);
    return `${m}월 ${w}주차`;
  }, [currentWeekStart]);

  const monthLabel = `${viewMonth.year}년 ${viewMonth.month + 1}월`;

  const measureDropZones = useCallback(() => {
    personalSectionRef.current?.measureInWindow((x, y, w, h) => {
      personalLayout.current = { pageX: x + w / 2, pageY: y, width: w, height: h };
    });
  }, []);

  const handleDragStart = useCallback((recipe: { id: string; recipeId: string; title: string; thumbnail: string }, x: number, y: number) => {
    setDraggedRecipe(recipe);
    setScrollEnabled(false);
    ghostX.value = x;
    ghostY.value = y;
    dragScale.value = withSpring(1.1);
    measureDropZones();
  }, [ghostX, ghostY, dragScale, measureDropZones]);

  const EDGE_THRESHOLD = 120;
  const MAX_SCROLL_SPEED = 12;

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    currentAutoScrollSpeed.current = 0;
  }, []);

  const startAutoScroll = useCallback((speed: number) => {
    if (autoScrollTimer.current && Math.abs(currentAutoScrollSpeed.current - speed) < 1) {
      return;
    }
    stopAutoScroll();
    currentAutoScrollSpeed.current = speed;
    autoScrollTimer.current = setInterval(() => {
      const newOffset = Math.max(0, scrollOffsetY.current + speed);
      scrollViewRef.current?.scrollTo({ y: newOffset, animated: false });
      measureDropZones();
    }, 16);
  }, [stopAutoScroll, measureDropZones]);

  const TAB_BAR_HEIGHT = 85;

  const handleDragMove = useCallback((y: number) => {
    const topEdge = insets.top;
    const bottomEdge = windowHeight - TAB_BAR_HEIGHT - insets.bottom;

    if (y < topEdge + EDGE_THRESHOLD) {
      const distFromEdge = Math.max(0, y - topEdge);
      const ratio = 1 - distFromEdge / EDGE_THRESHOLD;
      startAutoScroll(-MAX_SCROLL_SPEED * ratio);
    } else if (y > bottomEdge - EDGE_THRESHOLD) {
      const distFromEdge = Math.max(0, bottomEdge - y);
      const ratio = 1 - distFromEdge / EDGE_THRESHOLD;
      startAutoScroll(MAX_SCROLL_SPEED * ratio);
    } else {
      stopAutoScroll();
    }

    const pL = personalLayout.current;
    if (pL.height > 0 && y >= pL.pageY && y <= pL.pageY + pL.height) {
      setDropTarget(prev => prev?.type === "personal" ? prev : { type: "personal" });
      return;
    }
    setDropTarget(prev => prev === null ? prev : null);
  }, [startAutoScroll, stopAutoScroll, insets.top, insets.bottom, windowHeight]);

  const dropTargetRef = useRef(dropTarget);
  dropTargetRef.current = dropTarget;

  const completeDrop = useCallback(async () => {
    const recipe = draggedRecipeRef.current;
    const target = dropTargetRef.current;
    if (!recipe || !target) return;
    draggedRecipeRef.current = null;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // 낙관적 UI 업데이트 (임시 ID는 음수로 서버 ID와 충돌 방지)
    const tempId = _tempIdCounter--;
    const tempMeal: CalendarMeal = {
      id: tempId,
      recipeId: parseInt(recipe.recipeId),
      recipeTitle: recipe.title,
      mainImgUrl: recipe.thumbnail || null,
      scheduledDate: selectedDate,
      sortOrder: 0,
      groupId: null,
      groupName: null,
    };
    setLocalMeals(prev => ({
      ...prev,
      [selectedDate]: [tempMeal, ...(prev[selectedDate] || [])],
    }));
    setDraggedRecipe(null);
    setDropTarget(null);

    // API 호출: 대기열에서 캘린더로 추가
    try {
      const createdMeal = await addToCalendar(parseInt(recipe.id), selectedDate, null);
      if (createdMeal) {
        // API 응답으로 로컬 상태 업데이트 (임시 ID를 실제 ID로 교체)
        setLocalMeals(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].map(m =>
            m.id === tempId ? createdMeal : m
          ),
        }));
      }
    } catch (err) {
      console.error('캘린더 추가 실패:', err);
      // 실패 시 낙관적 업데이트 롤백
      setLocalMeals(prev => ({
        ...prev,
        [selectedDate]: prev[selectedDate].filter(m => m.id !== tempId),
      }));
    }
  }, [selectedDate, addToCalendar]);

  const cancelDrop = useCallback(() => {
    stopAutoScroll();
    setDraggedRecipe(null);
    setDropTarget(null);
  }, [stopAutoScroll]);

  const draggedRecipeRef = useRef(draggedRecipe);
  draggedRecipeRef.current = draggedRecipe;

  const handleDragEnd = useCallback((y: number) => {
    if (!draggedRecipeRef.current) return;

    stopAutoScroll();
    setScrollEnabled(true);
    const pL = personalLayout.current;
    const overPersonal = pL.height > 0 && y >= pL.pageY && y <= pL.pageY + pL.height;

    if (overPersonal) {
      const targetY = pL.pageY + 52;
      const targetX = pL.pageX;
      ghostX.value = withSpring(targetX, { damping: 20, stiffness: 200 });
      ghostY.value = withSpring(targetY, { damping: 20, stiffness: 200 });
      dragScale.value = withDelay(100, withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(completeDrop)();
        }
      }));
    } else {
      dragScale.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished) {
          runOnJS(cancelDrop)();
        }
      });
    }
  }, [dragScale, ghostY, ghostX, completeDrop, cancelDrop, stopAutoScroll]);

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ghostX.value - 38 },
      { translateY: ghostY.value - 38 },
      { scale: dragScale.value },
    ],
    opacity: dragScale.value,
  }));

  // ========== 타이머 정리 ==========

  useEffect(() => {
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  // ========== 핸들러 ==========

  const navigateWeek = useCallback((direction: number) => {
    setCurrentWeekStart(prev => {
      const newStart = new Date(prev);
      newStart.setDate(newStart.getDate() + direction * 7);
      return newStart;
    });
  }, []);

  const navigateMonth = useCallback((direction: number) => {
    setViewMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth < 0) { newMonth = 11; newYear--; }
      if (newMonth > 11) { newMonth = 0; newYear++; }
      return { year: newYear, month: newMonth };
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (viewMode === "week") {
      const refDate = new Date(currentWeekStart);
      refDate.setDate(refDate.getDate() + 3);
      setViewMonth({ year: refDate.getFullYear(), month: refDate.getMonth() });
      setViewMode("month");
    } else {
      setViewMode("week");
    }
  }, [viewMode, currentWeekStart]);

  const selectDateFromMonth = useCallback((date: Date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(formatDateId(date));
    setCurrentWeekStart(getStartOfWeek(date));
    setViewMode("week");
  }, []);

  const handleSavedRecipePress = useCallback((recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  }, [router]);

  const handleQueueDelete = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    deleteQueue(parseInt(id));
  }, [deleteQueue]);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const selectedDayLabel = useMemo(() => {
    const sel = weekDays.find(d => d.id === selectedDate);
    if (sel?.isToday) return "오늘의 식단";
    const parts = selectedDate.split("-");
    return `${parseInt(parts[1])}월 ${parseInt(parts[2])}일 식단`;
  }, [selectedDate, weekDays]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFEFE" }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* ─── 페이지 타이틀 ─── */}
        <Text style={{
          fontSize: 22,
          fontWeight: "800",
          color: Colors.neutral[900],
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
        }}>
          식단표
        </Text>

        {/* ─── 네비게이션 헤더 ─── */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.sm,
        }}>
          <Pressable
            onPress={() => viewMode === "week" ? navigateWeek(-1) : navigateMonth(-1)}
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

          <Pressable
            onPress={toggleViewMode}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: BorderRadius.full,
              backgroundColor: Colors.neutral[50],
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.neutral[900] }}>
              {viewMode === "week" ? weekLabel : monthLabel}
            </Text>
            {viewMode === "week" ? (
              <ChevronDown size={18} color={Colors.neutral[500]} />
            ) : (
              <ChevronUp size={18} color={Colors.neutral[500]} />
            )}
          </Pressable>

          <Pressable
            onPress={() => viewMode === "week" ? navigateWeek(1) : navigateMonth(1)}
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

        {/* ─── 주간 캘린더 ─── */}
        {viewMode === "week" && (
          <View style={{
            marginTop: Spacing.md,
            paddingHorizontal: Spacing.lg,
          }}>
            {/* 요일 헤더 */}
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
              {weekDays.map((day) => (
                <View key={`label-${day.id}`} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selectedDate === day.id
                      ? Colors.primary[500]
                      : day.isPast
                        ? Colors.neutral[300]
                        : Colors.neutral[400],
                  }}>
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>

            {/* 날짜 */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {weekDays.map((day) => {
                const isSelected = selectedDate === day.id;
                const hasMeals = datesWithMeals.has(day.id);

                return (
                  <Pressable
                    key={day.id}
                    onPress={() => setSelectedDate(day.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.xl,
                      backgroundColor: isSelected
                        ? Colors.primary[500]
                        : day.isToday
                          ? Colors.neutral[100]
                          : "transparent",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    <Text style={{
                      fontSize: 17,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected
                        ? "#FFFFFF"
                        : day.isPast
                          ? Colors.neutral[300]
                          : day.day === "일"
                            ? "#F0816C"
                            : Colors.neutral[800],
                    }}>
                      {day.date}
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
          </View>
        )}

        {/* ─── 월간 캘린더 ─── */}
        {viewMode === "month" && (
          <View style={{
            marginTop: Spacing.md,
            paddingHorizontal: Spacing.lg,
          }}>
            {/* 요일 헤더 */}
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
              {DAY_LABELS.map((label, i) => (
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
                  if (!date) {
                    return <View key={`empty-${rowIndex}-${colIndex}`} style={{ flex: 1, paddingVertical: 10 }} />;
                  }

                  const dateId = formatDateId(date);
                  const isSelected = selectedDate === dateId;
                  const isToday = date.toDateString() === today.toDateString();
                  const hasMeals = datesWithMeals.has(dateId);
                  const isSunday = colIndex === 0;
                  const isPast = date < today && !isToday;

                  return (
                    <Pressable
                      key={dateId}
                      onPress={() => selectDateFromMonth(date)}
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
                          : isPast
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
        )}

        {/* ─── 구분선 ─── */}
        <View style={{
          height: 1,
          backgroundColor: Colors.neutral[100],
          marginHorizontal: Spacing.xl,
          marginTop: Spacing.lg,
        }} />

        {/* ─── 대기열 ─── */}
        <View style={{
          marginHorizontal: Spacing.xl,
          marginTop: Spacing.lg,
          backgroundColor: Colors.neutral[50],
          borderRadius: BorderRadius.lg,
          overflow: "hidden",
        }}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowQueue(!showQueue);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <List size={18} color={Colors.primary[500]} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[800] }}>
                대기열
              </Text>
              <View style={{
                backgroundColor: Colors.primary[100],
                minWidth: 22,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 10,
                alignItems: "center",
              }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.primary[600] }}>
                  {savedRecipes.length}
                </Text>
              </View>
            </View>
            {showQueue ? (
              <ChevronUp size={16} color={Colors.neutral[400]} />
            ) : (
              <ChevronDown size={16} color={Colors.neutral[400]} />
            )}
          </Pressable>

          {showQueue && (
            <View style={{
              marginHorizontal: Spacing.md,
              height: 112, // 이미지(76) + marginTop(4) + 텍스트(~16) + 여백(16)
            }}>
            <ScrollView
              horizontal
              scrollEnabled={scrollEnabled}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing.xs,
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              {/* + 버튼 (맨 앞) */}
              <View style={{ width: 84, alignItems: "center" }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push("/(tabs)/recipe-book")}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: Colors.neutral[300],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Plus size={22} color={Colors.neutral[400]} />
                </TouchableOpacity>
              </View>

              {/* 레시피 목록 (드래그 가능) */}
              {savedRecipes.map((recipe) => {
                const mapped = { id: String(recipe.id), recipeId: String(recipe.recipeId), title: recipe.recipeTitle, thumbnail: recipe.mainImgUrl || "" };
                const isDragged = draggedRecipe?.id === mapped.id;
                return (
                  <DraggableQueueItem
                    key={recipe.id}
                    recipe={mapped}
                    isDragged={isDragged}
                    ghostX={ghostX}
                    ghostY={ghostY}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onDelete={handleQueueDelete}
                    onPress={handleSavedRecipePress}
                  />
                );
              })}
            </ScrollView>
            </View>
          )}
        </View>

        {/* ─── 선택된 날짜의 식단 ─── */}
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.xl }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900], marginBottom: Spacing.base }}>
            {selectedDayLabel}
          </Text>

          {/* ── 내 식단 (드랍 존) ── */}
          <View ref={personalSectionRef}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowPersonalMeals(!showPersonalMeals);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: Spacing.sm,
              marginBottom: Spacing.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <User size={16} color={Colors.neutral[600]} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[800] }}>내 식단</Text>
              <Text style={{ fontSize: 13, color: Colors.neutral[400] }}>{selectedMeals.length}</Text>
            </View>
            {showPersonalMeals ? (
              <ChevronUp size={16} color={Colors.neutral[400]} />
            ) : (
              <ChevronDown size={16} color={Colors.neutral[400]} />
            )}
          </Pressable>

          {/* 내 식단 드랍 플레이스홀더 */}
          {dropTarget?.type === "personal" && (
            <DropPlaceholder />
          )}

          {/* 로딩 상태 */}
          {calendarLoading && (
            <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
              <ActivityIndicator size="small" color={Colors.neutral[400]} />
              <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: Spacing.xs }}>
                식단을 불러오는 중...
              </Text>
            </View>
          )}

          {/* 에러 상태 */}
          {calendarError && !calendarLoading && (
            <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
              <Text style={{ fontSize: 13, color: Colors.error.main, marginBottom: Spacing.xs }}>
                식단을 불러오지 못했어요
              </Text>
              <Pressable onPress={refetchCalendar}>
                <Text style={{ fontSize: 13, color: Colors.primary[500], fontWeight: "600" }}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {showPersonalMeals && !calendarLoading && !calendarError && (
            selectedMeals.length > 0 ? (
              <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
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
                        <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>-</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => openMealMenu({ mealId: String(meal.id), source: "personal" })}
                      hitSlop={8}
                      style={{ width: 32, height: 32, justifyContent: "center", alignItems: "center", alignSelf: "center" }}
                    >
                      <EllipsisVertical size={18} color={Colors.neutral[400]} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            ) : dropTarget?.type !== "personal" ? (
              <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
                <ChefHat size={28} color={Colors.neutral[300]} />
                <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: Spacing.xs }}>
                  대기열에서 레시피를 추가해보세요
                </Text>
              </View>
            ) : null
          )}

          </View>

          {/* ── 그룹 식단 ── */}
          {!calendarLoading && !calendarError && groupSections.map((group) => {
            const groupDayMeals = group.meals[selectedDate] || [];
            const isCollapsed = collapsedGroups[group.groupId];
            return (
              <View key={group.groupId}>
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setCollapsedGroups(prev => ({ ...prev, [group.groupId]: !prev[group.groupId] }));
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: Spacing.sm,
                    marginBottom: Spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Users size={16} color={Colors.neutral[600]} />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[800] }}>{group.groupName}</Text>
                    <Text style={{ fontSize: 13, color: Colors.neutral[400] }}>{groupDayMeals.length}</Text>
                  </View>
                  {!isCollapsed ? (
                    <ChevronUp size={16} color={Colors.neutral[400]} />
                  ) : (
                    <ChevronDown size={16} color={Colors.neutral[400]} />
                  )}
                </Pressable>

                {!isCollapsed && (
                  groupDayMeals.length > 0 ? (
                    <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
                      {groupDayMeals.map((meal) => (
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
                              <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>-</Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => openMealMenu({ mealId: String(meal.id), source: "group", groupId: group.groupId })}
                            hitSlop={8}
                            style={{ width: 32, height: 32, justifyContent: "center", alignItems: "center", alignSelf: "center" }}
                          >
                            <EllipsisVertical size={18} color={Colors.neutral[400]} />
                          </Pressable>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
                      <Text style={{ fontSize: 13, color: Colors.neutral[400] }}>
                        등록된 그룹 식단이 없어요
                      </Text>
                    </View>
                  )
                )}
              </View>
            );
          })}

        </View>

        {/* 하단 여백 */}
        <View style={{ paddingBottom: Spacing["3xl"] }} />
      </ScrollView>

      {/* ─── 드래그 고스트 ─── */}
      {draggedRecipe && (
        <Animated.View
          pointerEvents="none"
          style={[
            ghostStyle,
            {
              position: "absolute",
              width: 76,
              height: 76,
              borderRadius: 16,
              zIndex: 999,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          <Image
            source={{ uri: draggedRecipe.thumbnail }}
            style={{ width: 76, height: 76, borderRadius: 16 }}
            contentFit="cover"
          />
        </Animated.View>
      )}

      {/* ─── 식단 메뉴 바텀시트 ─── */}
      <Modal
        visible={menuModalVisible}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeMealMenu}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 - 페이드 */}
          <RNAnimated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              opacity: menuOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeMealMenu} />
          </RNAnimated.View>

          {/* 시트 - 슬라이드업 */}
          <RNAnimated.View
            style={{
              transform: [{ translateY: menuSheetTranslateY }],
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingTop: Spacing.sm,
              paddingBottom: insets.bottom + Spacing.xl + 100,
              marginBottom: -100,
              paddingHorizontal: Spacing.xl,
            }}
          >
            {/* 핸들 바 */}
            <View style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.neutral[200],
              alignSelf: "center",
              marginBottom: Spacing.xl,
            }} />

            {/* 대기열에 추가 */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                if (!menuTarget) return;
                let meal: CalendarMeal | undefined;
                if (menuTarget.source === "personal") {
                  meal = selectedMeals.find(m => String(m.id) === menuTarget.mealId);
                } else {
                  const group = groupSections.find(g => g.groupId === menuTarget.groupId);
                  meal = group?.meals[selectedDate]?.find(m => String(m.id) === menuTarget.mealId);
                }
                if (meal) {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  addQueue(meal.recipeId);
                }
                closeMealMenu();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
              }}
            >
              <ListPlus size={20} color={Colors.neutral[600]} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.neutral[900] }}>
                대기열에 추가
              </Text>
            </TouchableOpacity>

            {/* 식단 삭제 */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={async () => {
                if (!menuTarget) return;
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                if (menuTarget.source === "personal") {
                  setLocalMeals(prev => ({
                    ...prev,
                    [selectedDate]: (prev[selectedDate] || []).filter(m => String(m.id) !== menuTarget.mealId),
                  }));
                } else {
                  setLocalGroupMeals(prev => {
                    const groupMeals = prev[menuTarget.groupId] || {};
                    return {
                      ...prev,
                      [menuTarget.groupId]: {
                        ...groupMeals,
                        [selectedDate]: (groupMeals[selectedDate] || []).filter(m => String(m.id) !== menuTarget.mealId),
                      },
                    };
                  });
                }
                closeMealMenu();

                const mealIdNum = parseInt(menuTarget.mealId);
                if (Number.isNaN(mealIdNum) || mealIdNum < 0) {
                  return;
                }
                try {
                  await deleteCalendarMeal(mealIdNum);
                } catch (err) {
                  console.error("식단 삭제 실패:", err);
                  refetchCalendar();
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingVertical: 14,
              }}
            >
              <Trash2 size={20} color={Colors.error.main} />
              <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.error.main }}>
                식단에서 삭제
              </Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </View>
      </Modal>
    </View>
  );
}
