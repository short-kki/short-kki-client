import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  X,
  ImagePlus,
  Camera,
  Trash2,
  Send,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { api, USE_MOCK } from "@/services/api";

// 더미 이미지 URL (프로토타입용)
const DUMMY_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400",
];

export default function GroupFeedCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 프로토타입: 더미 이미지 추가 (실제로는 expo-image-picker 사용)
  const handlePickImage = () => {
    if (images.length >= 5) {
      Alert.alert("알림", "최대 5장까지 추가할 수 있습니다.");
      return;
    }

    // 사용하지 않은 더미 이미지 중 하나를 추가
    const availableImages = DUMMY_IMAGES.filter((img) => !images.includes(img));
    if (availableImages.length > 0) {
      const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
      setImages((prev) => [...prev, randomImage]);
    } else {
      Alert.alert("알림", "더 이상 추가할 수 있는 이미지가 없습니다.");
    }
  };

  const handleTakePhoto = () => {
    if (images.length >= 5) {
      Alert.alert("알림", "최대 5장까지 추가할 수 있습니다.");
      return;
    }

    // 프로토타입: 더미 이미지 추가
    const availableImages = DUMMY_IMAGES.filter((img) => !images.includes(img));
    if (availableImages.length > 0) {
      const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
      setImages((prev) => [...prev, randomImage]);
      Alert.alert("프로토타입", "카메라 기능은 실제 빌드에서 사용 가능합니다.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert("알림", "내용을 입력하거나 사진을 추가해주세요.");
      return;
    }

    if (!params.groupId) {
      Alert.alert("오류", "그룹 정보가 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (USE_MOCK) {
        // Mock 모드: 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        // 실제 API 호출: POST /api/v1/groups/{groupId}/feeds
        await api.post(`/api/v1/groups/${params.groupId}/feeds`, {
          content: content.trim(),
          feedType: 'USER_CREATED',
        });
      }

      Alert.alert("완료", "피드가 등록되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("피드 생성 실패:", error);
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "피드 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = content.trim() || images.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[0] }}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: insets.top + Spacing.sm,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral[100],
          }}
        >
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <X size={24} color={Colors.neutral[700]} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.bold,
              color: Colors.neutral[900],
            }}
          >
            피드 작성
          </Text>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.7}
            style={{
              backgroundColor: canSubmit ? Colors.primary[500] : Colors.neutral[200],
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.lg,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: canSubmit ? "#FFFFFF" : Colors.neutral[400],
              }}
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 그룹 정보 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: Spacing.lg,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.primary[100],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: Colors.primary[600],
                }}
              >
                {params.groupName?.substring(0, 1) || "그"}
              </Text>
            </View>
            <View style={{ marginLeft: Spacing.md }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: "600",
                  color: Colors.neutral[900],
                }}
              >
                {params.groupName || "그룹"}
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                }}
              >
                그룹에 피드를 공유합니다
              </Text>
            </View>
          </View>

          {/* 내용 입력 */}
          <TextInput
            style={{
              fontSize: 16,
              color: Colors.neutral[900],
              lineHeight: 24,
              minHeight: 120,
              textAlignVertical: "top",
            }}
            placeholder="오늘 어떤 요리를 했나요? 그룹원들과 공유해보세요!"
            placeholderTextColor={Colors.neutral[400]}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
          />

          {/* 글자 수 */}
          <Text
            style={{
              fontSize: 12,
              color: Colors.neutral[400],
              textAlign: "right",
              marginTop: Spacing.sm,
            }}
          >
            {content.length}/500
          </Text>

          {/* 이미지 미리보기 */}
          {images.length > 0 && (
            <View style={{ marginTop: Spacing.lg }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.neutral[700],
                  marginBottom: Spacing.md,
                }}
              >
                첨부된 사진 ({images.length}/5)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.md }}
              >
                {images.map((uri, index) => (
                  <View key={index} style={{ position: "relative" }}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: BorderRadius.lg,
                      }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      activeOpacity={0.8}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 하단 툴바 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.md,
            paddingBottom: insets.bottom + Spacing.md,
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
            backgroundColor: Colors.neutral[0],
            gap: Spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={images.length >= 5}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              backgroundColor: images.length >= 5 ? Colors.neutral[100] : Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
            }}
          >
            <ImagePlus
              size={20}
              color={images.length >= 5 ? Colors.neutral[400] : Colors.neutral[700]}
            />
            <Text
              style={{
                fontSize: 14,
                color: images.length >= 5 ? Colors.neutral[400] : Colors.neutral[700],
                marginLeft: Spacing.sm,
              }}
            >
              갤러리
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTakePhoto}
            disabled={images.length >= 5}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              backgroundColor: images.length >= 5 ? Colors.neutral[100] : Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
            }}
          >
            <Camera
              size={20}
              color={images.length >= 5 ? Colors.neutral[400] : Colors.neutral[700]}
            />
            <Text
              style={{
                fontSize: 14,
                color: images.length >= 5 ? Colors.neutral[400] : Colors.neutral[700],
                marginLeft: Spacing.sm,
              }}
            >
              카메라
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {images.length > 0 && (
            <Text style={{ fontSize: 12, color: Colors.neutral[500] }}>
              {images.length}/5장
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
