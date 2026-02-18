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
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/design-system";
import { useRecipeCalendar, useRecipeQueue } from "@/hooks";
import type { CalendarMeal } from "@/data/mock";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { FeedbackToast, useFeedbackToast, truncateTitle } from "@/components/ui/FeedbackToast";

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

const getMonthCalendar = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: Date[] = [];
  // 앞: 이전 달 날짜로 채움
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i));
  }
  // 해당 월
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(new Date(year, month, i));
  }
  // 뒤: 다음 달 날짜로 채움
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
  const [mealPlanTab, setMealPlanTab] = useState<"personal" | "group">("personal");
  const [menuTarget, setMenuTarget] = useState<
    | { mealId: string; source: "personal" }
    | { mealId: string; source: "group"; groupId: string }
    | null
  >(null);
  const [showGroupDeleteConfirm, setShowGroupDeleteConfirm] = useState(false);
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } = useFeedbackToast();

  // 조회 기간 계산: 항상 월 단위로 fetch → 같은 월 내 주간 이동 시 refetch 없음
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const firstOfMonth = new Date(viewMonth.year, viewMonth.month, 1);
      const lastOfMonth = new Date(viewMonth.year, viewMonth.month + 1, 0);
      // 그리드 시작: 1일이 속한 주의 일요일
      const gridStart = new Date(firstOfMonth);
      gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());
      // 그리드 끝: 마지막 날이 속한 주의 토요일
      const gridEnd = new Date(lastOfMonth);
      gridEnd.setDate(gridEnd.getDate() + (6 - lastOfMonth.getDay()));
      return {
        startDate: formatDateId(gridStart),
        endDate: formatDateId(gridEnd),
      };
    }
    // 주간 뷰: 주의 첫날~마지막 날이 속한 월 전체를 커버 (월 경계 주간 대응)
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    const startDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
    const endDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth() + 1, 0);
    return {
      startDate: formatDateId(startDate),
      endDate: formatDateId(endDate),
    };
  }, [viewMode, viewMonth, currentWeekStart]);

  // 캘린더 API 훅
  const { personalMeals: apiMeals, groupMealsByGroup: apiGroupMeals, groups: apiGroups, loading: calendarLoading, error: calendarError, refetch: refetchCalendar, deleteCalendarMeal } = useRecipeCalendar(dateRange.startDate, dateRange.endDate);

  // 대기열 API 훅
  const { queues: savedRecipes, loading: queueLoading, addQueue, deleteQueue, addToCalendar, refetch: refetchQueue } = useRecipeQueue();
  const queueInitializedRef = useRef(false);

  // 탭 포커스 시 캘린더 & 대기열 백그라운드 갱신 (loading 표시 없이)
  useFocusEffect(
    useCallback(() => {
      refetchCalendar({ silent: true, force: true });
      refetchQueue({ silent: true });
    }, [refetchCalendar, refetchQueue])
  );

  // 대기열 초기 로드 완료 시 항목이 있으면 애니메이션과 함께 열기
  useEffect(() => {
    if (!queueLoading && !queueInitializedRef.current) {
      queueInitializedRef.current = true;
      if (savedRecipes.length > 0) {
        LayoutAnimation.configureNext({
          duration: 350,
          create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
          update: { type: LayoutAnimation.Types.easeInEaseOut },
        });
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
  const [dropTarget, setDropTarget] = useState<{ type: "personal" } | { type: "group"; groupId: string } | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const dragScale = useSharedValue(0);
  const personalSectionRef = useRef<View>(null);
  const personalLayout = useRef({ pageY: 0, height: 0, pageX: 0, width: 0 });
  const groupSectionRefs = useRef<Record<string, View | null>>({});
  const groupLayouts = useRef<Record<string, { pageY: number; height: number; pageX: number; width: number }>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentAutoScrollSpeed = useRef(0);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);
  const monthCalendar = useMemo(() => getMonthCalendar(viewMonth.year, viewMonth.month), [viewMonth]);
  const monthRows = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < monthCalendar.length; i += 7) {
      rows.push(monthCalendar.slice(i, i + 7));
    }
    return rows;
  }, [monthCalendar]);

  const selectedMeals = localMeals[selectedDate] ?? EMPTY_MEALS;

  // 날짜 변경 또는 초기 로드 시에만 탭 자동 전환 (식단 추가/삭제 시 탭 유지)
  const prevSelectedDate = useRef<string | null>(null);
  useEffect(() => {
    if (calendarLoading) return;
    if (prevSelectedDate.current === selectedDate) return;
    prevSelectedDate.current = selectedDate;
    const hasPersonal = (localMeals[selectedDate] ?? []).length > 0;
    if (hasPersonal) {
      setMealPlanTab("personal");
      return;
    }
    const hasGroup = Object.values(localGroupMeals).some(
      (groupMeals) => (groupMeals[selectedDate] ?? []).length > 0
    );
    setMealPlanTab(hasGroup ? "group" : "personal");
  }, [selectedDate, calendarLoading, localMeals, localGroupMeals]);


  // 그룹별 섹션 정보: groupId → { groupName, meals by date }
  // apiGroups를 기반으로 모든 그룹을 표시 (식단이 없어도)
  const groupSections = useMemo(() => {
    const sections: { groupId: string; groupName: string; meals: Record<string, CalendarMeal[]> }[] = [];
    for (const group of apiGroups) {
      const groupId = String(group.groupId);
      const meals = localGroupMeals[groupId] || {};
      sections.push({ groupId, groupName: group.groupName, meals });
    }
    return sections;
  }, [apiGroups, localGroupMeals]);

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
    // 그룹 섹션들도 측정
    for (const groupId of Object.keys(groupSectionRefs.current)) {
      groupSectionRefs.current[groupId]?.measureInWindow((x, y, w, h) => {
        groupLayouts.current[groupId] = { pageX: x + w / 2, pageY: y, width: w, height: h };
      });
    }
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

    // 개인 식단 탭인 경우
    if (mealPlanTab === "personal") {
      const pL = personalLayout.current;
      if (pL.height > 0 && y >= pL.pageY && y <= pL.pageY + pL.height) {
        setDropTarget(prev => prev?.type === "personal" ? prev : { type: "personal" });
        return;
      }
    }

    // 그룹 식단 탭인 경우
    if (mealPlanTab === "group") {
      for (const [groupId, layout] of Object.entries(groupLayouts.current)) {
        if (layout.height > 0 && y >= layout.pageY && y <= layout.pageY + layout.height) {
          setDropTarget(prev => (prev?.type === "group" && prev.groupId === groupId) ? prev : { type: "group", groupId });
          return;
        }
      }
    }

    setDropTarget(prev => prev === null ? prev : null);
  }, [startAutoScroll, stopAutoScroll, insets.top, insets.bottom, windowHeight, mealPlanTab]);

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
    const isGroupTarget = target.type === "group";
    const targetGroupId = isGroupTarget ? parseInt(target.groupId) : null;
    const targetGroupName = isGroupTarget
      ? apiGroups.find(g => String(g.groupId) === target.groupId)?.groupName || null
      : null;

    const tempMeal: CalendarMeal = {
      id: tempId,
      recipeId: parseInt(recipe.recipeId),
      recipeTitle: recipe.title,
      cookingTime: null,
      mainImgUrl: recipe.thumbnail || null,
      scheduledDate: selectedDate,
      sortOrder: 0,
      groupId: targetGroupId,
      groupName: targetGroupName,
    };

    if (isGroupTarget) {
      // 그룹 식단에 추가
      setLocalGroupMeals(prev => {
        const groupId = target.groupId;
        const groupMeals = prev[groupId] || {};
        return {
          ...prev,
          [groupId]: {
            ...groupMeals,
            [selectedDate]: [tempMeal, ...(groupMeals[selectedDate] || [])],
          },
        };
      });
    } else {
      // 개인 식단에 추가
      setLocalMeals(prev => ({
        ...prev,
        [selectedDate]: [tempMeal, ...(prev[selectedDate] || [])],
      }));
    }
    setDraggedRecipe(null);
    setDropTarget(null);
    showToast(`"${truncateTitle(recipe.title)}" 식단이 추가됐어요!`);

    // API 호출: 대기열에서 캘린더로 추가
    try {
      const createdMeal = await addToCalendar(parseInt(recipe.id), selectedDate, targetGroupId);
      if (createdMeal) {
        // API 응답으로 로컬 상태 업데이트 (임시 ID를 실제 ID로 교체)
        if (isGroupTarget) {
          setLocalGroupMeals(prev => {
            const groupId = target.groupId;
            const groupMeals = prev[groupId] || {};
            return {
              ...prev,
              [groupId]: {
                ...groupMeals,
                [selectedDate]: (groupMeals[selectedDate] || []).map(m =>
                  m.id === tempId ? createdMeal : m
                ),
              },
            };
          });
        } else {
          setLocalMeals(prev => ({
            ...prev,
            [selectedDate]: prev[selectedDate].map(m =>
              m.id === tempId ? createdMeal : m
            ),
          }));
        }
      }
    } catch (err) {
      console.error('캘린더 추가 실패:', err);
      // 실패 시 낙관적 업데이트 롤백
      if (isGroupTarget) {
        setLocalGroupMeals(prev => {
          const groupId = target.groupId;
          const groupMeals = prev[groupId] || {};
          return {
            ...prev,
            [groupId]: {
              ...groupMeals,
              [selectedDate]: (groupMeals[selectedDate] || []).filter(m => m.id !== tempId),
            },
          };
        });
      } else {
        setLocalMeals(prev => ({
          ...prev,
          [selectedDate]: prev[selectedDate].filter(m => m.id !== tempId),
        }));
      }
    }
  }, [selectedDate, addToCalendar, apiGroups]);

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

    // 개인 식단 탭인 경우
    if (mealPlanTab === "personal") {
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
        return;
      }
    }

    // 그룹 식단 탭인 경우
    if (mealPlanTab === "group") {
      for (const [groupId, layout] of Object.entries(groupLayouts.current)) {
        if (layout.height > 0 && y >= layout.pageY && y <= layout.pageY + layout.height) {
          const targetY = layout.pageY + 52;
          const targetX = layout.pageX;
          ghostX.value = withSpring(targetX, { damping: 20, stiffness: 200 });
          ghostY.value = withSpring(targetY, { damping: 20, stiffness: 200 });
          dragScale.value = withDelay(100, withTiming(0, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(completeDrop)();
            }
          }));
          return;
        }
      }
    }

    // 유효한 드랍 영역이 아닌 경우
    dragScale.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(cancelDrop)();
      }
    });
  }, [dragScale, ghostY, ghostX, completeDrop, cancelDrop, stopAutoScroll, mealPlanTab]);

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
          fontSize: Typography.fontSize.xl,
          fontWeight: "700",
          color: Colors.neutral[900],
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: Spacing.md,
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
                  const dateId = formatDateId(date);
                  const isSelected = selectedDate === dateId;
                  const isToday = date.toDateString() === today.toDateString();
                  const hasMeals = datesWithMeals.has(dateId);
                  const isSunday = colIndex === 0;
                  const isOtherMonth = date.getMonth() !== viewMonth.month;

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
              height: 100, // 이미지(76) + marginTop(4) + 텍스트(~16) + 여백(4)
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
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900], marginBottom: Spacing.md }}>
            {selectedDayLabel}
          </Text>

          {/* ── 탭 전환 (내 식단 / 그룹 식단) ── */}
          <View style={{
            flexDirection: "row",
            backgroundColor: Colors.neutral[100],
            borderRadius: BorderRadius.lg,
            padding: 4,
            marginBottom: Spacing.lg,
          }}>
            <Pressable
              onPress={() => setMealPlanTab("personal")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
                backgroundColor: mealPlanTab === "personal" ? Colors.neutral[0] : "transparent",
                gap: 6,
              }}
            >
              <User size={16} color={mealPlanTab === "personal" ? Colors.primary[500] : Colors.neutral[500]} />
              <Text style={{
                fontSize: 14,
                fontWeight: "600",
                color: mealPlanTab === "personal" ? Colors.primary[500] : Colors.neutral[500],
              }}>
                내 식단
              </Text>
              {selectedMeals.length > 0 && (
                <View style={{
                  backgroundColor: mealPlanTab === "personal" ? Colors.primary[100] : Colors.neutral[200],
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: mealPlanTab === "personal" ? Colors.primary[600] : Colors.neutral[500],
                  }}>
                    {selectedMeals.length}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => setMealPlanTab("group")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
                backgroundColor: mealPlanTab === "group" ? Colors.neutral[0] : "transparent",
                gap: 6,
              }}
            >
              <Users size={16} color={mealPlanTab === "group" ? Colors.primary[500] : Colors.neutral[500]} />
              <Text style={{
                fontSize: 14,
                fontWeight: "600",
                color: mealPlanTab === "group" ? Colors.primary[500] : Colors.neutral[500],
              }}>
                그룹 식단
              </Text>
              {(() => {
                const totalGroupMeals = groupSections.reduce((sum, g) => sum + (g.meals[selectedDate]?.length || 0), 0);
                return totalGroupMeals > 0 ? (
                  <View style={{
                    backgroundColor: mealPlanTab === "group" ? Colors.primary[100] : Colors.neutral[200],
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: mealPlanTab === "group" ? Colors.primary[600] : Colors.neutral[500],
                    }}>
                      {totalGroupMeals}
                    </Text>
                  </View>
                ) : null;
              })()}
            </Pressable>
          </View>

          {/* ── 내 식단 탭 (드랍 존) ── */}
          {mealPlanTab === "personal" && (
          <View ref={personalSectionRef}>

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
              <Pressable onPress={() => refetchCalendar({ force: true })}>
                <Text style={{ fontSize: 13, color: Colors.primary[500], fontWeight: "600" }}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {!calendarLoading && !calendarError && (
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
          )}

          {/* ── 그룹 식단 탭 ── */}
          {mealPlanTab === "group" && (
            <View>
              {/* 로딩 상태 */}
              {calendarLoading && (
                <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
                  <ActivityIndicator size="small" color={Colors.neutral[400]} />
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: Spacing.xs }}>
                    그룹 식단을 불러오는 중...
                  </Text>
                </View>
              )}

              {/* 에러 상태 */}
              {calendarError && !calendarLoading && (
                <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
                  <Text style={{ fontSize: 13, color: Colors.error.main, marginBottom: Spacing.xs }}>
                    그룹 식단을 불러오지 못했어요
                  </Text>
                  <Pressable onPress={() => refetchCalendar({ force: true })}>
                    <Text style={{ fontSize: 13, color: Colors.primary[500], fontWeight: "600" }}>다시 시도</Text>
                  </Pressable>
                </View>
              )}

              {/* 그룹이 없을 때 */}
              {!calendarLoading && !calendarError && groupSections.length === 0 && (
                <View style={{ paddingVertical: Spacing["3xl"], alignItems: "center" }}>
                  <Users size={32} color={Colors.neutral[300]} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[500], marginTop: Spacing.md }}>
                    참여 중인 그룹이 없어요
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: Spacing.xs, textAlign: "center" }}>
                    그룹에 참여하면 그룹 식단을{"\n"}함께 관리할 수 있어요
                  </Text>
                </View>
              )}

              {/* 그룹별 식단 목록 */}
              {!calendarLoading && !calendarError && groupSections.map((group) => {
            const groupDayMeals = group.meals[selectedDate] || [];
            const isCollapsed = collapsedGroups[group.groupId];
            const isDropTarget = dropTarget?.type === "group" && dropTarget.groupId === group.groupId;
            return (
              <View
                key={group.groupId}
                ref={(ref) => { groupSectionRefs.current[group.groupId] = ref; }}
              >
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

                {/* 그룹 드랍 플레이스홀더 */}
                {isDropTarget && <DropPlaceholder />}

                {!isCollapsed && (
                  groupDayMeals.length > 0 ? (
                    <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
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
                              <Text style={{ fontSize: 13, color: Colors.neutral[500] }}>
                                {meal.cookingTime ? `${meal.cookingTime}분` : "-"}
                              </Text>
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
                  ) : !isDropTarget ? (
                    <View style={{ paddingVertical: Spacing.xl, alignItems: "center", marginBottom: Spacing.md }}>
                      <Text style={{ fontSize: 13, color: Colors.neutral[400] }}>
                        등록된 그룹 식단이 없어요
                      </Text>
                    </View>
                  ) : null
                )}
              </View>
            );
          })}
            </View>
          )}

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

                // 그룹 식단은 확인 모달 먼저 표시
                if (menuTarget.source === "group") {
                  closeMealMenu();
                  setShowGroupDeleteConfirm(true);
                  return;
                }

                // 삭제 전 레시피명 저장
                const meal = selectedMeals.find(m => String(m.id) === menuTarget.mealId);
                const recipeName = meal?.recipeTitle ?? "레시피";

                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setLocalMeals(prev => ({
                  ...prev,
                  [selectedDate]: (prev[selectedDate] || []).filter(m => String(m.id) !== menuTarget.mealId),
                }));
                closeMealMenu();
                showToast(`"${truncateTitle(recipeName)}" 식단이 삭제됐어요!`);

                const mealIdNum = parseInt(menuTarget.mealId);
                if (Number.isNaN(mealIdNum) || mealIdNum < 0) {
                  return;
                }
                try {
                  await deleteCalendarMeal(mealIdNum);
                } catch (err) {
                  console.error("식단 삭제 실패:", err);
                  refetchCalendar({ force: true });
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

      {/* 그룹 식단 삭제 확인 모달 */}
      <ConfirmActionModal
        visible={showGroupDeleteConfirm}
        title="그룹 식단을 삭제할까요?"
        description="그룹 멤버 모두의 식단에서 삭제돼요"
        confirmText="삭제"
        confirmLoadingText="삭제 중..."
        onClose={() => {
          setShowGroupDeleteConfirm(false);
          setMenuTarget(null);
        }}
        onConfirm={async () => {
          if (!menuTarget || menuTarget.source !== "group") return;

          // 삭제 전 레시피명 저장
          const group = groupSections.find(g => g.groupId === menuTarget.groupId);
          const meal = group?.meals[selectedDate]?.find(m => String(m.id) === menuTarget.mealId);
          const recipeName = meal?.recipeTitle ?? "레시피";

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
          setShowGroupDeleteConfirm(false);
          showToast(`"${truncateTitle(recipeName)}" 식단이 삭제됐어요!`);

          const mealIdNum = parseInt(menuTarget.mealId);
          setMenuTarget(null);
          if (Number.isNaN(mealIdNum) || mealIdNum < 0) return;

          try {
            await deleteCalendarMeal(mealIdNum);
          } catch (err) {
            console.error("그룹 식단 삭제 실패:", err);
            refetchCalendar({ force: true });
          }
        }}
      />

      <FeedbackToast
        message={toastMessage}
        variant={toastVariant}
        opacity={toastOpacity}
        translate={toastTranslate}
        aboveTabBar
      />
    </View>
  );
}
