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
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Bookmark,
  Share2,
  ChefHat,
  CalendarPlus,
  VolumeX,
  Volume2,
  ArrowLeft,
  MoreVertical,
  Play,
  ScrollText,
} from "lucide-react-native";
import { Colors } from "@/constants/design-system";
import { extractYoutubeId } from "@/utils/youtube";

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
  onAddToRecipeBook: () => void;
  onAddToMealPlan: () => void;
  onShare: () => void;
}

// 개별 비디오 아이템 컴포넌트 (프로토타입 - 썸네일 기반)
function VideoItem({ item, isActive, itemHeight, onMuteToggle, isMuted, onViewRecipe, onAddToRecipeBook, onAddToMealPlan, onShare }: VideoItemProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(item.bookmarks);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleBookmark = useCallback(() => {
    setIsBookmarked((prev) => !prev);
    setBookmarkCount((prev) => (isBookmarked ? prev - 1 : prev + 1));
  }, [isBookmarked]);

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
        <Pressable onPress={toggleBookmark} style={{ alignItems: "center" }}>
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
            <Bookmark
              size={26}
              color={isBookmarked ? Colors.primary[500] : "#FFF"}
              fill={isBookmarked ? Colors.primary[500] : "transparent"}
            />
          </View>
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600", marginTop: 4 }}>
            {formatCount(bookmarkCount)}
          </Text>
        </Pressable>

        {/* 레시피북 추가 */}
        <TouchableOpacity onPress={onAddToRecipeBook} activeOpacity={0.8} style={{ alignItems: "center" }}>
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
            <ChefHat size={26} color="#FFF" />
          </View>
          <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "500", marginTop: 4 }}>
            레시피북
          </Text>
        </TouchableOpacity>

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

  const handleAddToRecipeBook = useCallback((title: string) => {
    Alert.alert(
      "레시피북에 저장",
      `"${title}" 레시피가 레시피북에 추가되었습니다.`,
      [
        { text: "확인", onPress: () => router.push("/(tabs)/recipe-book") },
      ]
    );
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

  const renderItem = useCallback(
    ({ item, index }: { item: typeof SHORTS_DATA[0]; index: number }) => (
      <VideoItem
        item={item}
        isActive={index === activeIndex}
        itemHeight={ITEM_HEIGHT}
        onMuteToggle={toggleMute}
        isMuted={isMuted}
        onViewRecipe={() => handleViewRecipe(item.id)}
        onAddToRecipeBook={() => handleAddToRecipeBook(item.title)}
        onAddToMealPlan={() => handleAddToMealPlan(item.title)}
        onShare={() => handleShare(item.title)}
      />
    ),
    [activeIndex, isMuted, toggleMute, handleViewRecipe, handleAddToRecipeBook, handleAddToMealPlan, handleShare]
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
    </View>
  );
}
