import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Linking,
  BackHandler,
} from "react-native";
import RAnimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Play,
  Bookmark,
  Clock,
  Users,
  ChefHat,
  ListPlus,
  ShoppingCart,
  MoreVertical,
  MessageCircle,
  AlertTriangle,
  Copyright,
  Ban,
  Megaphone,
  HelpCircle,
  X,
  Check,
  Book,
  FolderPlus,
  Square,
  CheckSquare,
  Volume2,
  VolumeX,
  ExternalLink,
  Minimize2,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { recipeApi, type RecipeResponse } from "@/services/recipeApi";
import { API_BASE_URL } from "@/constants/oauth";
import { api } from "@/services/api";
import { useRecipeQueue, useGroups, usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";
import { FeedbackToast, useFeedbackToast, truncateTitle } from "@/components/ui/FeedbackToast";
import { YoutubeView, useYouTubePlayer, useYouTubeEvent, PlayerState } from "react-native-youtube-bridge";
import { extractYoutubeId } from "@/utils/youtube";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIDEO_HEIGHT = SCREEN_WIDTH * 0.85;
const PLAYER_WIDTH = VIDEO_HEIGHT * (9 / 16); // 세로 영상이므로 9:16
const FULLSCREEN_THRESHOLD = 55; // 55px 이상 당기면 풀스크린 스냅
const BOOK_LIST_ITEM_HEIGHT = 73; // paddingVertical(14*2) + icon(44) + border(1)
const BOOK_LIST_VISIBLE_COUNT = 3;

const FEEDBACK_TYPES = [
  { id: "INACCURATE", label: "잘못된 정보", icon: AlertTriangle, description: "레시피 내용이 부정확하거나 오류가 있어요" },
  { id: "COPYRIGHT_INFRINGEMENT", label: "저작권 침해", icon: Copyright, description: "원작자의 허락 없이 게시된 콘텐츠예요" },
  { id: "INAPPROPRIATE_CONTENT", label: "부적절한 콘텐츠", icon: Ban, description: "불쾌하거나 유해한 내용이 포함되어 있어요" },
  { id: "SPAM_AD", label: "스팸 / 광고", icon: Megaphone, description: "홍보 목적의 콘텐츠이거나 반복 게시물이에요" },
  { id: "OTHER", label: "기타", icon: HelpCircle, description: "위 항목에 해당하지 않는 의견이에요" },
] as const;

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "초급",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
  ETC: "기타",
};


