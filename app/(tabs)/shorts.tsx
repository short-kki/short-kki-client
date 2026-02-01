import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StatusBar,
  ViewToken,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Bookmark,
  Share2,
  CalendarPlus,
  VolumeX,
  Volume2,
  ArrowLeft,
  MoreVertical,
  Play,
  ScrollText,
  X,
  Check,
  BookOpen,
  Users,
  FolderPlus,
} from "lucide-react-native";
import { Colors, BorderRadius, Spacing } from "@/constants/design-system";
import { extractYoutubeId } from "@/utils/youtube";

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
const TAB_BAR_HEIGHT = 85;
const ITEM_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// YouTube 썸네일 URL 생성 함수
const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

// 쇼츠 비디오 데이터 (홈과 동일한 데이터)
const SHORTS_DATA = [
  {
    id: "1",
    videoId: "DkyZ9t12hpo",
    videoUrl: "https://www.youtube.com/shorts/DkyZ9t12hpo",
    title: "초간단 계란 볶음밥 🍳",
    author: "백종원의 요리비책",
    authorAvatar: "백",
    tags: ["#볶음밥", "#자취요리", "#5분완성"],
    bookmarks: 15234,
    thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"),
  },
  {
    id: "2",
    videoId: "NnhIbr5lmEg",
    videoUrl: "https://www.youtube.com/shorts/NnhIbr5lmEg",
    title: "편스토랑 류수영의 꿀팁 요리",
    author: "KBS 편스토랑",
    authorAvatar: "편",
    tags: ["#편스토랑", "#류수영", "#1분요리"],
    bookmarks: 8921,
    thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"),
  },
  {
    id: "3",
    videoId: "ZPFVC78A2jM",
    videoUrl: "https://www.youtube.com/shorts/ZPFVC78A2jM",
    title: "한국인이 좋아하는 속도의 요리",
    author: "1분요리 뚝딱이형",
    authorAvatar: "뚝",
    tags: ["#한식", "#뚝딱이형", "#빠른요리"],
    bookmarks: 22847,
    thumbnail: getYoutubeThumbnail("ZPFVC78A2jM"),
  },
  {
    id: "4",
    videoId: "gQDByCdjUXw",
    videoUrl: "https://www.youtube.com/shorts/gQDByCdjUXw",
    title: "마약 옥수수 만들기",
    author: "요리왕비룡",
    authorAvatar: "비",
    tags: ["#간식", "#옥수수", "#초간단"],
    bookmarks: 5629,
    thumbnail: getYoutubeThumbnail("gQDByCdjUXw"),
  },
  {
    id: "5",
    videoId: "oc1bnLR38fE",
    videoUrl: "https://www.youtube.com/shorts/oc1bnLR38fE",
    title: "크림파스타 황금레시피",
    author: "자취생 요리",
    authorAvatar: "자",
    tags: ["#파스타", "#양식", "#혼밥"],
    bookmarks: 18392,
    thumbnail: getYoutubeThumbnail("oc1bnLR38fE"),
  },
];

interface VideoItemProps {
  item: typeof SHORTS_DATA[0];
  isActive: boolean;
  itemHeight: number;
  onMuteToggle: () => void;
  isMuted: boolean;
  onViewRecipe: () => void;
  onAddToMealPlan: () => void;
  onShare: () => void;
  onBookmarkPress: () => void;
  isBookmarked: boolean;
  bookmarkCount: number;
}

// 개별 비디오 아이템 컴포넌트 (프로토타입 - 썸네일 기반)
function VideoItem({ item, isActive, itemHeight, onMuteToggle, isMuted, onViewRecipe, onAddToMealPlan, onShare, onBookmarkPress, isBookmarked, bookmarkCount }: VideoItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatCount = (count: number) => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + "만";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 활성화되면 재생 중인 것처럼 표시
  useEffect(() => {
    setIsPlaying(isActive);
  }, [isActive]);

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: itemHeight,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* 썸네일 이미지 - 화면 꽉 채우기 */}
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
        transition={300}
      />

      {/* 재생 중 표시 (프로토타입) */}
      {isPlaying && (
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            backgroundColor: "rgba(255,0,0,0.8)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#FFF",
            }}
          />
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
            LIVE
          </Text>
        </View>
      )}

      {/* 좌측 하단 - 콘텐츠 정보 */}
      <View
        style={{
          position: "absolute",
          bottom: 24,
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
              {item.authorAvatar}
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
          {item.tags.map((tag, index) => (
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
          bottom: 24,
          right: 12,
          alignItems: "center",
          gap: 20,
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
            식단추가
          </Text>
        </TouchableOpacity>

        {/* 공유 */}
        <TouchableOpacity onPress={onShare} activeOpacity={0.8} style={{ alignItems: "center" }}>
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
            <Share2 size={26} color="#FFF" />
          </View>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "500", marginTop: 4 }}>
            공유
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShortsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ startIndex?: string }>();
  const flatListRef = useRef<FlatList>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // 북마크 관련 상태
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [bookmarkTab, setBookmarkTab] = useState<"personal" | "group">("personal");
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Record<string, { bookId: string; count: number }>>({});
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SHORTS_DATA.forEach(item => { initial[item.id] = item.bookmarks; });
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

  const handleShare = useCallback(async (title: string) => {
    try {
      await Share.share({
        message: `숏끼에서 "${title}" 레시피를 확인해보세요!`,
      });
    } catch (e) {
      console.log(e);
    }
  }, []);

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

  // 북마크 버튼 클릭 시 Bottom Sheet 표시
  const handleBookmarkPress = useCallback((videoId: string) => {
    setSelectedVideoId(videoId);
    setShowBookmarkSheet(true);
  }, []);

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

    setShowBookmarkSheet(false);
  }, [selectedVideoId, bookmarkedVideos]);

  const renderItem = useCallback(
    ({ item, index }: { item: typeof SHORTS_DATA[0]; index: number }) => (
      <VideoItem
        item={item}
        isActive={index === activeIndex}
        itemHeight={ITEM_HEIGHT}
        onMuteToggle={toggleMute}
        isMuted={isMuted}
        onViewRecipe={() => handleViewRecipe(item.id)}
        onAddToMealPlan={() => handleAddToMealPlan(item.title)}
        onShare={() => handleShare(item.title)}
        onBookmarkPress={() => handleBookmarkPress(item.id)}
        isBookmarked={!!bookmarkedVideos[item.id]}
        bookmarkCount={bookmarkCounts[item.id] || item.bookmarks}
      />
    ),
    [activeIndex, isMuted, toggleMute, handleViewRecipe, handleAddToMealPlan, handleShare, handleBookmarkPress, bookmarkedVideos, bookmarkCounts]
  );

  const keyExtractor = useCallback((item: typeof SHORTS_DATA[0]) => item.id, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
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
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 8,
          }}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700" }}>
          쇼츠
        </Text>

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
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
      />

      {/* 북마크 폴더 선택 Bottom Sheet */}
      <Modal
        visible={showBookmarkSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookmarkSheet(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          onPress={() => setShowBookmarkSheet(false)}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.neutral[0],
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 20,
            maxHeight: SCREEN_HEIGHT * 0.6,
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
            <TouchableOpacity onPress={() => setShowBookmarkSheet(false)}>
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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
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
                setShowBookmarkSheet(false);
                router.push("/(tabs)/recipe-book");
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
        </View>
      </Modal>
    </View>
  );
}
