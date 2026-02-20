import { Colors, BorderRadius } from "@/constants/design-system";
import { FeedbackToast, useFeedbackToast } from "@/components/ui/FeedbackToast";
import {
  useCurationShorts,
  useRecommendedCurations,
  useShorts,
  useRecipeQueue,
  usePersonalRecipeBooks,
  useGroupRecipeBooks,
} from "@/hooks";
import type { CurationRecipe, ShortsItem } from "@/data/mock";
import { USE_MOCK, api } from "@/services/api";
import { extractYoutubeId } from "@/utils/youtube";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Ban,
  Book,
  Bookmark,
  Copyright,
  ExternalLink,
  FolderPlus,
  HelpCircle,
  Check,
  ListPlus,
  Megaphone,
  MessageCircle,
  MoreVertical,
  Play,
  ScrollText,
  Users,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerState, YoutubeView, useYouTubeEvent, useYouTubePlayer } from "react-native-youtube-bridge";

const FEEDBACK_TYPES = [
  { id: "INACCURATE", label: "잘못된 정보", icon: AlertTriangle, description: "레시피 내용이 부정확하거나 오류가 있어요" },
  { id: "COPYRIGHT_INFRINGEMENT", label: "저작권 침해", icon: Copyright, description: "원작자의 허락 없이 게시된 콘텐츠예요" },
  { id: "INAPPROPRIATE_CONTENT", label: "부적절한 콘텐츠", icon: Ban, description: "불쾌하거나 유해한 내용이 포함되어 있어요" },
  { id: "SPAM_AD", label: "스팸 / 광고", icon: Megaphone, description: "홍보 목적의 콘텐츠이거나 반복 게시물이에요" },
  { id: "OTHER", label: "기타", icon: HelpCircle, description: "위 항목에 해당하지 않는 의견이에요" },
] as const;

// 레시피북 더미 데이터
const RECIPE_BOOKS = {
  personal: [
    { id: "p1", name: "기본 레시피북", recipeCount: 12, isDefault: true },
    { id: "p2", name: "다이어트 레시피", recipeCount: 5 },
    { id: "p3", name: "자취 필수 요리", recipeCount: 8 },
  ],
  group: [
    { id: "g1", name: "우리 가족 식단", recipeCount: 24, groupName: "우리 가족" },
    { id: "g2", name: "자취생 모임 레시피", recipeCount: 15, groupName: "자취생 요리 모임" },
  ],
};

// 화면 크기는 ShortsScreen 컴포넌트에서 useWindowDimensions로 가져옴
const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

interface VideoItemProps {
  item: ShortsItem;
  isActive: boolean;
  itemHeight: number;
  screenWidth: number;
  onMuteToggle: () => void;
  isMuted: boolean;
  onViewRecipe: () => void;
  onAddToMealPlan: () => void;
  onBookmarkPress: () => void;
  isBookmarked: boolean;
  bookmarkCount: number;
  isScreenFocused: boolean;
  focusEpoch: number;
  appResumeKey: number;
}

