import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from "react-native";
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
  Share2,
  MoreVertical,
  Flag,
  X,
  CheckCircle,
  Calendar,
  AlertCircle,
  BookOpen,
  Square,
  CheckSquare,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import RecipeBookSelectModal from "@/components/RecipeBookSelectModal";
import { recipeApi, type RecipeResponse } from "@/services/recipeApi";
import { API_BASE_URL } from "@/constants/oauth";
import { api } from "@/services/api";
import { useRecipeQueue, useGroups } from "@/hooks";
import { YoutubeView, useYouTubePlayer, useYouTubeEvent, PlayerState } from "react-native-youtube-bridge";
import { extractYoutubeId } from "@/utils/youtube";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 기본 레시피 값 (로딩 전 또는 에러 시)
const DEFAULT_RECIPE: RecipeResponse = {
  id: 0,
  title: "",
  description: "",
  mainImgUrl: "",
  cookingTime: 0,
  servingSize: 0,
  difficulty: "BEGINNER",
  cuisineType: "KOREAN",
  mealType: "MAIN",
  authorName: "",
  bookmarkCount: 0,
  ingredients: [],
  steps: [],
  tags: [],
  createdAt: "",
  updatedAt: "",
};

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const idStr = params.id;
  const id = idStr ? parseInt(idStr, 10) : 0;

  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [showBookSelectModal, setShowBookSelectModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false); // 로컬 북마크 상태
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showQueueSuccessModal, setShowQueueSuccessModal] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [showAlreadySavedModal, setShowAlreadySavedModal] = useState(false);
  const [savedBookName, setSavedBookName] = useState("");
  const [showGroupSelectModal, setShowGroupSelectModal] = useState(false);
  const [showIngredientSelectModal, setShowIngredientSelectModal] = useState(false);
  const [showShoppingSuccessModal, setShowShoppingSuccessModal] = useState(false);
  const [showNoGroupModal, setShowNoGroupModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const { addQueue } = useRecipeQueue();
  const { groups, loading: groupsLoading } = useGroups();

  // 비디오 관련 상태
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // YouTube Video ID 추출
  const videoId = recipe?.sourceUrl ? extractYoutubeId(recipe.sourceUrl) : null;

  // YouTube Player 설정
  const VIDEO_HEIGHT = SCREEN_WIDTH * 0.75;
  const playerWidth = VIDEO_HEIGHT * (9 / 16); // 세로 영상이므로 9:16
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
    setIsVideoReady(true);
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

  // 데이터 로딩
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        setError("잘못된 접근입니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await recipeApi.getById(id);
        console.log("Recipe API Response:", JSON.stringify(data, null, 2));
        setRecipe(data);
        setServings(data.servingSize);
        // TODO: 북마크 여부는 API 응답에 포함되어야 함. 현재는 임의로 false 처리하거나 별도 조회 필요
        // 현재 API 명세에는 isBookmarked가 없음. 
        setIsBookmarked(false);
      } catch (err: any) {
        console.error("Failed to fetch recipe:", err);
        setError(err.message || "레시피를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  const toggleBookmark = () => {
    // API 연결 필요 (북마크 추가/취소)
    // 현재는 UI 상태만 변경
    setIsBookmarked(!isBookmarked);
    if (recipe) {
      // 실제로는 서버 상태를 다시 불러오거나 해야 함
      // 여기서는 간단히 로컬 카운트만 조절하는 흉내 (실제 반영은 안됨)
    }
  };

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

  const handleAddToRecipeBook = () => {
    setShowBookSelectModal(true);
  };

  const handleAddToQueue = async () => {
    if (!recipe) return;
    try {
      await addQueue(recipe.id);
      setShowQueueSuccessModal(true);
    } catch (err) {
      Alert.alert("오류", "대기열에 추가하는데 실패했습니다.");
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

      setShowShoppingSuccessModal(true);
    } catch (error) {
      console.error("장보기 목록 추가 실패:", error);
      Alert.alert("오류", "장보기 목록에 추가하는데 실패했습니다.");
    } finally {
      setIsAddingToShoppingList(false);
    }
  };

  const handleMoreOptions = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleReport = () => {
    setShowMoreMenu(false);
    Alert.alert("신고", "신고가 접수되었습니다.");
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[50] }}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[50] }}>
        <Text style={{ color: Colors.neutral[500] }}>
          {error || "레시피 정보를 찾을 수 없습니다."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20, padding: 10 }}
        >
          <Text style={{ color: Colors.primary[500] }}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle="dark-content" />

      {/* 메뉴 오버레이 (바깥 클릭시 닫기) */}
      {showMoreMenu && (
        <Pressable
          onPress={() => setShowMoreMenu(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
        />
      )}

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          zIndex: 100,
        }}
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
              backgroundColor: Colors.neutral[100],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} color={Colors.neutral[700]} />
          </Pressable>
          <View style={{ position: "relative" }}>
            <TouchableOpacity
              onPress={handleMoreOptions}
              activeOpacity={0.8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MoreVertical size={24} color={Colors.neutral[700]} />
            </TouchableOpacity>

            {/* 드롭다운 메뉴 */}
            {showMoreMenu && (
              <View
                style={{
                  position: "absolute",
                  top: 44,
                  right: 0,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                  minWidth: 140,
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                <TouchableOpacity
                  onPress={handleReport}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    gap: 10,
                  }}
                >
                  <Flag size={18} color={Colors.error.main} />
                  <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.error.main }}>
                    신고하기
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Recipe Video or Image */}
        <View style={{ width: SCREEN_WIDTH, height: VIDEO_HEIGHT, backgroundColor: Colors.neutral[900] }}>
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
                  width={playerWidth}
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

              {/* 재생/일시정지 오버레이 */}
              {!isVideoPlaying && (
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
                  {/* 썸네일 배경 */}
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
                  {/* 어두운 오버레이 */}
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
                  {/* 재생 버튼 */}
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
                </Pressable>
              )}

              {/* 음소거 토글 버튼 */}
              {isVideoPlaying && (
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

              {/* 일시정지 버튼 (재생 중일 때) */}
              {isVideoPlaying && (
                <TouchableOpacity
                  onPress={togglePlayPause}
                  activeOpacity={0.8}
                  style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                  }}
                >
                  <View style={{ width: 14, height: 14, flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ width: 4, height: 14, backgroundColor: "#FFFFFF", borderRadius: 1 }} />
                    <View style={{ width: 4, height: 14, backgroundColor: "#FFFFFF", borderRadius: 1 }} />
                  </View>
                </TouchableOpacity>
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
        </View>

        {/* Content Section */}
        <View style={{ padding: Spacing.xl }}>
          {/* Title & Bookmark */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text
                style={{
                  fontSize: Typography.fontSize["2xl"],
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                  lineHeight: 32,
                }}
              >
                {recipe.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.sm, gap: 8 }}>
                <View
                  style={{
                    backgroundColor: Colors.primary[100],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: Colors.primary[600], fontSize: 12, fontWeight: "600" }}>
                    {recipe.difficulty}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[100],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    gap: 4,
                  }}
                >
                  <Clock size={12} color={Colors.neutral[500]} />
                  <Text style={{ color: Colors.neutral[600], fontSize: 12, fontWeight: "600" }}>
                    {recipe.cookingTime}분
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={toggleBookmark} style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isBookmarked ? Colors.primary[50] : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Bookmark
                  size={24}
                  color={isBookmarked ? Colors.primary[500] : Colors.neutral[400]}
                  fill={isBookmarked ? Colors.primary[500] : "transparent"}
                />
              </View>
              <Text style={{ fontSize: 11, color: Colors.neutral[500], marginTop: 4 }}>
                {formatCount(recipe.bookmarkCount + (isBookmarked ? 1 : 0))}
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
                marginTop: Spacing.md,
              }}
            >
              {recipe.description}
            </Text>
          )}

          {/* Tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: Spacing.lg }}>
            {recipe.tags && recipe.tags.map((tag, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: Colors.neutral[100],
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: BorderRadius.full,
                }}
              >
                <Text style={{ fontSize: 13, color: Colors.neutral[600] }}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Ingredients Section */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
                재료
              </Text>
              {/* Servings Adjuster */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Pressable
                  onPress={() => adjustServings(-1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>−</Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.sm }}>
                  <Users size={16} color={Colors.neutral[500]} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[700], marginLeft: 4 }}>
                    {servings}인분
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustServings(1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Ingredients List */}
            <View style={{ marginTop: Spacing.md }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.neutral[100],
                  }}
                >
                  <Text style={{ fontSize: 15, color: Colors.neutral[800] }}>
                    {ingredient.name}
                  </Text>
                  <Text style={{ fontSize: 15, color: Colors.neutral[500], fontWeight: "500" }}>
                    {getAdjustedAmount(ingredient.amount, ingredient.unit)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Steps Section */}
          <View>
            <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
              조리순서
            </Text>
            <View style={{ marginTop: Spacing.md }}>
              {recipe.steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginBottom: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.primary[500],
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing.md,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                      {step.stepOrder || index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: Colors.neutral[700],
                      lineHeight: 24,
                    }}
                  >
                    {step.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
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
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
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
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
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
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
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
            장보기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레시피북 선택 모달 */}
      <RecipeBookSelectModal
        visible={showBookSelectModal}
        onClose={() => setShowBookSelectModal(false)}
        onSelect={async (bookId, bookName, groupId, groupName) => {
          try {
            // 레시피북에 레시피 추가
            await api.post(`/api/v1/recipebooks/${bookId}/recipes`, { recipeId: recipe.id });

            // 그룹 레시피북인 경우 피드 생성
            if (groupId) {
              try {
                await api.post(`/api/v1/groups/${groupId}/feeds`, {
                  content: `"${recipe.title}" 레시피가 "${bookName}" 레시피북에 추가되었습니다.`,
                  feedType: "NEW_RECIPE_ADDED",
                });
                console.log("[Feed] 레시피 추가 피드 생성 완료");
              } catch (feedError) {
                console.error("[Feed] 피드 생성 실패:", feedError);
                // 피드 생성 실패해도 레시피 저장은 성공으로 처리
              }
            }

            setSavedBookName(bookName);
            setShowSaveSuccessModal(true);
            setIsBookmarked(true);
          } catch (error: any) {
            if (error.message && error.message.includes("이미 레시피북에 추가된")) {
              setShowAlreadySavedModal(true);
            } else {
              Alert.alert("오류", "레시피 저장에 실패했습니다.");
            }
          }
        }}
        title="저장 위치"
      />

      {/* 대기열 추가 성공 모달 */}
      <Modal visible={showQueueSuccessModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowQueueSuccessModal(false)}
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
            {/* 성공 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.success.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <CheckCircle size={40} color={Colors.success.main} />
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
              대기열에 추가되었어요!
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
              "{recipe.title}" 레시피가{"\n"}식단표 대기열에 추가되었습니다.
            </Text>

            {/* 버튼들 */}
            <View style={{ flexDirection: "row", gap: Spacing.sm, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setShowQueueSuccessModal(false)}
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
                  확인
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowQueueSuccessModal(false);
                  router.push("/(tabs)/meal-plan");
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  backgroundColor: Colors.primary[500],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Calendar size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  식단표로 이동
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 레시피북 저장 성공 모달 */}
      <Modal visible={showSaveSuccessModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowSaveSuccessModal(false)}
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
            {/* 성공 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.primary[50],
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <BookOpen size={40} color={Colors.primary[500]} />
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
              레시피북에 저장되었어요!
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
              "{savedBookName}"에{"\n"}레시피가 저장되었습니다.
            </Text>

            {/* 버튼 */}
            <TouchableOpacity
              onPress={() => setShowSaveSuccessModal(false)}
              activeOpacity={0.8}
              style={{
                width: "100%",
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
                확인
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 이미 저장됨 모달 */}
      <Modal visible={showAlreadySavedModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowAlreadySavedModal(false)}
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
            {/* 알림 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.warning.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <AlertCircle size={40} color={Colors.warning.main} />
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
              이미 저장된 레시피예요
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
              이 레시피는 이미 해당{"\n"}레시피북에 저장되어 있습니다.
            </Text>

            {/* 버튼 */}
            <TouchableOpacity
              onPress={() => setShowAlreadySavedModal(false)}
              activeOpacity={0.8}
              style={{
                width: "100%",
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
                확인
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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

      {/* 장보기 추가 성공 모달 */}
      <Modal visible={showShoppingSuccessModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowShoppingSuccessModal(false)}
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
            {/* 성공 아이콘 */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.success.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <ShoppingCart size={40} color={Colors.success.main} />
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
              장보기 목록에 추가됐어요!
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
              {selectedIngredients.length}개의 재료가{"\n"}"{selectedGroupName}" 장보기 목록에 추가되었습니다.
            </Text>

            {/* 버튼 */}
            <TouchableOpacity
              onPress={() => setShowShoppingSuccessModal(false)}
              activeOpacity={0.8}
              style={{
                width: "100%",
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
                확인
              </Text>
            </TouchableOpacity>
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
