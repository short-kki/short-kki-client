import { Colors } from "@/constants/design-system";
import { MOCK_CURATION_SECTIONS, MOCK_SHORTS, type ShortsItem } from "@/data/mock";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  BookOpen,
  Bookmark,
  CalendarPlus,
  Check,
  ExternalLink,
  FolderPlus,
  MoreVertical,
  Play,
  ScrollText,
  Users,
  Volume2,
  VolumeX,
  X
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerState, YoutubeView, useYouTubeEvent, useYouTubePlayer } from "react-native-youtube-bridge";

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// 쇼츠 비디오 데이터 (홈과 동일한 데이터)
const CURATION_AS_SHORTS: ShortsItem[] = MOCK_CURATION_SECTIONS.flatMap((section) =>
  section.recipes.map((recipe) => ({
    id: recipe.id,
    videoId: recipe.id,
    videoUrl: `https://www.youtube.com/shorts/${recipe.id}`,
    title: recipe.title,
    author: recipe.author,
    authorAvatar: recipe.author?.[0],
    creatorName: recipe.creatorName,
    thumbnail: recipe.thumbnail,
    views: undefined,
    tags: [],
    bookmarks: recipe.bookmarks ?? 0,
  }))
);

const SHORTS_DATA: ShortsItem[] = [...MOCK_SHORTS, ...CURATION_AS_SHORTS];

interface VideoItemProps {
  item: ShortsItem;
  isActive: boolean;
  itemHeight: number;
  onMuteToggle: () => void;
  isMuted: boolean;
  onViewRecipe: () => void;
  onAddToMealPlan: () => void;
  onBookmarkPress: () => void;
  isBookmarked: boolean;
  bookmarkCount: number;
}

// 개별 비디오 아이템 컴포넌트 (YouTube 플레이어 - react-native-youtube-bridge)
function VideoItem({ item, isActive, itemHeight, onMuteToggle, isMuted, onViewRecipe, onAddToMealPlan, onBookmarkPress, isBookmarked, bookmarkCount }: VideoItemProps) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerWidth = Math.max(SCREEN_WIDTH, itemHeight * (16 / 9));

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
      if (isActive) {
        player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isReady, player]);

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
        width: SCREEN_WIDTH,
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
            width: SCREEN_WIDTH,
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
            width: SCREEN_WIDTH,
            height: itemHeight,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <YoutubeView
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
              width: SCREEN_WIDTH,
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

        {/* 식단 추가 */}
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
            <CalendarPlus size={26} color="#FFF" />
          </View>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "500", marginTop: 4 }}>
            식단
          </Text>
        </TouchableOpacity>

        {/* YouTube 원본 */}
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/shorts/${item.videoId}`)} activeOpacity={0.8} style={{ alignItems: "center" }}>
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
  const router = useRouter();
  const params = useLocalSearchParams<{ startIndex?: string }>();
  const flatListRef = useRef<FlatList>(null);
  const itemHeight = SCREEN_HEIGHT - tabBarHeight;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // 북마크 관련 상태
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const bookmarkOverlayOpacity = useRef(new Animated.Value(0)).current;
  const bookmarkSheetTranslateY = useRef(new Animated.Value(400)).current;
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [bookmarkTab, setBookmarkTab] = useState<"personal" | "group">("personal");
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Record<string, { bookId: string; count: number }>>({});
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SHORTS_DATA.forEach(item => { initial[item.id] = item.bookmarks ?? 0; });
    return initial;
  });

  // 시작 인덱스가 있으면 해당 위치로 스크롤
  useEffect(() => {
    if (params.startIndex) {
      const index = SHORTS_DATA.findIndex(item => item.id === params.startIndex);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
          setActiveIndex(index);
        }, 100);
      }
    }
  }, [params.startIndex]);

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

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleViewRecipe = useCallback((recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  }, [router]);

  const handleAddToMealPlan = useCallback((title: string) => {
    Alert.alert(
      "식단에 추가",
      `"${title}" 레시피를 어떤 날짜에 추가할까요?`,
      [
        { text: "오늘", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "내일", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "취소", style: "cancel" },
      ]
    );
  }, [router]);

  const handleMoreOptions = useCallback(() => {
    Alert.alert(
      "더보기",
      "어떤 작업을 하시겠어요?",
      [
        { text: "신고하기", onPress: () => Alert.alert("신고", "신고가 접수되었습니다.") },
        { text: "취소", style: "cancel" },
      ]
    );
  }, []);

  // 북마크 시트 열기 (페이드 오버레이 + 슬라이드업)
  const openBookmarkSheet = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setShowBookmarkSheet(true);
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
  }, [bookmarkOverlayOpacity, bookmarkSheetTranslateY]);

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
  const handleSelectFolder = useCallback((bookId: string, bookName: string) => {
    if (!selectedVideoId) return;

    const isAlreadySaved = bookmarkedVideos[selectedVideoId]?.bookId === bookId;

    if (isAlreadySaved) {
      // 이미 저장된 폴더면 해제
      setBookmarkedVideos(prev => {
        const { [selectedVideoId]: _, ...rest } = prev;
        return rest;
      });
      setBookmarkCounts(prev => ({
        ...prev,
        [selectedVideoId]: (prev[selectedVideoId] || 0) - 1,
      }));
      Alert.alert("북마크 해제", `"${bookName}"에서 삭제되었습니다.`);
    } else {
      // 새로 저장
      const wasBookmarked = !!bookmarkedVideos[selectedVideoId];
      setBookmarkedVideos(prev => ({
        ...prev,
        [selectedVideoId]: { bookId, count: prev[selectedVideoId]?.count || 0 },
      }));
      if (!wasBookmarked) {
        setBookmarkCounts(prev => ({
          ...prev,
          [selectedVideoId]: (prev[selectedVideoId] || 0) + 1,
        }));
      }
      Alert.alert("저장 완료", `"${bookName}"에 저장되었습니다.`);
    }

    closeBookmarkSheet();
  }, [selectedVideoId, bookmarkedVideos, closeBookmarkSheet]);

  const renderItem = useCallback(
    ({ item, index }: { item: ShortsItem; index: number }) => (
      <VideoItem
        item={item}
        isActive={index === activeIndex}
        itemHeight={itemHeight}
        onMuteToggle={toggleMute}
        isMuted={isMuted}
        onViewRecipe={() => handleViewRecipe(item.id)}
        onAddToMealPlan={() => handleAddToMealPlan(item.title)}
        onBookmarkPress={() => openBookmarkSheet(item.id)}
        isBookmarked={!!bookmarkedVideos[item.id]}
        bookmarkCount={bookmarkCounts[item.id] ?? item.bookmarks ?? 0}
      />
    ),
    [activeIndex, isMuted, toggleMute, handleViewRecipe, handleAddToMealPlan, openBookmarkSheet, bookmarkedVideos, bookmarkCounts]
  );

  const keyExtractor = useCallback((item: ShortsItem) => item.id, []);

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
            onPress={handleMoreOptions}
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
        pagingEnabled
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
      />

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
              <BookOpen size={16} color={bookmarkTab === "personal" ? "#FFF" : Colors.neutral[600]} />
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
          <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {(bookmarkTab === "personal" ? RECIPE_BOOKS.personal : RECIPE_BOOKS.group).map((book) => {
              const isSelected = selectedVideoId && bookmarkedVideos[selectedVideoId]?.bookId === book.id;
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
                    <BookOpen size={22} color={isSelected ? Colors.primary[500] : Colors.neutral[500]} />
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
          </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
