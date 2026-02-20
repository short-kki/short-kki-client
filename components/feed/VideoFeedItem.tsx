import React, { memo, useCallback, useRef, useState, useEffect } from "react";
import { Dimensions, Text, View, TouchableOpacity, Pressable } from "react-native";
import { YoutubeView as YoutubePlayer } from "react-native-youtube-bridge";
import { useRouter } from "expo-router";
import { extractYoutubeId } from "@/utils/youtube";
import {
  Bookmark,
  Share2,
  Menu,
  MoreVertical,
  VolumeX,
  Volume2,
  ChefHat,
  ListPlus,
  ScrollText,
} from "lucide-react-native";
import { Colors } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoData {
  id: number;
  url: string;
  title: string;
  author: string;
  tags: string[];
}

interface VideoFeedItemProps {
  item: VideoData;
  isActive: boolean;
  itemHeight: number;
}

function VideoFeedItem({ item, isActive, itemHeight }: VideoFeedItemProps) {
  const router = useRouter();
  const videoId = extractYoutubeId(item.url);
  console.log("VideoFeedItem rendering, videoId:", videoId, "url:", item.url);
  const playerRef = useRef<YoutubeIframeRef>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(1523);

  // YouTube 플레이어 크기 계산
  const PLAYER_HEIGHT = itemHeight;
  const PLAYER_WIDTH = PLAYER_HEIGHT * (16 / 9);

  // isActive가 변경되면 재생 상태 변경
  useEffect(() => {
    setPlaying(isActive);
    // 비활성화되면 음소거로 리셋
    if (!isActive) {
      setIsMuted(true);
    }
  }, [isActive]);

  // 음소거 토글 버튼
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // 북마크 토글
  const toggleBookmark = useCallback(() => {
    setIsBookmarked((prev) => !prev);
    setBookmarkCount((prev) => (isBookmarked ? prev - 1 : prev + 1));
  }, [isBookmarked]);

  // 레시피 상세 페이지로 이동
  const handleViewRecipe = useCallback(() => {
    router.push(`/recipe/${item.id}`);
  }, [router, item.id]);

  // 비디오 상태 변경 핸들러
  const handleStateChange = useCallback(
    (state: string) => {
      console.log(`[Video] State: ${state}, videoId: ${videoId}`);
      if (state === "ended") {
        playerRef.current?.seekTo(0, true);
      }
    },
    [videoId]
  );

  // 숫자 축약 포맷 (1000 → 1k, 1200 → 1.2k, 1000000 → 1M)
  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) {
      const k = count / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
    }
    const m = count / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  };

  if (!videoId) {
    return (
      <View
        className="flex-1 justify-center items-center bg-black"
        style={{ width: SCREEN_WIDTH, height: itemHeight }}
      >
        <Text className="text-white">Invalid Video URL</Text>
      </View>
    );
  }

  return (
    <View
      style={{ width: SCREEN_WIDTH, height: itemHeight }}
      className="relative bg-black overflow-hidden"
    >
      {/* YouTube Player */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
          }}
        >
          <YoutubePlayer
            ref={playerRef}
            height={PLAYER_HEIGHT}
            width={PLAYER_WIDTH}
            videoId={videoId}
            play={playing}
            mute={isMuted}
            forceAndroidAutoplay={true}
            initialPlayerParams={{
              controls: true,
              modestbranding: true,
              rel: false,
              loop: false,
              fs: false,
              iv_load_policy: 3,
              playsinline: true,
            }}
            webViewStyle={{
              opacity: 0.99,
            }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
              javaScriptEnabled: true,
              domStorageEnabled: true,
              allowsFullscreenVideo: false,
            }}
            onChangeState={handleStateChange}
          />
        </View>
      </View>

      {/* Top Left - Menu Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 56,
          left: 16,
          zIndex: 30,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 8,
          padding: 10,
        }}
        activeOpacity={0.7}
      >
        <Menu size={22} color="white" />
      </TouchableOpacity>

      {/* Top Right - More Options & Mute */}
      <View
        style={{
          position: "absolute",
          top: 56,
          right: 16,
          zIndex: 30,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={toggleMute}
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 10,
          }}
          activeOpacity={0.7}
        >
          {isMuted ? (
            <VolumeX size={22} color="white" />
          ) : (
            <Volume2 size={22} color="white" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 20,
            padding: 10,
          }}
          activeOpacity={0.7}
        >
          <MoreVertical size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Bottom Left - Content Info */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 20,
          maxWidth: "65%",
        }}
        pointerEvents="none"
      >
        {/* Author */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.neutral[600],
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
              {item.author.substring(0, 1)}
            </Text>
          </View>
          <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
            {item.author}
          </Text>
        </View>

        {/* Title */}
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            lineHeight: 22,
            marginBottom: 8,
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {item.tags.map((tag, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Right Side - Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 24,
          right: 12,
          zIndex: 20,
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* View Recipe Button */}
        <Pressable onPress={handleViewRecipe} style={{ alignItems: "center" }}>
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
            <ScrollText size={26} color="white" />
          </View>
          <Text
            style={{
              color: "white",
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
        </Pressable>

        {/* Bookmark Button */}
        <Pressable
          onPress={toggleBookmark}
          style={{ alignItems: "center" }}
        >
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
              color={isBookmarked ? Colors.primary[500] : "white"}
              fill={isBookmarked ? Colors.primary[500] : "transparent"}
            />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            {formatCount(bookmarkCount)}
          </Text>
        </Pressable>

        {/* Add to Recipe Book Button */}
        <Pressable style={{ alignItems: "center" }}>
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
            <ChefHat size={26} color="white" />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 11,
              fontWeight: "500",
              marginTop: 4,
            }}
          >
            레시피북
          </Text>
        </Pressable>

        {/* Add to Meal Plan Button */}
        <Pressable style={{ alignItems: "center" }}>
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
            <ListPlus size={26} color="white" />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 11,
              fontWeight: "500",
              marginTop: 4,
            }}
          >
            대기열
          </Text>
        </Pressable>

        {/* Share Button */}
        <Pressable style={{ alignItems: "center" }}>
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
            <Share2 size={26} color="white" />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 11,
              fontWeight: "500",
              marginTop: 4,
            }}
          >
            공유
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(VideoFeedItem);