// 개별 비디오 아이템 컴포넌트 (YouTube 플레이어 - react-native-youtube-bridge)
function VideoItem({ item, isActive, itemHeight, screenWidth, onMuteToggle, isMuted, onViewRecipe, onAddToMealPlan, onBookmarkPress, isBookmarked, bookmarkCount, isScreenFocused, focusEpoch, appResumeKey }: VideoItemProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 앱 복귀 시 WebView 재생성을 위해 상태 초기화
  useEffect(() => {
    if (appResumeKey > 0) {
      setIsReady(false);
      setIsPlaying(false);
    }
  }, [appResumeKey]);
  const playerWidth = Math.max(screenWidth, itemHeight * (16 / 9));

  // react-native-youtube-bridge 플레이어 초기화
  const player = useYouTubePlayer(item.videoId, {
    autoplay: true,
    muted: true, // 자동재생을 위해 항상 음소거로 시작
    controls: false,
    playsinline: true,
    rel: false,
    loop: true,
  });

  // 이벤트 리스너
  useYouTubeEvent(player, 'ready', () => {
    setIsReady(true);
  });

  useYouTubeEvent(player, 'stateChange', (state) => {
    if (state === PlayerState.ENDED) {
      player.seekTo(0);
      player.play();
    }
    if (state === PlayerState.PLAYING || state === PlayerState.BUFFERING) {
      setIsPlaying(true);
    }
    if (state === PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  }, []);

  // 활성화 상태에 따라 재생/일시정지
  useEffect(() => {
    if (isReady) {
      if (isActive && isScreenFocused) {
        player.seekTo(0);
        // seekTo가 WebView 브리지를 통해 비동기 처리되므로,
        // 충분한 지연 후 play를 호출해야 안정적으로 재생됨
        const timer = setTimeout(() => {
          player.play();
          setIsPlaying(true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isScreenFocused, focusEpoch, isReady, player]);

  // 음소거 상태 변경
  useEffect(() => {
    if (isReady) {
      if (isMuted) {
        player.mute();
      } else {
        player.unMute();
      }
    }
  }, [isMuted, isReady, player]);

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + "만";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // YouTube 앱으로 직접 열기 (Android에서 브라우저 경유 시 화면 2개 쌓이는 문제 방지)
  const openSourceVideo = useCallback(async () => {
    const webUrl = `https://www.youtube.com/shorts/${item.videoId}`;
    if (Platform.OS === 'android') {
      try {
        await Linking.openURL(`vnd.youtube://${item.videoId}`);
        return;
      } catch {}
    }
    await Linking.openURL(webUrl);
  }, [item.videoId]);

  // 재생/일시정지 토글
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, player]);

  return (
    <View
      style={{
        width: screenWidth,
        height: itemHeight,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* 로딩 중일 때 썸네일 표시 */}
      {!isReady && (
        <Image
          source={{ uri: item.thumbnail }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: screenWidth,
            height: itemHeight,
            zIndex: 1,
          }}
          contentFit="cover"
        />
      )}

      {/* YouTube 플레이어 - 화면 꽉 채우기 */}
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
        }}
      >
        <View
          style={{
            width: screenWidth,
            height: itemHeight,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <YoutubeView
            key={appResumeKey}
            player={player}
            width={playerWidth}
            height={itemHeight}
            style={{
              backgroundColor: "#000",
            }}
            webViewStyle={{
              backgroundColor: "#000",
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              scrollEnabled: false,
            }}
          />
        </View>
      </Pressable>

      {/* 일시정지 상태일 때 썸네일 + 재생 아이콘으로 YouTube UI 덮기 */}
      {isReady && !isPlaying && (
        <Pressable
          onPress={togglePlayPause}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
          }}
        >
          {/* 썸네일로 YouTube UI 덮기 */}
          <Image
            source={{ uri: item.thumbnail }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: screenWidth,
              height: itemHeight,
            }}
            contentFit="cover"
          />
          {/* 어두운 오버레이 */}
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
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Play size={36} color="#FFF" fill="#FFF" />
            </View>
          </View>
        </Pressable>
      )}

      {/* 좌측 하단 - 콘텐츠 정보 (탭바 바로 위) */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 80,
          zIndex: 10,
        }}
      >
        {/* 작성자 */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          {item.authorProfileImgUrl ? (
            <Image
              source={{ uri: item.authorProfileImgUrl }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: 10,
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.3)",
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.primary[500],
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>
                {item.authorAvatar ?? item.author?.[0] ?? "?"}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>
              {item.author}
            </Text>
          </View>
        </View>

        {/* 제목 */}
        <Text
          style={{
            color: "#FFF",
            fontWeight: "bold",
            fontSize: 16,
            lineHeight: 22,
            marginBottom: 10,
            textShadowColor: "rgba(0,0,0,0.7)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* 태그 */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {(item.tags ?? []).map((tag, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "500" }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 우측 하단 - 액션 버튼 */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          right: 12,
          alignItems: "center",
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* 레시피 확인 */}
        <TouchableOpacity onPress={onViewRecipe} activeOpacity={0.8} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.primary[500],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ScrollText size={26} color="#FFF" />
          </View>
          <Text
            style={{
              color: "#FFF",
              fontSize: 11,
              fontWeight: "600",
              marginTop: 4,
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            레시피
          </Text>
        </TouchableOpacity>

        {/* 북마크 */}
        <Pressable onPress={onBookmarkPress} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isBookmarked ? Colors.primary[500] : "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Bookmark
              size={26}
              color="#FFF"
              fill={isBookmarked ? "#FFF" : "transparent"}
            />
          </View>
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600", marginTop: 4 }}>
            {formatCount(bookmarkCount)}
          </Text>
        </Pressable>

        {/* 대기열 추가 */}
        <TouchableOpacity onPress={onAddToMealPlan} activeOpacity={0.8} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ListPlus size={26} color="#FFF" />
          </View>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "500", marginTop: 4 }}>
            대기열
          </Text>
        </TouchableOpacity>

        {/* YouTube 원본 */}
        <TouchableOpacity onPress={openSourceVideo} activeOpacity={0.8} style={{ alignItems: "center" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ExternalLink size={26} color="#FFF" />
          </View>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "500", marginTop: 4 }}>
            출처
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams<{ startIndex?: string | string[]; curationId?: string; curationRecipes?: string }>();
  const flatListRef = useRef<FlatList>(null);
  // 실제 컨테이너 높이 측정 (Android에서 정확한 높이 사용)
  const [containerHeight, setContainerHeight] = useState(0);
  // Android에서는 insets.bottom도 고려 (소프트 네비게이션 바)
  const calculatedHeight = screenHeight - tabBarHeight + (Platform.OS === 'android' ? insets.bottom : 0);
  const itemHeight = containerHeight > 0 ? containerHeight : calculatedHeight;
  const { shorts } = useShorts();
  const { sections } = useRecommendedCurations();
  const { recipeBooks: personalBooks } = usePersonalRecipeBooks();
  const { recipeBooks: groupBooks } = useGroupRecipeBooks();
  const curationId = typeof params.curationId === "string" ? params.curationId : undefined;
  const initialCurationRecipes = useMemo<CurationRecipe[] | null>(() => {
    if (!params.curationRecipes) return null;
    const raw = Array.isArray(params.curationRecipes) ? params.curationRecipes[0] : params.curationRecipes;
    try {
      return JSON.parse(raw) as CurationRecipe[];
    } catch {
      return null;
    }
  }, [params.curationRecipes]);
  const {
    shorts: curationShortsData,
    fetchNextPage: fetchNextCurationPage,
    hasNext: hasNextCurationPage,
    loadingMore: loadingMoreCuration,
  } = useCurationShorts(curationId, initialCurationRecipes ?? undefined);
  const isCurationMode = !!curationId;

  const curationShorts = useMemo<ShortsItem[]>(() => {
    return sections.flatMap((section) =>
      section.recipes.map((recipe) => {
        const videoId = extractYoutubeId(recipe.sourceUrl ?? "") ?? recipe.id;
        return {
          id: recipe.id,
          videoId,
          videoUrl: recipe.sourceUrl || `https://www.youtube.com/shorts/${videoId}`,
          title: recipe.title,
          author: recipe.author,
          authorAvatar: recipe.author?.[0],
          creatorName: recipe.creatorName,
          thumbnail: recipe.thumbnail || getYoutubeThumbnail(videoId),
          views: undefined,
          tags: [],
          bookmarks: recipe.bookmarks ?? 0,
        };
      })
    );
  }, [sections]);

  const isValidYoutubeId = (id: string) => /^[a-zA-Z0-9_-]{11}$/.test(id);

  const SHORTS_DATA: ShortsItem[] = useMemo(() => {
    const raw = isCurationMode ? curationShortsData : [...shorts, ...curationShorts];
    return raw.filter((item) => isValidYoutubeId(item.videoId));
  }, [curationShortsData, isCurationMode, shorts, curationShorts]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [focusEpoch, setFocusEpoch] = useState(0);
  const [appResumeKey, setAppResumeKey] = useState(0);

  // 탭 포커스/블러 관리
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      setFocusEpoch((prev) => prev + 1);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  // 앱 백그라운드→포그라운드 복귀 시 epoch 증가
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setFocusEpoch((prev) => prev + 1);
        setAppResumeKey((prev) => prev + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  // 북마크 관련 상태
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const bookmarkOverlayOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkSheetTranslateY = useRef(new Animated.Value(400)).current;
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [bookmarkTab, setBookmarkTab] = useState<"personal" | "group">("personal");
  const [ownedBookIdsByVideo, setOwnedBookIdsByVideo] = useState<Record<string, string[]>>({});
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<string, number>>({});
  const { toastMessage, toastVariant, toastOpacity, toastTranslate, showToast } =
    useFeedbackToast(1400);

  // 컨텐츠 피드백 바텀시트 + 모달 상태
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const moreOverlayOpacity = useRef(new Animated.Value(0)).current;
  const moreSheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    setBookmarkCounts((prev) => {
      const next = { ...prev };
      SHORTS_DATA.forEach((item) => {
        if (next[item.id] == null) {
          next[item.id] = item.bookmarks ?? 0;
        }
      });
      return next;
    });
  }, [SHORTS_DATA]);

  const recipeBooks = useMemo(() => {
    if (USE_MOCK) {
      return RECIPE_BOOKS;
    }
    return {
      personal: personalBooks.map((book) => ({
        id: book.id,
        name: book.name,
        recipeCount: book.recipeCount,
        isDefault: book.isDefault,
      })),
      group: groupBooks.map((book) => ({
        id: book.id,
        name: book.name,
        recipeCount: book.recipeCount,
        groupName: book.groupName,
      })),
    };
  }, [personalBooks, groupBooks]);

  // 시작 인덱스가 있으면 해당 위치로 스크롤
  const startId = useMemo(() => {
    if (!params.startIndex) return undefined;
    return Array.isArray(params.startIndex) ? params.startIndex[0] : params.startIndex;
  }, [params.startIndex]);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [startId, curationId]);

  useEffect(() => {
    if (!startId || hasScrolledRef.current) return;
    const index = SHORTS_DATA.findIndex(item => item.id === startId);
    if (index !== -1 && index < SHORTS_DATA.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: index * itemHeight, animated: false });
        setActiveIndex(index);
        hasScrolledRef.current = true;
      }, 100);
    }
  }, [startId, SHORTS_DATA, itemHeight]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  useEffect(() => {
    if (!isCurationMode) return;
    if (!hasNextCurationPage || loadingMoreCuration) return;
    if (SHORTS_DATA.length === 0) return;
    if (activeIndex >= SHORTS_DATA.length - 3) {
      fetchNextCurationPage();
    }
  }, [activeIndex, fetchNextCurationPage, hasNextCurationPage, isCurationMode, loadingMoreCuration, SHORTS_DATA.length]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleViewRecipe = useCallback((recipeId: string) => {
    console.log("[Shorts] handleViewRecipe called - recipeId:", recipeId, "type:", typeof recipeId);
    router.push(`/recipe/${recipeId}`);
  }, [router]);

  const { addQueue } = useRecipeQueue();

  const handleAddToMealPlan = useCallback(async (recipeId: string, title: string) => {
    console.log('[Shorts] 대기열 추가 버튼 클릭 - recipeId:', recipeId, 'title:', title);
    try {
      await addQueue(parseInt(recipeId));
      showToast(`"${title}" 레시피가 대기열에 추가됐어요!`, "success");
    } catch {
      showToast("대기열에 추가하지 못했어요", "danger");
    }
  }, [addQueue, showToast]);

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

  const handleFeedback = useCallback(() => {
    closeMoreSheet();
    setTimeout(() => {
      setFeedbackType(null);
      setFeedbackContent("");
      setShowFeedbackModal(true);
    }, 250);
  }, [closeMoreSheet]);

  const handleSubmitFeedback = useCallback(async () => {
    const currentItem = SHORTS_DATA[activeIndex];
    if (!feedbackType || !currentItem) return;
    setFeedbackSubmitting(true);
    try {
      await api.post("/api/v1/feedback", {
        targetType: "RECIPE",
        targetId: currentItem.id,
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
  }, [SHORTS_DATA, activeIndex, feedbackType, feedbackContent, showToast]);

  const syncVideoBookmarkState = useCallback(async (videoId: string) => {
    if (USE_MOCK) return;

    const recipeId = Number(videoId);
    if (!Number.isFinite(recipeId)) {
      return;
    }

    try {
      const [ownedRes, recipeRes] = await Promise.all([
        api.get<{ data: number[] | { recipeBookIds?: number[] } }>(`/api/v1/recipebooks/recipes/${recipeId}`),
        api.get<{ data: { bookmarkCount: number; ownedRecipeBookIds?: number[] } }>(`/api/v1/recipes/${recipeId}`),
      ]);

      const ownedPayload = ownedRes.data;
      const ownedRaw = Array.isArray(ownedPayload)
        ? ownedPayload
        : (ownedPayload?.recipeBookIds ?? []);
      const ownedBookIds = ownedRaw.map((id) => String(id));
      setOwnedBookIdsByVideo((prev) => ({
        ...prev,
        [videoId]: ownedBookIds,
      }));
      setBookmarkCounts((prev) => ({
        ...prev,
        [videoId]: recipeRes.data?.bookmarkCount ?? prev[videoId] ?? 0,
      }));
    } catch (err) {
      console.error("[Bookmark] 숏츠 북마크 상태 동기화 실패:", err);
    }
  }, []);

  // 현재 활성 비디오의 북마크 상태를 서버에서 가져오기
  useEffect(() => {
    const currentItem = SHORTS_DATA[activeIndex];
    if (!currentItem) return;
    // 이미 동기화된 비디오는 스킵
    if (ownedBookIdsByVideo[currentItem.id] !== undefined) return;
    syncVideoBookmarkState(currentItem.id);
  }, [activeIndex, SHORTS_DATA, syncVideoBookmarkState, ownedBookIdsByVideo]);

  // 북마크 시트 열기 (페이드 오버레이 + 슬라이드업)
  const openBookmarkSheet = useCallback(async (videoId: string) => {
    setSelectedVideoId(videoId);
    setShowBookmarkSheet(true);

    await syncVideoBookmarkState(videoId);

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
  }, [bookmarkOverlayOpacity, bookmarkSheetTranslateY, syncVideoBookmarkState]);

  // 북마크 시트 닫기
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

  // 폴더 선택 시 저장
  const handleSelectFolder = useCallback(async (bookId: string, bookName: string) => {
    if (!selectedVideoId) return;

    const ownedBookIds = ownedBookIdsByVideo[selectedVideoId] || [];
    const isAlreadySaved = ownedBookIds.includes(bookId);
    const recipeId = Number(selectedVideoId);
    const recipeBookId = Number(bookId);

    if (!USE_MOCK) {
      if (!Number.isFinite(recipeId)) {
        showToast("레시피 정보를 확인할 수 없어요", "danger");
        return;
      }
      if (!Number.isFinite(recipeBookId)) {
        showToast("레시피북 정보를 확인할 수 없어요", "danger");
        return;
      }
    }

    if (isAlreadySaved) {
      // 이미 저장된 폴더면 해제
      if (!USE_MOCK) {
        try {
          await api.delete(`/api/v1/recipebooks/${recipeBookId}/recipes/${recipeId}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "삭제하지 못했습니다.";
          showToast(message, "danger");
          return;
        }
      }

      setOwnedBookIdsByVideo((prev) => ({
        ...prev,
        [selectedVideoId]: (prev[selectedVideoId] || []).filter((id) => id !== bookId),
      }));
      if (USE_MOCK) {
        setBookmarkCounts((prev) => ({
          ...prev,
          [selectedVideoId]: Math.max(0, (prev[selectedVideoId] || 0) - 1),
        }));
      }
      await syncVideoBookmarkState(selectedVideoId);
      showToast(`"${bookName}"에서 삭제됐어요!`, "danger");
    } else {
      // 새로 저장
      const wasOwned = ownedBookIds.length > 0;
      if (!USE_MOCK) {
        try {
          await api.post(`/api/v1/recipebooks/${recipeBookId}/recipes`, {
            recipeId,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "저장하지 못했습니다.";
          showToast(message, "danger");
          return;
        }
      }

      setOwnedBookIdsByVideo((prev) => ({
        ...prev,
        [selectedVideoId]: (prev[selectedVideoId] || []).includes(bookId)
          ? (prev[selectedVideoId] || [])
          : [...(prev[selectedVideoId] || []), bookId],
      }));
      if (USE_MOCK && !wasOwned) {
        setBookmarkCounts((prev) => ({
          ...prev,
          [selectedVideoId]: (prev[selectedVideoId] || 0) + 1,
        }));
      }
      await syncVideoBookmarkState(selectedVideoId);
      showToast(`"${bookName}"에 저장됐어요!`, "success");
    }

    closeBookmarkSheet();
  }, [selectedVideoId, ownedBookIdsByVideo, closeBookmarkSheet, showToast, syncVideoBookmarkState]);

  const renderItem = useCallback(
    ({ item, index }: { item: ShortsItem; index: number }) => (
      <VideoItem
        item={item}
        isActive={index === activeIndex}
        itemHeight={itemHeight}
        screenWidth={screenWidth}
        onMuteToggle={toggleMute}
        isMuted={isMuted}
        onViewRecipe={() => handleViewRecipe(item.id)}
        onAddToMealPlan={() => handleAddToMealPlan(item.id, item.title)}
        onBookmarkPress={() => openBookmarkSheet(item.id)}
        isBookmarked={(ownedBookIdsByVideo[item.id] || []).length > 0}
        bookmarkCount={bookmarkCounts[item.id] ?? item.bookmarks ?? 0}
        isScreenFocused={isScreenFocused}
        focusEpoch={focusEpoch}
        appResumeKey={appResumeKey}
      />
    ),
    [activeIndex, itemHeight, screenWidth, isMuted, toggleMute, handleViewRecipe, handleAddToMealPlan, openBookmarkSheet, ownedBookIdsByVideo, bookmarkCounts, isScreenFocused, focusEpoch, appResumeKey]
  );

  const keyExtractor = useCallback((item: ShortsItem) => item.id, []);

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 1) {
      setContainerHeight(height);
    }
  }, [containerHeight]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 상단 헤더 */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={toggleMute}
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            {isMuted ? (
              <VolumeX size={22} color="#FFF" />
            ) : (
              <Volume2 size={22} color="#FFF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openMoreSheet}
            activeOpacity={0.8}
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            <MoreVertical size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={SHORTS_DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={{ flex: 1 }}
        onLayout={handleContainerLayout}
        pagingEnabled={false}
        disableIntervalMomentum
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        onEndReached={() => {
          if (isCurationMode && hasNextCurationPage && !loadingMoreCuration) {
            fetchNextCurationPage();
          }
        }}
        onEndReachedThreshold={0.8}
        ListFooterComponent={
          isCurationMode && loadingMoreCuration ? (
            <View style={{ paddingVertical: 24 }}>
              <Text style={{ color: "#FFF", textAlign: "center" }}>로딩 중...</Text>
            </View>
          ) : null
        }
      />

      {/* 컨텐츠 피드백 바텀시트 */}
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

      {/* 북마크 폴더 선택 Bottom Sheet */}
      <Modal
        visible={showBookmarkSheet}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeBookmarkSheet()}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* 오버레이 - 페이드 */}
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

          {/* 시트 - 슬라이드업 */}
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

            {/* 폴더 목록 — 2개 항목 높이 고정 (73px * 2) */}
            <ScrollView style={{ height: 146 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {bookmarkTab === "group" && recipeBooks.group.length === 0 && (
                <View style={{ justifyContent: "center", alignItems: "center", height: 146 }}>
                  <Users size={32} color={Colors.neutral[300]} />
                  <Text style={{ fontSize: 14, color: Colors.neutral[400], marginTop: 12 }}>
                    참여중인 그룹이 없습니다
                  </Text>
                </View>
              )}
              {(bookmarkTab === "personal" ? recipeBooks.personal : recipeBooks.group).map((book) => {
                const isSelected = selectedVideoId
                  ? (ownedBookIdsByVideo[selectedVideoId] || []).includes(book.id)
                  : false;
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
                        {(book as any).isDefault && (
                          <Text style={{ color: Colors.neutral[400], fontWeight: "400" }}> (기본)</Text>
                        )}
                      </Text>
                      <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                        {(book as any).groupName ? `${(book as any).groupName} · ` : ""}
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

              {/* 새 레시피북 만들기 - 개인 탭에서만 표시 */}
              {bookmarkTab === "personal" && <TouchableOpacity
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
              </TouchableOpacity>}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

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
