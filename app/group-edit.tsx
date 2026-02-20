import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Users,
  Lock,
  Globe,
  Bell,
  Trash2,
  ChevronRight,
  Check,
  ImagePlus,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  Save,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useGroupDetail, useGroups } from "@/hooks";
import { uploadImage, type ImagePickerAsset } from "@/services/fileUpload";

// 그룹 타입 옵션
const GROUP_TYPES = [
  { value: 'COUPLE' as const, label: '커플' },
  { value: 'FAMILY' as const, label: '가족' },
  { value: 'FRIENDS' as const, label: '친구' },
  { value: 'ETC' as const, label: '기타' },
];

export default function GroupEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();

  const groupId = params.groupId;
  const isCreateMode = !groupId;
  const { group, loading, updateGroup } = useGroupDetail(groupId || "");
  const { deleteGroup, createGroup } = useGroups();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState<'COUPLE' | 'FAMILY' | 'FRIENDS' | 'ETC'>('FAMILY');
  const [thumbnailImgUrl, setThumbnailImgUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
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
  }, [showSuccessModal, fadeAnim, scaleAnim]);

  // 그룹 데이터 로드 시 상태 초기화 (수정 모드에서만)
  useEffect(() => {
    if (!isCreateMode && group) {
      setName(group.name);
      setDescription(group.description || "");
      setGroupType(group.groupType);
      setThumbnailImgUrl(group.thumbnailImgUrl);
    }
  }, [group, isCreateMode]);

  const handleNameChange = (text: string) => {
    setName(text);
    setHasChanges(true);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    setHasChanges(true);
  };

  const handleGroupTypeChange = (type: 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'ETC') => {
    setGroupType(type);
    setHasChanges(true);
  };

  const handlePrivateChange = (value: boolean) => {
    setIsPrivate(value);
    setHasChanges(true);
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotificationsEnabled(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("알림", "그룹 이름을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);

      let finalThumbnailUrl = thumbnailImgUrl;

      // 새 이미지가 선택되었으면 업로드
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          const uploadedFile = await uploadImage(selectedImage, "FEED_IMG", "PUBLIC");
          finalThumbnailUrl = uploadedFile.url;
          console.log("[Group Edit] 썸네일 업로드 완료:", uploadedFile.url);
        } catch (uploadError) {
          console.error("이미지 업로드 실패:", uploadError);
          Alert.alert("오류", "이미지 업로드에 실패했습니다.");
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        }
        setIsUploadingImage(false);
      }

      const groupData = {
        name: name.trim(),
        description: description.trim() || undefined,
        thumbnailImgUrl: finalThumbnailUrl || undefined,
        groupType,
      };

      if (isCreateMode) {
        // 생성 모드
        console.log("[Group Edit] 그룹 생성 요청 데이터:", JSON.stringify(groupData, null, 2));
        const newGroup = await createGroup(groupData);
        setCreatedGroupId(newGroup.id);
      } else {
        // 수정 모드
        console.log("[Group Edit] 그룹 수정 요청 데이터:", JSON.stringify(groupData, null, 2));
        await updateGroup(groupData);
      }
      setShowSuccessModal(true);
    } catch (error) {
      console.error(isCreateMode ? "그룹 생성 실패:" : "그룹 수정 실패:", error);
      Alert.alert("오류", isCreateMode ? "그룹 생성에 실패했습니다." : "그룹 정보 수정에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "그룹 삭제",
      "정말 이 그룹을 삭제하시겠습니까?\n삭제된 그룹은 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              Alert.alert("삭제 완료", "그룹이 삭제되었습니다.", [
                { text: "확인", onPress: () => router.replace("/(tabs)/group") },
              ]);
            } catch (error) {
              console.error("그룹 삭제 실패:", error);
              Alert.alert("오류", "그룹 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  // 갤러리에서 이미지 선택
  const handlePickFromGallery = async () => {
    setShowPhotoModal(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
      setHasChanges(true);
    }
  };

  // 카메라로 촬영
  const handleTakePhoto = async () => {
    setShowPhotoModal(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
      setHasChanges(true);
    }
  };

  // 사진 삭제
  const handleRemovePhoto = () => {
    setShowPhotoModal(false);
    setSelectedImage(null);
    setThumbnailImgUrl(null);
    setHasChanges(true);
  };

  const handleChangePhoto = () => {
    setShowPhotoModal(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  };

  // 로딩 중일 때 (수정 모드에서만)
  if (!isCreateMode && loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.neutral[50],
          paddingTop: insets.top,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          backgroundColor: Colors.neutral[0],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={handleBack}
            style={{ padding: 8, marginRight: 8 }}
          >
            <ArrowLeft size={24} color={Colors.neutral[900]} />
          </Pressable>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            {isCreateMode ? "그룹 만들기" : "그룹 수정"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isSaving || (!isCreateMode && !hasChanges) || (isCreateMode && !name.trim())}
          style={{
            backgroundColor: (isCreateMode ? name.trim() : hasChanges) && !isSaving ? Colors.primary[500] : Colors.neutral[200],
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: BorderRadius.full,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: (isCreateMode ? name.trim() : hasChanges) ? "#FFF" : Colors.neutral[400],
              }}
            >
              {isCreateMode ? "만들기" : "저장"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 그룹 프로필 사진 */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: Spacing.xl,
            backgroundColor: Colors.neutral[0],
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral[100],
          }}
        >
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            disabled={isUploadingImage}
            style={{ position: "relative" }}
          >
            {selectedImage || thumbnailImgUrl ? (
              // 선택된 이미지 또는 기존 썸네일 표시
              <Image
                source={{ uri: selectedImage?.uri || thumbnailImgUrl || "" }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                }}
                contentFit="cover"
              />
            ) : (
              // 기본 아이콘 표시
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: Colors.primary[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Users size={48} color={Colors.primary[500]} />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.neutral[800],
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: Colors.neutral[0],
              }}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Camera size={16} color="#FFF" />
              )}
            </View>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.primary[500],
              marginTop: Spacing.md,
              fontWeight: "500",
            }}
          >
            {isUploadingImage ? "업로드 중..." : "사진 변경"}
          </Text>
        </View>

        {/* 기본 정보 */}
        <View style={{ marginTop: Spacing.lg }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.neutral[500],
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            기본 정보
          </Text>

          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.neutral[100],
            }}
          >
            {/* 그룹 이름 */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginBottom: Spacing.xs,
                }}
              >
                그룹 이름
              </Text>
              <TextInput
                style={{
                  fontSize: Typography.fontSize.base,
                  color: Colors.neutral[900],
                  padding: 0,
                }}
                value={name}
                onChangeText={handleNameChange}
                placeholder="그룹 이름을 입력하세요"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>

            {/* 그룹 설명 */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginBottom: Spacing.xs,
                }}
              >
                그룹 설명
              </Text>
              <TextInput
                style={{
                  fontSize: Typography.fontSize.base,
                  color: Colors.neutral[900],
                  padding: 0,
                  minHeight: 60,
                }}
                value={description}
                onChangeText={handleDescriptionChange}
                placeholder="그룹에 대한 설명을 입력하세요"
                placeholderTextColor={Colors.neutral[400]}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* 그룹 타입 */}
            <View
              style={{
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginBottom: Spacing.sm,
                }}
              >
                그룹 타입
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {GROUP_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => handleGroupTypeChange(type.value)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: BorderRadius.full,
                      backgroundColor: groupType === type.value ? Colors.primary[500] : Colors.neutral[100],
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {groupType === type.value && (
                      <Check size={14} color="#FFF" />
                    )}
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontWeight: groupType === type.value ? "600" : "400",
                        color: groupType === type.value ? "#FFF" : Colors.neutral[700],
                      }}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 공개 설정 */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.neutral[500],
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            공개 설정
          </Text>

          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.neutral[100],
            }}
          >
            {/* 비공개 그룹 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isPrivate ? Colors.primary[100] : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: Spacing.md,
                }}
              >
                {isPrivate ? (
                  <Lock size={20} color={Colors.primary[600]} />
                ) : (
                  <Globe size={20} color={Colors.neutral[500]} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.neutral[900],
                  }}
                >
                  비공개 그룹
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.neutral[500],
                    marginTop: 2,
                  }}
                >
                  초대된 사람만 참여할 수 있습니다
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={handlePrivateChange}
                trackColor={{ false: Colors.neutral[200], true: Colors.primary[400] }}
                thumbColor={isPrivate ? Colors.primary[500] : Colors.neutral[0]}
              />
            </View>

            {/* 알림 설정 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: notificationsEnabled ? Colors.info.light : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: Spacing.md,
                }}
              >
                <Bell size={20} color={notificationsEnabled ? Colors.info.main : Colors.neutral[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.neutral[900],
                  }}
                >
                  알림
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    color: Colors.neutral[500],
                    marginTop: 2,
                  }}
                >
                  그룹 활동 알림을 받습니다
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsChange}
                trackColor={{ false: Colors.neutral[200], true: Colors.primary[400] }}
                thumbColor={notificationsEnabled ? Colors.primary[500] : Colors.neutral[0]}
              />
            </View>
          </View>
        </View>

        {/* 멤버 관리 바로가기 */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.neutral[500],
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            멤버
          </Text>

          <TouchableOpacity
            onPress={() => router.push({
              pathname: "/group-members",
              params: { groupId, groupName: name },
            })}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[0],
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.neutral[100],
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
                marginRight: Spacing.md,
              }}
            >
              <Users size={20} color={Colors.neutral[700]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: "500",
                  color: Colors.neutral[900],
                }}
              >
                멤버 관리
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginTop: 2,
                }}
              >
                {group?.memberCount || 0}명의 멤버
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>

        {/* 위험 구역 */}
        <View style={{ marginTop: Spacing.xl }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "600",
              color: Colors.error.main,
              paddingHorizontal: Spacing.xl,
              marginBottom: Spacing.sm,
            }}
          >
            위험 구역
          </Text>

          <TouchableOpacity
            onPress={handleDeleteGroup}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.neutral[0],
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.neutral[100],
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.error.light,
                justifyContent: "center",
                alignItems: "center",
                marginRight: Spacing.md,
              }}
            >
              <Trash2 size={20} color={Colors.error.main} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontWeight: "500",
                  color: Colors.error.main,
                }}
              >
                그룹 삭제
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  color: Colors.neutral[500],
                  marginTop: 2,
                }}
              >
                모든 데이터가 영구 삭제됩니다
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 사진 선택 바텀시트 모달 */}
      <Modal visible={showPhotoModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowPhotoModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: insets.bottom + Spacing.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: Colors.neutral[200],
                borderRadius: 3,
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 20,
              }}
            />

            {/* 현재 이미지 미리보기 */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              {selectedImage || thumbnailImgUrl ? (
                <View style={{ position: "relative" }}>
                  <Image
                    source={{ uri: selectedImage?.uri || thumbnailImgUrl || "" }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      borderWidth: 3,
                      borderColor: Colors.primary[100],
                    }}
                    contentFit="cover"
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      backgroundColor: Colors.primary[500],
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 3,
                      borderColor: Colors.neutral[0],
                    }}
                  >
                    <Camera size={16} color="#FFF" />
                  </View>
                </View>
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: Colors.primary[50],
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: Colors.primary[100],
                  }}
                >
                  <Users size={44} color={Colors.primary[400]} />
                </View>
              )}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: Colors.neutral[900],
                  marginTop: 16,
                }}
              >
                프로필 사진 변경
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: Colors.neutral[500],
                  marginTop: 4,
                }}
              >
                그룹을 대표하는 사진을 설정하세요
              </Text>
            </View>

            {/* 옵션 카드들 */}
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {/* 카메라 & 갤러리 가로 배치 */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* 카메라 */}
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.primary[50],
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: Colors.primary[100],
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: Colors.primary[500],
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                      shadowColor: Colors.primary[500],
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Camera size={28} color="#FFF" />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: Colors.neutral[900],
                    }}
                  >
                    카메라
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    사진 촬영
                  </Text>
                </TouchableOpacity>

                {/* 갤러리 */}
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    backgroundColor: Colors.secondary[50],
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: Colors.secondary[100],
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: Colors.secondary[500],
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                      shadowColor: Colors.secondary[500],
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <ImagePlus size={28} color="#FFF" />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: Colors.neutral[900],
                    }}
                  >
                    앨범
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    사진 선택
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 사진 삭제 (이미지가 있을 때만 표시) */}
              {(selectedImage || thumbnailImgUrl) && (
                <TouchableOpacity
                  onPress={handleRemovePhoto}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.error.light,
                    borderRadius: 16,
                    paddingVertical: 16,
                    gap: 8,
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  <Trash2 size={20} color={Colors.error.main} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: Colors.error.main,
                    }}
                  >
                    현재 사진 삭제
                  </Text>
                </TouchableOpacity>
              )}

              {/* 취소 버튼 */}
              <TouchableOpacity
                onPress={() => setShowPhotoModal(false)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[100],
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: Colors.neutral[600],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 저장 성공 모달 */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            opacity: fadeAnim,
          }}
        >
          <Animated.View
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: 28,
              padding: 32,
              marginHorizontal: 32,
              alignItems: "center",
              width: "85%",
              maxWidth: 340,
              transform: [{ scale: scaleAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            {/* 스파클 장식 */}
            <View style={{ position: "absolute", top: 24, right: 50 }}>
              <Sparkles size={22} color={Colors.secondary[400]} />
            </View>
            <View style={{ position: "absolute", top: 60, left: 35 }}>
              <Sparkles size={16} color={Colors.primary[300]} />
            </View>

            {/* 성공 아이콘 */}
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: Colors.success.light,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: Colors.success.main,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: Colors.success.main,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <CheckCircle size={40} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            {/* 타이틀 */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: Colors.neutral[900],
                marginBottom: 8,
              }}
            >
              {isCreateMode ? "그룹 생성 완료!" : "저장 완료!"}
            </Text>

            {/* 그룹 이름 표시 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.primary[50],
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              {selectedImage || thumbnailImgUrl ? (
                <Image
                  source={{ uri: selectedImage?.uri || thumbnailImgUrl || "" }}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                  contentFit="cover"
                />
              ) : (
                <Users size={20} color={Colors.primary[500]} />
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: Colors.neutral[800],
                  marginLeft: 10,
                }}
                numberOfLines={1}
              >
                {name}
              </Text>
            </View>

            {/* 설명 */}
            <Text
              style={{
                fontSize: 15,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 22,
                marginTop: 8,
              }}
            >
              {isCreateMode ? "새 그룹이 성공적으로\n생성되었습니다" : "그룹 정보가 성공적으로\n수정되었습니다"}
            </Text>

            {/* 확인 버튼 */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                if (isCreateMode && createdGroupId) {
                  // 생성 모드: 새 그룹으로 이동
                  router.replace({
                    pathname: "/(tabs)/group",
                    params: { groupId: createdGroupId, _t: Date.now().toString() },
                  });
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.primary[500],
                paddingVertical: 16,
                paddingHorizontal: 48,
                borderRadius: 16,
                marginTop: 28,
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: Colors.primary[500],
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Check size={22} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* 변경사항 저장 여부 모달 */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowUnsavedModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderRadius: 24,
              padding: 28,
              marginHorizontal: 32,
              width: "85%",
              maxWidth: 340,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 경고 아이콘 */}
            <View
              style={{
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: Colors.warning.light,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: Colors.warning.main,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <AlertTriangle size={28} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            {/* 타이틀 */}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.neutral[900],
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              저장하지 않은 변경사항
            </Text>

            {/* 설명 */}
            <Text
              style={{
                fontSize: 15,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              변경사항이 저장되지 않았습니다.{"\n"}저장하시겠습니까?
            </Text>

            {/* 버튼들 */}
            <View style={{ gap: 10 }}>
              {/* 저장 버튼 */}
              <TouchableOpacity
                onPress={() => {
                  setShowUnsavedModal(false);
                  handleSave();
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.primary[500],
                  paddingVertical: 14,
                  borderRadius: 14,
                  gap: 8,
                }}
              >
                <Save size={18} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  저장하기
                </Text>
              </TouchableOpacity>

              {/* 저장 안함 버튼 */}
              <TouchableOpacity
                onPress={() => {
                  setShowUnsavedModal(false);
                  router.back();
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.neutral[100],
                  paddingVertical: 14,
                  borderRadius: 14,
                  gap: 8,
                }}
              >
                <Trash2 size={18} color={Colors.error.main} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: Colors.error.main,
                  }}
                >
                  저장 안 함
                </Text>
              </TouchableOpacity>

              {/* 취소 버튼 */}
              <TouchableOpacity
                onPress={() => setShowUnsavedModal(false)}
                activeOpacity={0.8}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: Colors.neutral[400],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