export default function RecipeDetailScreen() {
  'use no memo'; // React Compiler 비활성화

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const idStr = params.id;
  const id = idStr ? parseInt(idStr, 10) : 0;

  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [ownedBookIds, setOwnedBookIds] = useState<string[]>([]);

  // 데이터 로딩 - 가장 먼저 실행되도록 배치
  useEffect(() => {
    console.log("[RecipeDetail] useEffect - id:", id);

    if (!id || isNaN(id)) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    console.log("[RecipeDetail] Calling GET /api/v1/recipes/" + id);
    Promise.all([
      recipeApi.getById(id),
      api.get<{ data: number[] | { recipeBookIds?: number[] } }>(
        `/api/v1/recipebooks/recipes/${id}`
      ).catch(() => null),
    ]).then(([data, bookmarkRes]) => {
      if (cancelled) return;
      console.log("[RecipeDetail] API OK - title:", data?.title);
      setRecipe(data);
      setServings(data.servingSize);
      // 북마크 확인 API 응답이 있으면 그걸 우선 사용
      if (bookmarkRes?.data) {
        const payload = bookmarkRes.data;
        const savedBookIds = Array.isArray(payload) ? payload : (payload?.recipeBookIds ?? []);
        setOwnedBookIds((savedBookIds || []).map((bookId) => String(bookId)));
      } else {
        setOwnedBookIds((data.ownedRecipeBookIds || []).map((bookId) => String(bookId)));
      }
      setLoading(false);
    }).catch((err: any) => {
      if (cancelled) return;
      console.error("[RecipeDetail] API Error:", err);
      setError(err.message || "레시피를 불러오는데 실패했습니다.");
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id]);

  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const moreOverlayOpacity = useRef(new Animated.Value(0)).current;
  const moreSheetTranslateY = useRef(new Animated.Value(300)).current;
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [showIngredientSelectModal, setShowIngredientSelectModal] = useState(false);
  const [showNoGroupModal, setShowNoGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const { addQueue } = useRecipeQueue();
  const { groups, loading: groupsLoading } = useGroups();
  const { recipeBooks: personalBooks } = usePersonalRecipeBooks();
  const { recipeBooks: groupRecipeBooks } = useGroupRecipeBooks();

  // 북마크 시트 관련 상태
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const [bookmarkTab, setBookmarkTab] = useState<"personal" | "group">("personal");
  const bookmarkOverlayOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkSheetTranslateY = useRef(new Animated.Value(400)).current;

  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } =
    useFeedbackToast(1600);

  // 히어로 스트레치 + 풀스크린
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenShared = useSharedValue(false);
  const scrollY = useSharedValue(0);
  const pullOffset = useSharedValue(0); // 0=일반, SCREEN_HEIGHT-VIDEO_HEIGHT=풀스크린

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const enterFullscreenJS = useCallback(() => {
    setIsFullscreen(true);
    StatusBar.setHidden(true, 'fade');
  }, []);

  const exitFullscreenJS = useCallback(() => {
    setIsFullscreen(false);
    StatusBar.setHidden(false, 'fade');
  }, []);

  const nativeGestureRef = useRef<any>(null);

  const pullGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      'worklet';
      if (isFullscreenShared.value) {
        // 풀스크린: 위로 스와이프 → 축소
        if (e.translationY < 0) {
          const target = (SCREEN_HEIGHT - VIDEO_HEIGHT) + e.translationY * 0.85;
          pullOffset.value = Math.max(0, target);
        }
      } else {
        // 일반: 아래로 당기기 → 스트레치
        if (scrollY.value <= 0 && e.translationY > 0) {
          pullOffset.value = Math.min(
            e.translationY * 0.85,
            SCREEN_HEIGHT - VIDEO_HEIGHT
          );
        }
      }
    })
    .onEnd((e) => {
      'worklet';
      if (isFullscreenShared.value) {
        // 풀스크린 해제 판정
        if (-e.translationY > 100 || e.velocityY < -500) {
          pullOffset.value = withTiming(0, { duration: 250 });
          isFullscreenShared.value = false;
          runOnJS(exitFullscreenJS)();
        } else {
          pullOffset.value = withTiming(SCREEN_HEIGHT - VIDEO_HEIGHT, { duration: 200 });
        }
      } else {
        // 풀스크린 진입 판정
        if (pullOffset.value > FULLSCREEN_THRESHOLD) {
          pullOffset.value = withTiming(SCREEN_HEIGHT - VIDEO_HEIGHT, { duration: 250 });
          isFullscreenShared.value = true;
          runOnJS(enterFullscreenJS)();
        } else {
          pullOffset.value = withTiming(0, { duration: 250 });
        }
      }
    })
    .simultaneousWithExternalGesture(nativeGestureRef);

  const nativeScrollGesture = Gesture.Native().withRef(nativeGestureRef);

  // 히어로 컨테이너 높이 애니메이션
  const heroAnimatedStyle = useAnimatedStyle(() => {
    const stretch = Math.max(0, pullOffset.value);
    return {
      width: SCREEN_WIDTH,
      height: VIDEO_HEIGHT + stretch,
      backgroundColor: '#000',
    };
  });

  // 히어로 내부 콘텐츠 스케일 (썸네일/영상이 같이 커지도록)
  const heroContentScaleStyle = useAnimatedStyle(() => {
    const stretch = Math.max(0, pullOffset.value);
    const scale = stretch > 0 ? (VIDEO_HEIGHT + stretch) / VIDEO_HEIGHT : 1;
    return {
      transform: [{ scale }],
    };
  });

  // 헤더 스크롤 반응 (히어로 지나면 흰 배경 + 어두운 아이콘)
  const [isHeaderDark, setIsHeaderDark] = useState(false);

  useAnimatedReaction(
    () => scrollY.value > (VIDEO_HEIGHT - 100),
    (isDark, prev) => {
      if (isDark !== prev) {
        runOnJS(setIsHeaderDark)(isDark);
      }
    },
  );

  const headerBgStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [VIDEO_HEIGHT - 120, VIDEO_HEIGHT - 60],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      backgroundColor: `rgba(255, 255, 255, ${progress})`,
    };
  });

  // Android 뒤로가기
  useEffect(() => {
    if (Platform.OS === 'android' && isFullscreen) {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        pullOffset.value = withTiming(0, { duration: 250 });
        isFullscreenShared.value = false;
        exitFullscreenJS();
        return true;
      });
      return () => handler.remove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen, exitFullscreenJS]);

  // 비디오 관련 상태
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // YouTube Video ID 추출
  const videoId = recipe?.sourceUrl ? extractYoutubeId(recipe.sourceUrl) : null;

  // YouTube Player 설정
  const player = useYouTubePlayer(videoId || "", {
    autoplay: false,
    muted: isMuted,
    controls: false,
    playsinline: true,
    rel: false,
    loop: true,
  });

  // YouTube 이벤트 리스너
  useYouTubeEvent(player, "ready", () => {
    console.log("YouTube player ready");
  });

  useYouTubeEvent(player, "stateChange", (state) => {
    console.log("Player state:", state);
    if (state === PlayerState.PLAYING) {
      setIsVideoPlaying(true);
    } else if (state === PlayerState.PAUSED || state === PlayerState.ENDED) {
      setIsVideoPlaying(false);
    }
    if (state === PlayerState.ENDED) {
      player.seekTo(0);
      player.play();
    }
  });

  // 비디오 재생/일시정지 토글
  const togglePlayPause = useCallback(() => {
    if (isVideoPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isVideoPlaying, player]);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      player.mute();
    } else {
      player.unMute();
    }
  }, [isMuted, player]);

  // 데이터 로딩은 컴포넌트 상단 useEffect에서 처리
  const refreshRecipeState = useCallback(async () => {
    if (!recipe) return;
    const latest = await recipeApi.getById(recipe.id);
    setRecipe(latest);
    setOwnedBookIds((latest.ownedRecipeBookIds || []).map((bookId) => String(bookId)));
  }, [recipe]);

  const adjustServings = (delta: number) => {
    const newServings = Math.max(1, servings + delta);
    setServings(newServings);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 재료 양 조절 (인분 기준)
  const getAdjustedAmount = (amount: number, unit: string) => {
    if (!recipe) return `${amount}${unit}`;

    // 기본 인분(recipe.servingSize) 대비 현재 인분(servings) 비율
    const ratio = servings / recipe.servingSize;
    const adjustedAmount = amount * ratio;

    // 소수점 처리 (정수면 그대로, 아니면 소수점 1자리)
    const formattedAmount = Number.isInteger(adjustedAmount)
      ? adjustedAmount
      : adjustedAmount.toFixed(1);

    return `${formattedAmount}${unit}`;
  };

  const openBookmarkSheet = useCallback(async () => {
    setShowBookmarkSheet(true);

    // 서버에서 이미 저장된 레시피북 ID 목록 조회
    if (recipe) {
      try {
        const response = await api.get<{ data: number[] | { recipeBookIds?: number[] } }>(
          `/api/v1/recipebooks/recipes/${recipe.id}`
        );
        const payload = response.data;
        const savedBookIds = Array.isArray(payload) ? payload : (payload?.recipeBookIds ?? []);
        setOwnedBookIds((savedBookIds || []).map((bookId) => String(bookId)));
      } catch (err) {
        console.error('[Bookmark] 저장된 레시피북 조회 실패:', err);
      }
    }

    Animated.parallel([
      Animated.timing(bookmarkOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [recipe, bookmarkOverlayOpacity, bookmarkSheetTranslateY]);

  const closeBookmarkSheet = useCallback((onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(bookmarkOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkSheetTranslateY, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowBookmarkSheet(false);
      onDone?.();
    });
  }, [bookmarkOverlayOpacity, bookmarkSheetTranslateY]);

  const handleSelectFolder = useCallback(async (bookId: string, bookName: string) => {
    if (!recipe) return;
    const recipeBookId = Number(bookId);

    const isAlreadySaved = ownedBookIds.includes(bookId);

    if (isAlreadySaved) {
      // 이미 저장된 북이면 해제
      try {
        await api.delete(`/api/v1/recipebooks/${recipeBookId}/recipes/${recipe.id}`);
        setOwnedBookIds((prev) => prev.filter((id) => id !== bookId));
        await refreshRecipeState();
        showToast(`"${truncateTitle(bookName)}"에서 삭제됐어요!`, "danger");
      } catch {
        showToast("삭제에 실패했어요", "danger");
      }
    } else {
      try {
        await api.post(`/api/v1/recipebooks/${recipeBookId}/recipes`, { recipeId: recipe.id });
        setOwnedBookIds((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
        await refreshRecipeState();
        showToast(`"${truncateTitle(bookName)}"에 저장됐어요!`, "success");
      } catch (e: any) {
        if (e.message && e.message.includes("이미 레시피북에 추가된")) {
          showToast("이미 해당 레시피북에 저장돼 있어요", "danger");
        } else {
          showToast("레시피 저장에 실패했어요", "danger");
        }
      }
    }

    closeBookmarkSheet();
  }, [recipe, ownedBookIds, closeBookmarkSheet, showToast, refreshRecipeState]);

  const handleAddToRecipeBook = () => {
    openBookmarkSheet();
  };

  const handleAddToQueue = async () => {
    if (!recipe) return;
    try {
      await addQueue(recipe.id);
      showToast(`"${truncateTitle(recipe.title)}" 레시피가 대기열에 추가됐어요!`, "success");
    } catch {
      showToast("대기열에 추가하지 못했어요", "danger");
    }
  };

  const handleShoppingList = () => {
    if (!recipe) return;
    if (groups.length === 0) {
      setShowNoGroupModal(true);
      return;
    }
    setShowGroupSelectModal(true);
  };

  // 그룹 선택 후 재료 선택 모달 열기
  const handleGroupSelect = (groupId: string, groupName: string) => {
    if (!recipe) return;
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    // 기본적으로 모든 재료 선택
    setSelectedIngredients(recipe.ingredients.map((ing) => ing.name));
    setShowGroupSelectModal(false);
    setShowIngredientSelectModal(true);
  };

  // 재료 선택/해제 토글
  const toggleIngredient = (ingredientName: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((name) => name !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  // 전체 선택/해제
  const toggleAllIngredients = () => {
    if (!recipe) return;
    if (selectedIngredients.length === recipe.ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(recipe.ingredients.map((ing) => ing.name));
    }
  };

  // 장보기 목록에 추가
  const handleAddToShoppingList = async () => {
    if (!recipe || selectedIngredients.length === 0) return;

    setShowIngredientSelectModal(false);
    setIsAddingToShoppingList(true);

    try {
      // 선택된 재료만 추가
      const items = selectedIngredients.map((name) => ({ name }));

      // POST /api/v1/groups/{groupId}/shopping-list/bulk
      await api.post(`/api/v1/groups/${selectedGroupId}/shopping-list/bulk`, { items });

      showToast(
        `${selectedIngredients.length}개 재료가 "${selectedGroupName}" 장보기 목록에 추가됐어요!`,
        "success"
      );
    } catch (error) {
      console.error("장보기 목록 추가 실패:", error);
      showToast("장보기 목록에 추가하지 못했어요", "danger");
    } finally {
      setIsAddingToShoppingList(false);
    }
  };

  const openMoreSheet = useCallback(() => {
    setShowMoreSheet(true);
    Animated.parallel([
      Animated.timing(moreOverlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(moreSheetTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [moreOverlayOpacity, moreSheetTranslateY]);

  const closeMoreSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(moreOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(moreSheetTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMoreSheet(false);
    });
  }, [moreOverlayOpacity, moreSheetTranslateY]);

  const handleFeedback = () => {
    closeMoreSheet();
    setTimeout(() => {
      setFeedbackType(null);
      setFeedbackContent("");
      setShowFeedbackModal(true);
    }, 250);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackType || !recipe) return;
    setFeedbackSubmitting(true);
    try {
      await api.post("/api/v1/feedback", {
        targetType: "RECIPE",
        targetId: recipe.id,
        feedbackType,
        ...(feedbackContent.trim() && { description: feedbackContent.trim() }),
      });
      setShowFeedbackModal(false);
      showToast("피드백이 접수됐어요, 감사합니다!", "success");
    } catch {
      showToast("피드백 접수에 실패했어요", "danger");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // 이미지 URL 처리 헬퍼 함수
  const getImageUrl = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";
    if (url.startsWith("http")) return url;
    // 상대 경로인 경우 API URL 추가
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
        <StatusBar barStyle="dark-content" />
        {/* Skeleton hero */}
        <View style={{ width: SCREEN_WIDTH, height: VIDEO_HEIGHT, backgroundColor: Colors.neutral[200] }} />
        {/* Skeleton content */}
        <View style={{ padding: Spacing.xl }}>
          {/* Author skeleton */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.neutral[200] }} />
            <View style={{ marginLeft: Spacing.md }}>
              <View style={{ width: 120, height: 14, borderRadius: 7, backgroundColor: Colors.neutral[200] }} />
              <View style={{ width: 80, height: 10, borderRadius: 5, backgroundColor: Colors.neutral[200], marginTop: 6 }} />
            </View>
          </View>
          {/* Description skeleton */}
          <View style={{ width: "100%", height: 14, borderRadius: 7, backgroundColor: Colors.neutral[200], marginBottom: 8 }} />
          <View style={{ width: "70%", height: 14, borderRadius: 7, backgroundColor: Colors.neutral[200], marginBottom: Spacing.lg }} />
          {/* Tags skeleton */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: Spacing.xl }}>
            {[80, 60, 90].map((w, i) => (
              <View key={i} style={{ width: w, height: 28, borderRadius: BorderRadius.full, backgroundColor: Colors.neutral[200] }} />
            ))}
          </View>
          {/* Ingredients card skeleton */}
          <View style={{ height: 200, borderRadius: BorderRadius.xl, backgroundColor: Colors.neutral[200] }} />
        </View>
        {/* Center spinner */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[50], padding: Spacing.xl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: Colors.neutral[100],
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <AlertTriangle size={36} color={Colors.neutral[400]} />
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.lg,
            fontWeight: Typography.fontWeight.bold,
            color: Colors.neutral[900],
            marginBottom: Spacing.sm,
            textAlign: "center",
          }}
        >
          레시피를 불러올 수 없어요
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.base,
            color: Colors.neutral[500],
            textAlign: "center",
            lineHeight: 22,
            marginBottom: Spacing.xl,
          }}
        >
          {error || "레시피 정보를 찾을 수 없습니다."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing["2xl"],
            borderRadius: BorderRadius.lg,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: Typography.fontWeight.semiBold,
              color: "#FFFFFF",
            }}
          >
            뒤로가기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwned = ownedBookIds.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle={isHeaderDark ? "dark-content" : "light-content"} />

      {/* 스크롤 반응 헤더: 히어로 위에서는 투명+흰색, 콘텐츠에서는 흰 배경+어두운 아이콘 */}
      {!isFullscreen && (
      <RAnimated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            paddingTop: insets.top,
          },
          headerBgStyle,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            height: 52,
            paddingHorizontal: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isHeaderDark ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.35)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} color={isHeaderDark ? Colors.neutral[800] : "#FFFFFF"} />
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {recipe?.recipeSource === "IMPORT" && recipe?.sourceUrl && (
              <Pressable
                onPress={() => Linking.openURL(recipe.sourceUrl!)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isHeaderDark ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.35)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ExternalLink size={20} color={isHeaderDark ? Colors.neutral[800] : "#FFFFFF"} />
              </Pressable>
            )}
            <TouchableOpacity
              onPress={openMoreSheet}
              activeOpacity={0.8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isHeaderDark ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.35)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MoreVertical size={24} color={isHeaderDark ? Colors.neutral[800] : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
        </View>
      </RAnimated.View>
      )}

      <GestureDetector gesture={pullGesture}>
      <GestureDetector gesture={nativeScrollGesture}>
      <RAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        scrollEnabled={!isFullscreen}
      >
        {/* Recipe Video or Image */}
        <RAnimated.View style={[heroAnimatedStyle, { overflow: 'hidden' }]}>
          {/* 스케일 래퍼: 컨테이너가 늘어나면 콘텐츠도 같이 커짐 */}
          <RAnimated.View
            style={[
              {
                width: SCREEN_WIDTH,
                height: VIDEO_HEIGHT,
                transformOrigin: 'center top',
              },
              heroContentScaleStyle,
            ]}
          >
            {videoId ? (
              <>
                {/* YouTube Player */}
                <View
                  style={{
                    width: SCREEN_WIDTH,
                    height: VIDEO_HEIGHT,
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <YoutubeView
                    player={player}
                    width={PLAYER_WIDTH}
                    height={VIDEO_HEIGHT}
                    style={{ backgroundColor: "#000" }}
                    webViewStyle={{ backgroundColor: "#000" }}
                    webViewProps={{
                      allowsInlineMediaPlayback: true,
                      mediaPlaybackRequiresUserAction: false,
                      scrollEnabled: false,
                    }}
                  />
                </View>

                {/* 미재생 시 썸네일 오버레이 (네이티브 플레이어 UI 가리기) */}
                {!isVideoPlaying && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                    pointerEvents="none"
                  >
                    <Image
                      source={{ uri: `https://i.ytimg.com/vi/${videoId}/hq720.jpg` }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: SCREEN_WIDTH,
                        height: VIDEO_HEIGHT,
                      }}
                      contentFit="cover"
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }}
                    />
                  </View>
                )}
              </>
            ) : (
              /* 이미지 폴백 (비디오 없을 때) */
              <Image
                source={{ uri: getImageUrl(recipe.mainImgUrl) }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            )}
          </RAnimated.View>

          {/* 탭 오버레이 - 스케일 래퍼 바깥이라 버튼 크기 유지 */}
          {videoId && (
            <Pressable
              onPress={togglePlayPause}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 5,
              }}
            >
              {/* 미재생 시 재생 버튼 */}
              {!isVideoPlaying && (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              )}
            </Pressable>
          )}

          {/* 음소거 토글 버튼 - 스케일 래퍼 바깥 */}
          {videoId && isVideoPlaying && (
            <TouchableOpacity
              onPress={toggleMute}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              {isMuted ? (
                <VolumeX size={20} color="#FFFFFF" />
              ) : (
                <Volume2 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}

          {/* Top gradient for header readability */}
          {!isFullscreen && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 120,
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
              pointerEvents="none"
            />
          )}

          {/* 풀스크린 닫기 버튼 */}
          {isFullscreen && (
            <TouchableOpacity
              onPress={() => {
                pullOffset.value = withTiming(0, { duration: 250 });
                isFullscreenShared.value = false;
                exitFullscreenJS();
              }}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                top: 48,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 30,
              }}
            >
              <Minimize2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </RAnimated.View>

        {/* Content Section */}
        <View style={{ padding: Spacing.xl, backgroundColor: Colors.neutral[0] }}>
          {/* Title */}
          <Text
            style={{
              fontSize: Typography.fontSize["2xl"],
              fontWeight: Typography.fontWeight.bold,
              color: Colors.neutral[900],
              lineHeight: 34,
            }}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          {/* Quick stats row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: Spacing.base }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Clock size={15} color={Colors.neutral[400]} />
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[600], fontWeight: Typography.fontWeight.medium }}>
                {recipe.cookingTime}분
              </Text>
            </View>
            <View style={{ width: 1, height: 12, backgroundColor: Colors.neutral[200] }} />
            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[600], fontWeight: Typography.fontWeight.medium }}>
              {DIFFICULTY_LABELS[recipe.difficulty] || recipe.difficulty}
            </Text>
            <View style={{ flex: 1 }} />
            {/* Bookmark button with count */}
            <Pressable
              onPress={openBookmarkSheet}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 36,
                paddingHorizontal: 12,
                borderRadius: 18,
                backgroundColor: isOwned ? Colors.primary[50] : Colors.neutral[100],
              }}
            >
              <Bookmark
                size={17}
                color={isOwned ? Colors.primary[500] : Colors.neutral[400]}
                fill={isOwned ? Colors.primary[500] : "transparent"}
              />
              <Text style={{
                fontSize: Typography.fontSize.sm,
                color: isOwned ? Colors.primary[500] : Colors.neutral[500],
                fontWeight: Typography.fontWeight.semiBold,
              }}>
                {formatCount(recipe.bookmarkCount)}
              </Text>
            </Pressable>
          </View>

          {/* Description */}
          {recipe.description && (
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[600],
                lineHeight: 24,
                marginTop: Spacing.base,
              }}
            >
              {recipe.description}
            </Text>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: Spacing.base }}>
              {recipe.tags.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: Colors.neutral[100],
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: BorderRadius.full,
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[600],
                    }}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Author / Creator Info */}
          <View style={{
            backgroundColor: Colors.neutral[0],
            borderRadius: BorderRadius.xl,
            borderWidth: 1,
            borderColor: Colors.neutral[200],
            padding: Spacing.base,
            marginTop: Spacing.lg,
            flexDirection: "row",
            alignItems: "center",
          }}>
            {/* 왼쪽: 작성자 */}
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              {recipe.authorProfileImgUrl ? (
                <Image
                  source={{ uri: getImageUrl(recipe.authorProfileImgUrl) }}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    borderWidth: 2, borderColor: Colors.primary[100],
                    backgroundColor: Colors.neutral[200],
                  }}
                  contentFit="cover"
                />
              ) : (
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  borderWidth: 2, borderColor: Colors.primary[100],
                  backgroundColor: Colors.neutral[100],
                  justifyContent: "center", alignItems: "center",
                }}>
                  <ChefHat size={18} color={Colors.neutral[400]} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={{
                  fontSize: Typography.fontSize.xs,
                  color: Colors.neutral[400],
                }}>
                  작성자
                </Text>
                <Text style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.semiBold,
                  color: Colors.neutral[700],
                  marginTop: 2,
                }} numberOfLines={1}>
                  {recipe.authorName || "알 수 없음"}
                </Text>
              </View>
            </View>

            {/* 구분선 (IMPORT일 때만) */}
            {recipe.recipeSource === "IMPORT" && recipe.creatorName && (
              <>
                <View style={{
                  width: 1,
                  height: 36,
                  backgroundColor: Colors.neutral[200],
                  marginHorizontal: Spacing.sm,
                }} />

                {/* 오른쪽: 원작자 */}
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                  {recipe.creatorProfileImgUrl ? (
                    <Image
                      source={{ uri: getImageUrl(recipe.creatorProfileImgUrl) }}
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        borderWidth: 2, borderColor: Colors.neutral[200],
                        backgroundColor: Colors.neutral[200],
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      borderWidth: 2, borderColor: Colors.neutral[200],
                      backgroundColor: Colors.neutral[100],
                      justifyContent: "center", alignItems: "center",
                    }}>
                      <ChefHat size={18} color={Colors.neutral[400]} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      color: Colors.neutral[400],
                    }}>
                      원작자
                    </Text>
                    <Text style={{
                      fontSize: Typography.fontSize.sm,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[700],
                      marginTop: 2,
                    }} numberOfLines={1}>
                      {recipe.creatorName}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Thick Section Divider */}
          <View
            style={{
              height: 8,
              backgroundColor: Colors.neutral[100],
              marginHorizontal: -Spacing.xl,
              marginTop: Spacing.xl,
              marginBottom: Spacing.xl,
            }}
          />

          {/* Ingredients Card */}
          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
              overflow: "hidden",
            }}
          >
            {/* Card Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: Spacing.base,
                paddingVertical: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.lg,
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                }}
              >
                재료
              </Text>

              {/* Servings Adjuster Pill */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                }}
              >
                <Pressable
                  onPress={() => adjustServings(-1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[500], fontWeight: "600" }}>−</Text>
                </Pressable>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginHorizontal: Spacing.sm,
                    gap: 4,
                  }}
                >
                  <Users size={14} color={Colors.primary[500]} />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary[500] }}>
                    {servings}인분
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustServings(1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[500], fontWeight: "600" }}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Ingredients List */}
            {recipe.ingredients.map((ingredient, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.base,
                  borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.neutral[100],
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.base, color: Colors.neutral[800] }}>
                  {ingredient.name}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    color: Colors.neutral[500],
                    fontWeight: Typography.fontWeight.medium,
                  }}
                >
                  {getAdjustedAmount(ingredient.amount, ingredient.unit)}
                </Text>
              </View>
            ))}
          </View>

          {/* Thick Section Divider */}
          <View
            style={{
              height: 8,
              backgroundColor: Colors.neutral[100],
              marginHorizontal: -Spacing.xl,
              marginTop: Spacing.xl,
              marginBottom: Spacing.xl,
            }}
          />

          {/* Steps Section */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xl }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.lg,
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                }}
              >
                조리순서
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[400] }}>
                {recipe.steps.length}단계
              </Text>
            </View>

            {recipe.steps.map((step, index) => (
              <View
                key={index}
                style={{
                  paddingBottom: index < recipe.steps.length - 1 ? Spacing.xl : 0,
                  marginBottom: index < recipe.steps.length - 1 ? Spacing.xl : 0,
                  borderBottomWidth: index < recipe.steps.length - 1 ? 1 : 0,
                  borderBottomColor: Colors.neutral[100],
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontWeight: Typography.fontWeight.bold,
                    color: Colors.primary[500],
                    letterSpacing: 0.5,
                    marginBottom: Spacing.sm,
                  }}
                >
                  STEP {step.stepOrder || index + 1}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    color: Colors.neutral[700],
                    lineHeight: 24,
                  }}
                >
                  {step.description}
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </View>
      </RAnimated.ScrollView>
      </GestureDetector>
      </GestureDetector>

      {/* Bottom Action Bar */}
      {!isFullscreen && (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors.neutral[0],
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
          ...Shadows.lg,
          flexDirection: "row",
          gap: Spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={handleAddToRecipeBook}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[0],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            borderWidth: 1.5,
            borderColor: Colors.neutral[200],
            gap: 6,
          }}
        >
          <ChefHat size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            레시피북
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddToQueue}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[0],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            borderWidth: 1.5,
            borderColor: Colors.neutral[200],
            gap: 6,
          }}
        >
          <ListPlus size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            대기열
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShoppingList}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.primary[500],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
            장볼거리
          </Text>
        </TouchableOpacity>
      </View>
      )}

      {/* 레시피북 선택 Bottom Sheet */}
      <Modal
        visible={showBookmarkSheet}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeBookmarkSheet()}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: bookmarkOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={() => closeBookmarkSheet()} />
          </Animated.View>

          {/* 시트 */}
          <Animated.View
            style={{
              transform: [{ translateY: bookmarkSheetTranslateY }],
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* 핸들 바 */}
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: Colors.neutral[300],
                  borderRadius: 2,
                }}
              />
            </View>

            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.neutral[900] }}>
                레시피북에 저장
              </Text>
              <TouchableOpacity onPress={() => closeBookmarkSheet()}>
                <X size={24} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            {/* 탭 */}
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 20,
                paddingVertical: 12,
                gap: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => setBookmarkTab("personal")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: bookmarkTab === "personal" ? Colors.neutral[900] : Colors.neutral[100],
                  gap: 6,
                }}
              >
                <Book size={16} color={bookmarkTab === "personal" ? "#FFF" : Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: bookmarkTab === "personal" ? "#FFF" : Colors.neutral[600],
                  }}
                >
                  개인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBookmarkTab("group")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: bookmarkTab === "group" ? Colors.neutral[900] : Colors.neutral[100],
                  gap: 6,
                }}
              >
                <Users size={16} color={bookmarkTab === "group" ? "#FFF" : Colors.neutral[600]} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: bookmarkTab === "group" ? "#FFF" : Colors.neutral[600],
                  }}
                >
                  그룹
                </Text>
              </TouchableOpacity>
            </View>

            {/* 폴더 목록 */}
            <ScrollView style={{ height: BOOK_LIST_ITEM_HEIGHT * BOOK_LIST_VISIBLE_COUNT }} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {(() => {
                const books = bookmarkTab === "personal"
                  ? personalBooks.map((book) => ({
                    id: String(book.id),
                    name: book.name,
                    recipeCount: book.recipeCount,
                    isDefault: book.isDefault,
                    groupName: undefined as string | undefined,
                    groupId: undefined as string | undefined,
                  }))
                  : groupRecipeBooks.map((book) => ({
                    id: String(book.id),
                    name: book.name,
                    recipeCount: book.recipeCount,
                    isDefault: false,
                    groupName: book.groupName,
                    groupId: book.groupId ? String(book.groupId) : undefined,
                  }));

                if (books.length === 0) {
                  return (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 }}>
                      <Users size={32} color={Colors.neutral[300]} />
                      <Text style={{ fontSize: 14, color: Colors.neutral[400], marginTop: 12 }}>
                        {bookmarkTab === "group"
                          ? "참여한 그룹이 없습니다"
                          : "레시피북이 없습니다"}
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    {books.map((book) => {
                      const isSelected = ownedBookIds.includes(book.id);
                      return (
                        <TouchableOpacity
                          key={book.id}
                          onPress={() => handleSelectFolder(book.id, book.name)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: Colors.neutral[100],
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            <Book size={22} color={isSelected ? Colors.primary[500] : Colors.neutral[500]} strokeWidth={2.5} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: Colors.neutral[900],
                              }}
                            >
                              {book.name}
                              {book.isDefault && (
                                <Text style={{ color: Colors.neutral[400], fontWeight: "400" }}> (기본)</Text>
                              )}
                            </Text>
                            <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                              {book.groupName ? `${book.groupName} · ` : ""}
                              레시피 {book.recipeCount}개
                            </Text>
                          </View>
                          {isSelected && (
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: Colors.primary[500],
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Check size={14} color="#FFF" strokeWidth={3} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {/* 새 레시피북 만들기 */}
                    <TouchableOpacity
                      onPress={() => {
                        closeBookmarkSheet(() => {
                          router.push("/(tabs)/recipe-book");
                        });
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: Colors.primary[50],
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                          borderWidth: 1.5,
                          borderColor: Colors.primary[200],
                          borderStyle: "dashed",
                        }}
                      >
                        <FolderPlus size={22} color={Colors.primary[500]} />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.primary[500] }}>
                        새 레시피북 만들기
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* 그룹 선택 모달 (장보기) */}
      <Modal visible={showGroupSelectModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowGroupSelectModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: BorderRadius["2xl"],
              borderTopRightRadius: BorderRadius["2xl"],
              maxHeight: "60%",
              paddingTop: Spacing.md,
              paddingBottom: insets.bottom + Spacing.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: Spacing.md,
              }}
            />

            {/* 제목 */}
            <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.lg,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                }}
              >
                장보기 목록에 추가
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginTop: 4,
                }}
              >
                어느 그룹의 장보기 목록에 추가할까요?
              </Text>
            </View>

            {/* 그룹 목록 */}
            {groupsLoading ? (
              <View style={{ padding: Spacing.xl, alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => handleGroupSelect(group.id, group.name)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.xl,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.neutral[100],
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: Colors.primary[100],
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: Spacing.md,
                      }}
                    >
                      <Users size={24} color={Colors.primary[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.base,
                          fontWeight: "600",
                          color: Colors.neutral[900],
                        }}
                      >
                        {group.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.sm,
                          color: Colors.neutral[500],
                          marginTop: 2,
                        }}
                      >
                        {group.memberCount}명
                      </Text>
                    </View>
                    <ShoppingCart size={20} color={Colors.neutral[400]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowGroupSelectModal(false)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 재료 선택 모달 */}
      <Modal visible={showIngredientSelectModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowIngredientSelectModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: BorderRadius["2xl"],
              borderTopRightRadius: BorderRadius["2xl"],
              height: "70%",
              paddingTop: Spacing.md,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: Spacing.md,
              }}
            />

            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: Spacing.xl,
                marginBottom: Spacing.md,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: "700",
                    color: Colors.neutral[900],
                  }}
                >
                  재료 선택
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.neutral[500],
                    marginTop: 2,
                  }}
                >
                  {selectedGroupName}에 추가할 재료를 선택하세요
                </Text>
              </View>
              <TouchableOpacity onPress={toggleAllIngredients} activeOpacity={0.7}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.primary[500],
                    fontWeight: "600",
                  }}
                >
                  {recipe && selectedIngredients.length === recipe.ingredients.length
                    ? "전체 해제"
                    : "전체 선택"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 선택된 개수 */}
            <View
              style={{
                backgroundColor: Colors.primary[50],
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.xl,
                marginBottom: Spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.primary[700],
                  fontWeight: "500",
                }}
              >
                {selectedIngredients.length}개 선택됨
              </Text>
            </View>

            {/* 재료 목록 */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.md }}>
              {recipe?.ingredients.map((ingredient, index) => {
                const isSelected = selectedIngredients.includes(ingredient.name);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleIngredient(ingredient.name)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.xl,
                      backgroundColor: isSelected ? Colors.primary[50] : "transparent",
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={24} color={Colors.primary[500]} />
                    ) : (
                      <Square size={24} color={Colors.neutral[300]} />
                    )}
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.base,
                          color: Colors.neutral[900],
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {ingredient.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.sm,
                          color: Colors.neutral[500],
                          marginTop: 2,
                        }}
                      >
                        {ingredient.amount} {ingredient.unit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 하단 버튼 */}
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                paddingHorizontal: Spacing.xl,
                paddingTop: Spacing.md,
                paddingBottom: insets.bottom + Spacing.md,
                borderTopWidth: 1,
                borderTopColor: Colors.neutral[100],
              }}
            >
              <TouchableOpacity
                onPress={() => setShowIngredientSelectModal(false)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddToShoppingList}
                disabled={selectedIngredients.length === 0}
                activeOpacity={0.8}
                style={{
                  flex: 2,
                  backgroundColor:
                    selectedIngredients.length === 0
                      ? Colors.neutral[200]
                      : Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <ShoppingCart
                  size={18}
                  color={selectedIngredients.length === 0 ? Colors.neutral[400] : "#FFFFFF"}
                />
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: selectedIngredients.length === 0 ? Colors.neutral[400] : "#FFFFFF",
                  }}
                >
                  {selectedIngredients.length}개 추가하기
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>


      {/* 그룹 없음 모달 */}
      <Modal visible={showNoGroupModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowNoGroupModal(false)}
        >
          <Pressable
            style={{
              width: "85%",
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius["2xl"],
              padding: Spacing.xl,
              alignItems: "center",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <Users size={40} color={Colors.neutral[400]} />
            </View>

            {/* 제목 */}
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: "700",
                color: Colors.neutral[900],
                marginBottom: Spacing.sm,
              }}
            >
              참여 중인 그룹이 없어요
            </Text>

            {/* 설명 */}
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
                marginBottom: Spacing.xl,
              }}
            >
              장보기 목록은 그룹 단위로 관리됩니다.{"\n"}그룹에 참여한 후 이용해주세요.
            </Text>

            {/* 버튼들 */}
            <View style={{ flexDirection: "row", gap: Spacing.sm, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setShowNoGroupModal(false)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  닫기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowNoGroupModal(false);
                  router.push("/(tabs)/group");
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  그룹 만들기
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 더보기 바텀시트 */}
      <Modal
        visible={showMoreSheet}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeMoreSheet}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: moreOverlayOpacity,
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={closeMoreSheet} />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: moreSheetTranslateY }],
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* 핸들 바 */}
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: Colors.neutral[300],
                  borderRadius: 2,
                }}
              />
            </View>

            {/* 메뉴 항목 */}
            <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
              <TouchableOpacity
                onPress={handleFeedback}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MessageCircle size={22} color={Colors.neutral[600]} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.neutral[900] }}>
                    컨텐츠 피드백
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 2 }}>
                    이 레시피에 대한 의견을 보내주세요
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 컨텐츠 피드백 접수 모달 */}
      <Modal
        visible={showFeedbackModal}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => {
          if (!feedbackSubmitting) setShowFeedbackModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              if (!feedbackSubmitting) setShowFeedbackModal(false);
            }}
          >
            <Pressable
              style={{
                width: "90%",
                maxHeight: "80%",
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
              }}
              onPress={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 16,
                }}
              >
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.neutral[900] }}>
                    컨텐츠 피드백
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.neutral[400], marginTop: 4 }}>
                    어떤 문제가 있나요?
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowFeedbackModal(false)}
                  disabled={feedbackSubmitting}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <X size={20} color={Colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 460 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* 피드백 유형 선택 */}
                <View style={{ gap: 8 }}>
                  {FEEDBACK_TYPES.map((type) => {
                    const isSelected = feedbackType === type.id;
                    const Icon = type.icon;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() => setFeedbackType(isSelected ? null : type.id)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 14,
                          borderRadius: 14,
                          backgroundColor: isSelected ? Colors.primary[50] : Colors.neutral[50],
                          borderWidth: 1.5,
                          borderColor: isSelected ? Colors.primary[400] : Colors.neutral[200],
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: isSelected ? Colors.primary[100] : Colors.neutral[100],
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Icon size={20} color={isSelected ? Colors.primary[500] : Colors.neutral[500]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "600",
                              color: isSelected ? Colors.primary[700] : Colors.neutral[900],
                            }}
                          >
                            {type.label}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isSelected ? Colors.primary[400] : Colors.neutral[400],
                              marginTop: 2,
                            }}
                          >
                            {type.description}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: isSelected ? Colors.primary[500] : "transparent",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {isSelected && <Check size={13} color="#FFF" strokeWidth={3} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 상세 내용 입력 */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                    marginTop: 20,
                    marginBottom: 8,
                  }}
                >
                  상세 내용 (선택)
                </Text>
                <TextInput
                  value={feedbackContent}
                  onChangeText={setFeedbackContent}
                  placeholder="구체적인 내용을 알려주시면 검토에 도움이 됩니다"
                  placeholderTextColor={Colors.neutral[300]}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                  style={{
                    backgroundColor: Colors.neutral[50],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 14,
                    color: Colors.neutral[800],
                    minHeight: 100,
                    lineHeight: 20,
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.neutral[300],
                    textAlign: "right",
                    marginTop: 6,
                  }}
                >
                  {feedbackContent.length}/500
                </Text>

                {/* 제출 버튼 */}
                <TouchableOpacity
                  onPress={handleSubmitFeedback}
                  disabled={!feedbackType || feedbackSubmitting}
                  activeOpacity={0.8}
                  style={{
                    marginTop: 16,
                    backgroundColor: !feedbackType ? Colors.neutral[200] : Colors.primary[500],
                    paddingVertical: 15,
                    borderRadius: BorderRadius.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {feedbackSubmitting && (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: !feedbackType ? Colors.neutral[400] : "#FFFFFF",
                    }}
                  >
                    {feedbackSubmitting ? "접수 중..." : "피드백 보내기"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <FeedbackToast
        message={toastMessage}
        variant={toastVariant}
        opacity={toastOpacity}
        translate={toastTranslate}
        bottomOffset={88}
      />

      {/* 장보기 추가 로딩 */}
      {isAddingToShoppingList && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text style={{ marginTop: Spacing.md, color: Colors.neutral[700] }}>
              장보기 목록에 추가 중...
            </Text>
          </View>
        </View>
      )}
    </View >
  );
}
