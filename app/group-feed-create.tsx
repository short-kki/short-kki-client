import React, { useState, useEffect } from "react";
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
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  X,
  ImagePlus,
  Camera,
  Trash2,
  Send,
  CheckCircle,
  Sparkles,
  Loader2,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { api, USE_MOCK } from "@/services/api";
import { uploadImage, type ImagePickerAsset, type UploadedFile } from "@/services/fileUpload";

// 선택된 이미지 타입
interface SelectedImage {
  uri: string;
  asset: ImagePickerAsset;
}

export default function GroupFeedCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  // 성공 모달 애니메이션
  useEffect(() => {
    if (showSuccessModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [showSuccessModal]);

  // 갤러리에서 이미지 선택 (1개만 지원)
  const handlePickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const newImage: SelectedImage = {
        uri: asset.uri,
        asset: {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        },
      };
      setImages([newImage]); // 1개만 저장
    }
  };

  // 카메라로 사진 촬영 (1개만 지원)
  const handleTakePhoto = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const newImage: SelectedImage = {
        uri: asset.uri,
        asset: {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
        },
      };
      setImages([newImage]); // 1개만 저장
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
    setUploadProgress("");

    try {
      let imageFileId: number | null = null;

      // 이미지가 있으면 먼저 업로드 (1개만 지원)
      if (images.length > 0) {
        setUploadProgress("이미지 업로드 중...");

        const uploadedFile = await uploadImage(
          images[0].asset,
          "FEED_IMG",
          "PUBLIC"
        );
        imageFileId = uploadedFile.fileId;

        console.log("[Feed Create] 이미지 업로드 완료:", {
          fileId: uploadedFile.fileId,
          objectKey: uploadedFile.objectKey,
          url: uploadedFile.url,
        });

        setUploadProgress("피드 등록 중...");
      }

      const feedRequest = {
        content: content.trim(),
        feedType: "USER_CREATED",
        ...(imageFileId && { imageFileId }),
      };

      console.log("[Feed Create] 피드 생성 요청:", feedRequest);

      if (USE_MOCK) {
        // Mock 모드: 시뮬레이션
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        // 실제 API 호출: POST /api/v1/groups/{groupId}/feeds
        const response = await api.post(`/api/v1/groups/${params.groupId}/feeds`, feedRequest);
        console.log("[Feed Create] 피드 생성 응답:", response);
      }

      router.back();
    } catch (error) {
      console.error("피드 생성 실패:", error);
      Alert.alert(
        "오류",
        error instanceof Error ? error.message : "피드 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
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
              backgroundColor: canSubmit && !isSubmitting ? Colors.primary[500] : Colors.neutral[200],
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.lg,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isSubmitting && (
              <ActivityIndicator size="small" color={Colors.neutral[400]} />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: canSubmit && !isSubmitting ? "#FFFFFF" : Colors.neutral[400],
              }}
            >
              {isSubmitting ? "등록 중" : "등록"}
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
                첨부된 사진
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.md }}
              >
                {images.map((img, index) => (
                  <View key={index} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: img.uri }}
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
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              backgroundColor: Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
            }}
          >
            <ImagePlus size={20} color={Colors.neutral[700]} />
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[700],
                marginLeft: Spacing.sm,
              }}
            >
              갤러리
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTakePhoto}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              backgroundColor: Colors.neutral[50],
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
            }}
          >
            <Camera size={20} color={Colors.neutral[700]} />
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[700],
                marginLeft: Spacing.sm,
              }}
            >
              카메라
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {images.length > 0 && (
            <Text style={{ fontSize: 12, color: Colors.primary[500] }}>
              사진 1장 첨부됨
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* 업로드 진행 오버레이 */}
      {isSubmitting && uploadProgress && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.9)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius.xl,
              padding: Spacing["2xl"],
              alignItems: "center",
              ...Shadows.lg,
            }}
          >
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text
              style={{
                marginTop: Spacing.lg,
                fontSize: Typography.fontSize.base,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
              }}
            >
              {uploadProgress}
            </Text>
            <Text
              style={{
                marginTop: Spacing.sm,
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[500],
              }}
            >
              잠시만 기다려주세요
            </Text>
          </View>
        </View>
      )}

      {/* 성공 모달 */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            opacity: fadeAnim,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: BorderRadius["2xl"],
              padding: Spacing["2xl"],
              marginHorizontal: Spacing["2xl"],
              alignItems: "center",
              width: "85%",
              maxWidth: 320,
              transform: [{ scale: scaleAnim }],
              ...Shadows.xl,
            }}
          >
            {/* 성공 아이콘 */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.success.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: Spacing.xl,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: Colors.success.main,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CheckCircle size={36} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            {/* 스파클 장식 */}
            <View style={{ position: "absolute", top: 20, right: 40 }}>
              <Sparkles size={20} color={Colors.secondary[500]} />
            </View>
            <View style={{ position: "absolute", top: 50, left: 30 }}>
              <Sparkles size={16} color={Colors.primary[400]} />
            </View>

            {/* 텍스트 */}
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
                marginBottom: Spacing.sm,
                textAlign: "center",
              }}
            >
              피드 등록 완료!
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
              그룹원들에게 피드가 공유되었어요.{"\n"}맛있는 소식을 나눠주셔서 감사해요!
            </Text>

            {/* 확인 버튼 */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary[500],
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing["3xl"],
                borderRadius: BorderRadius.xl,
                width: "100%",
                ...Shadows.primary,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.md,
                  fontWeight: Typography.fontWeight.semiBold,
                  color: "#FFFFFF",
                  textAlign: "center",
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}
