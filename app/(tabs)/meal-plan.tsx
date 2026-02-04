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
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  Users,
  User,
} from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "@/constants/design-system";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

let _idCounter = 0;
const uniqueId = (prefix: string) => `${prefix}-${++_idCounter}-${Date.now()}`;

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

// ============================================================================
// 더미 데이터
// ============================================================================

const generateDummyMeals = (): Record<string, Meal[]> => {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const meals: Record<string, Meal[]> = {};

  const mealData: Meal[][] = [
    [
      { id: "m1", title: "귀찮은 주말아침! 영양가득한 5분 완성 머그컵밥", thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", duration: "5분" },
      { id: "m2", title: "Instant Pot Chicken Pot Pie Casserole", thumbnail: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400", duration: "25분" },
    ],
    [
      { id: "m3", title: "바삭바삭 통닭구이", thumbnail: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400", duration: "40분" },
    ],
    [
      { id: "m4", title: "연어 아보카도 포케볼", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "15분" },
    ],
    [],
    [
      { id: "m5", title: "크림 파스타", thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", duration: "20분" },
    ],
    [
      { id: "m6", title: "간단 김치볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "10분" },
      { id: "m7", title: "된장찌개", thumbnail: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400", duration: "30분" },
    ],
    [],
  ];

  mealData.forEach((dayMeals, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    meals[formatDateId(date)] = dayMeals;
  });

  return meals;
};

const INITIAL_SAVED_RECIPES = [
  { id: "s1", title: "매콤 닭갈비", thumbnail: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=200" },
  { id: "s2", title: "토마토 리조또", thumbnail: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200" },
  { id: "s3", title: "새우 볶음면", thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200" },
];

interface Meal {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

interface GroupMealData {
  groupName: string;
  meals: Record<string, Meal[]>;
}

const EMPTY_MEALS: Meal[] = [];

const generateGroupMeals = (): GroupMealData[] => {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const d = (offset: number) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offset);
    return formatDateId(date);
  };

  return [
    {
      groupName: "우리집 밥상",
      meals: {
        [d(0)]: [
          { id: "g1", title: "엄마표 김치찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "30분" },
        ],
        [d(2)]: [
          { id: "g2", title: "소불고기", thumbnail: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400", duration: "35분" },
        ],
        [d(4)]: [
          { id: "g3", title: "잡채", thumbnail: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400", duration: "40분" },
        ],
      },
    },
    {
      groupName: "자취생 밥친구",
      meals: {
        [d(0)]: [
          { id: "g4", title: "참치마요 덮밥", thumbnail: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400", duration: "10분" },
        ],
        [d(1)]: [
          { id: "g5", title: "계란볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "8분" },
        ],
        [d(3)]: [
          { id: "g6", title: "라면 + 치즈", thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400", duration: "5분" },
        ],
      },
    },
  ];
};

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
  recipe: { id: string; title: string; thumbnail: string };
  isDragged: boolean;
  ghostX: Animated.SharedValue<number>;
  ghostY: Animated.SharedValue<number>;
  onDragStart: (recipe: { id: string; title: string; thumbnail: string }, x: number, y: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: (y: number) => void;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
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
          <Pressable onPress={() => onPress(recipe.id)}>
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
  const [meals, setMeals] = useState(generateDummyMeals);
  const [savedRecipes, setSavedRecipes] = useState(INITIAL_SAVED_RECIPES);
  const [showQueue, setShowQueue] = useState(false);
  const [groupMeals, setGroupMeals] = useState(generateGroupMeals);
  const [showPersonalMeals, setShowPersonalMeals] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [menuTarget, setMenuTarget] = useState<
    | { mealId: string; source: "personal" }
    | { mealId: string; source: "group"; groupName: string }
    | null
  >(null);
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
  const [draggedRecipe, setDraggedRecipe] = useState<{ id: string; title: string; thumbnail: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ type: "personal" } | { type: "group"; groupName: string } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const dragScale = useSharedValue(0);
  const personalSectionRef = useRef<View>(null);
  const groupSectionRefs = useRef<Record<string, View | null>>({});
  const personalLayout = useRef({ pageY: 0, height: 0, pageX: 0, width: 0 });
  const groupLayouts = useRef<Record<string, { pageY: number; height: number; pageX: number; width: number }>>({});
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

  const selectedMeals = meals[selectedDate] ?? EMPTY_MEALS;

  const datesWithMeals = useMemo(() => {
    const set = new Set<string>();
    for (const dateId of Object.keys(meals)) {
      if (meals[dateId].length > 0) set.add(dateId);
    }
    for (const group of groupMeals) {
      for (const dateId of Object.keys(group.meals)) {
        if (group.meals[dateId].length > 0) set.add(dateId);
      }
    }
    return set;
  }, [meals, groupMeals]);

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
    Object.entries(groupSectionRefs.current).forEach(([name, ref]) => {
      ref?.measureInWindow((x, y, w, h) => {
        groupLayouts.current[name] = { pageX: x + w / 2, pageY: y, width: w, height: h };
      });
    });
  }, []);

  const handleDragStart = useCallback((recipe: { id: string; title: string; thumbnail: string }, x: number, y: number) => {
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
    for (const [name, gL] of Object.entries(groupLayouts.current)) {
      if (gL.height > 0 && y >= gL.pageY && y <= gL.pageY + gL.height) {
        setDropTarget(prev =>
          prev?.type === "group" && prev.groupName === name ? prev : { type: "group", groupName: name }
        );
        return;
      }
    }
    setDropTarget(prev => prev === null ? prev : null);
  }, [startAutoScroll, stopAutoScroll, insets.top, insets.bottom, windowHeight]);

  const dropTargetRef = useRef(dropTarget);
  dropTargetRef.current = dropTarget;

  const completeDrop = useCallback(() => {
    const recipe = draggedRecipeRef.current;
    const target = dropTargetRef.current;
    if (!recipe || !target) return;
    draggedRecipeRef.current = null;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
    const newMeal = { id: uniqueId(recipe.id), title: recipe.title, thumbnail: recipe.thumbnail, duration: "-" };
    if (target.type === "personal") {
      setMeals(prev => ({
        ...prev,
        [selectedDate]: [newMeal, ...(prev[selectedDate] || [])],
      }));
    } else {
      setGroupMeals(prev => prev.map(g =>
        g.groupName === target.groupName
          ? { ...g, meals: { ...g.meals, [selectedDate]: [newMeal, ...(g.meals[selectedDate] || [])] } }
          : g
      ));
    }
    setDraggedRecipe(null);
    setDropTarget(null);
  }, [selectedDate]);

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

    let overGroupLayout: { pageY: number; height: number; pageX: number; width: number } | null = null;
    for (const [, gL] of Object.entries(groupLayouts.current)) {
      if (gL.height > 0 && y >= gL.pageY && y <= gL.pageY + gL.height) {
        overGroupLayout = gL;
        break;
      }
    }
    const over = overPersonal || overGroupLayout !== null;

    if (over) {
      const layout = overPersonal ? pL : overGroupLayout!;
      const targetY = layout.pageY + 52;
      const targetX = layout.pageX;
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
    setSavedRecipes(prev => prev.filter(r => r.id !== id));
  }, []);

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
              overflow: "hidden",
              paddingBottom: Spacing.md,
            }}>
            <ScrollView
              horizontal
              scrollEnabled={scrollEnabled}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: Spacing.xs,
                gap: 8,
              }}
            >
              {/* + 버튼 (맨 앞) */}
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

              {/* 레시피 목록 (드래그 가능) */}
              {savedRecipes.map((recipe) => {
                const isDragged = draggedRecipe?.id === recipe.id;
                return (
                  <DraggableQueueItem
                    key={recipe.id}
                    recipe={recipe}
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

          {showPersonalMeals && (
            selectedMeals.length > 0 ? (
              <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
                {selectedMeals.map((meal) => (
                  <Pressable
                    key={meal.id}
                    onPress={() => router.push(`/recipe/${meal.id}`)}
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
                    <Image
                      source={{ uri: meal.thumbnail }}
                      style={{ width: 72, height: 72, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1, marginLeft: Spacing.md, justifyContent: "center" }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900], lineHeight: 20, marginBottom: 6 }}
                        numberOfLines={2}
                      >
                        {meal.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Clock size={13} color={Colors.neutral[400]} />
                        <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>{meal.duration}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => openMealMenu({ mealId: meal.id, source: "personal" })}
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

          {/* ── 그룹 식단 (드랍 존) ── */}
          {groupMeals.map((group) => {
            const groupDayMeals = group.meals[selectedDate] || [];
            return (
              <View key={group.groupName} ref={(ref) => { groupSectionRefs.current[group.groupName] = ref; }}>
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setCollapsedGroups(prev => ({ ...prev, [group.groupName]: !prev[group.groupName] }));
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
                  {!collapsedGroups[group.groupName] ? (
                    <ChevronUp size={16} color={Colors.neutral[400]} />
                  ) : (
                    <ChevronDown size={16} color={Colors.neutral[400]} />
                  )}
                </Pressable>

                {/* 그룹 드랍 플레이스홀더 */}
                {dropTarget?.type === "group" && dropTarget.groupName === group.groupName && (
                  <DropPlaceholder />
                )}

                {!collapsedGroups[group.groupName] && (
                  groupDayMeals.length > 0 ? (
                    <View style={{ gap: Spacing.md, marginBottom: Spacing.md }}>
                      {groupDayMeals.map((meal) => (
                        <Pressable
                          key={meal.id}
                          onPress={() => router.push(`/recipe/${meal.id}`)}
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
                          <Image
                            source={{ uri: meal.thumbnail }}
                            style={{ width: 72, height: 72, borderRadius: 12 }}
                            contentFit="cover"
                          />
                          <View style={{ flex: 1, marginLeft: Spacing.md, justifyContent: "center" }}>
                            <Text
                              style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900], lineHeight: 20, marginBottom: 6 }}
                              numberOfLines={2}
                            >
                              {meal.title}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Clock size={13} color={Colors.neutral[400]} />
                              <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>{meal.duration}</Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => openMealMenu({ mealId: meal.id, source: "group", groupName: group.groupName })}
                            hitSlop={8}
                            style={{ width: 32, height: 32, justifyContent: "center", alignItems: "center", alignSelf: "center" }}
                          >
                            <EllipsisVertical size={18} color={Colors.neutral[400]} />
                          </Pressable>
                        </Pressable>
                      ))}
                    </View>
                  ) : dropTarget?.type === "group" && dropTarget.groupName === group.groupName ? null : (
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
                let meal: Meal | undefined;
                if (menuTarget.source === "personal") {
                  meal = selectedMeals.find(m => m.id === menuTarget.mealId);
                } else {
                  const group = groupMeals.find(g => g.groupName === menuTarget.groupName);
                  meal = group?.meals[selectedDate]?.find(m => m.id === menuTarget.mealId);
                }
                if (meal) {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSavedRecipes(prev => [{ id: uniqueId(meal.id), title: meal.title, thumbnail: meal.thumbnail }, ...prev]);
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
              onPress={() => {
                if (!menuTarget) return;
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                if (menuTarget.source === "personal") {
                  setMeals(prev => ({
                    ...prev,
                    [selectedDate]: (prev[selectedDate] || []).filter(m => m.id !== menuTarget.mealId),
                  }));
                } else {
                  setGroupMeals(prev => prev.map(g =>
                    g.groupName === menuTarget.groupName
                      ? { ...g, meals: { ...g.meals, [selectedDate]: (g.meals[selectedDate] || []).filter(m => m.id !== menuTarget.mealId) } }
                      : g
                  ));
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
