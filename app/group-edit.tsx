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
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Camera,
  Users,
  Bell,
  Trash2,
  ChevronRight,
  Check,
  ImagePlus,
  AlertTriangle,
  Save,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { useGroupDetail, useGroups } from "@/hooks";
import { uploadImage, type ImagePickerAsset } from "@/services/fileUpload";

// 그룹 타입 옵션
const GROUP_TYPES = [
  { value: 'FRIENDS' as const, label: '친구' },
  { value: 'COUPLE' as const, label: '커플' },
  { value: 'FAMILY' as const, label: '가족' },
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
  const [groupType, setGroupType] = useState<'COUPLE' | 'FAMILY' | 'FRIENDS' | 'ETC'>('FRIENDS');
  const [thumbnailImgUrl, setThumbnailImgUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

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


  const handleNotificationsChange = (value: boolean) => {
    setNotificationsEnabled(value);
    setHasChanges(true);
  };

  // 생성 모드 폼 유효성: 이름 2자 이상, 설명 10자 이상
  const isFormValid = name.trim().length >= 2 && description.trim().length >= 10;

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert("알림", "그룹 이름을 2자 이상 입력해주세요.");
      return;
    }
    if (isCreateMode && description.trim().length < 10) {
      Alert.alert("알림", "그룹 설명을 10자 이상 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);

      let finalThumbnailFileId: number | null = null;

      // 새 이미지가 선택되었으면 업로드
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          const uploadedFile = await uploadImage(selectedImage, "FEED_IMG", "PUBLIC");
          finalThumbnailFileId = uploadedFile.fileId;
        } catch (uploadError) {
          console.error("[Group Edit] 이미지 업로드 실패:", uploadError);
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
        thumbnailImgFileId: finalThumbnailFileId || undefined,
        groupType,
      };

      if (isCreateMode) {
        const newGroup = await createGroup(groupData);
        router.replace({
          pathname: "/(tabs)/group",
          params: { groupId: newGroup.id, _t: Date.now().toString(), toast: "그룹 생성이 완료되었습니다" },
        });
        return;
      }
      await updateGroup(groupData);
      router.replace({
        pathname: "/(tabs)/group",
        params: { _t: Date.now().toString(), toast: "그룹 정보가 수정되었습니다" },
      });
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.neutral[50] }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingTop: insets.top }}>
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

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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
        <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.lg }}>
          {/* 그룹 이름 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <View style={groupEditStyles.labelRow}>
              <Text style={groupEditStyles.label}>그룹 이름 <Text style={groupEditStyles.required}>*</Text></Text>
              <Text style={groupEditStyles.limit}>2자 이상</Text>
            </View>
            <TextInput
              style={groupEditStyles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="그룹 이름을 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
              maxLength={30}
            />
          </View>

          {/* 그룹 설명 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <View style={groupEditStyles.labelRow}>
              <Text style={groupEditStyles.label}>그룹 설명 <Text style={groupEditStyles.required}>*</Text></Text>
              <Text style={groupEditStyles.limit}>10자 이상</Text>
            </View>
            <TextInput
              style={[groupEditStyles.input, { minHeight: 90, textAlignVertical: "top", paddingTop: Spacing.md }]}
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="그룹에 대한 설명을 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
              multiline
              maxLength={200}
            />
          </View>

          {/* 그룹 유형 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={[groupEditStyles.label, { marginBottom: Spacing.sm }]}>그룹 유형</Text>
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
                  }}
                >
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

        {/* 알림 설정 */}
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
            알림 설정
          </Text>

          <View
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: Colors.neutral[100],
            }}
          >
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

        {/* 멤버 관리 바로가기 - 그룹 수정 시에만 표시 */}
        {!isCreateMode && (
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
        )}

        {/* 위험 구역 - 그룹 수정 시에만 표시 */}
        {!isCreateMode && (
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
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
          backgroundColor: Colors.neutral[0],
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          ...Shadows.md,
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || (isCreateMode ? !isFormValid : !hasChanges)}
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: (isCreateMode ? isFormValid : hasChanges) && !isSaving
              ? Colors.primary[500]
              : Colors.neutral[300],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.base,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Check size={20} color="#FFF" />
              <Text
                style={{
                  color: "#FFF",
                  fontWeight: "700",
                  fontSize: Typography.fontSize.base,
                  marginLeft: Spacing.sm,
                }}
              >
                {isCreateMode ? "그룹 만들기" : "저장하기"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </View>

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

    </KeyboardAvoidingView>
  );
}

const groupEditStyles = {
  labelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "500" as const,
    color: Colors.neutral[700],
  },
  required: {
    color: Colors.primary[500],
    fontWeight: "600" as const,
  },
  limit: {
    fontSize: 12,
    color: Colors.neutral[400],
  },
  input: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[900],
  },
};
