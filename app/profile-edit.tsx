import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Camera, X } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProfile, updateMyProfile, deleteMyAccount } from "@/services/memberApi";
import { uploadImage, ImagePickerAsset } from "@/services/fileUpload";

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { updateUser, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [profileImgUrl, setProfileImgUrl] = useState<string | null>(null);
  const [profileImgFileId, setProfileImgFileId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImagePickerAsset | null>(null);

  // 프로필 데이터 로드
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getMyProfile();
      setName(profile.name);
      setProfileImgUrl(profile.profileImgUrl);
      setProfileImgFileId(profile.profileImgFileId);
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      Alert.alert("오류", "프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // 이름 유효성 검사 (2~20자)
    if (name.length < 2 || name.length > 20) {
      Alert.alert("알림", "이름은 2~20자 이내로 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      let finalFileId = profileImgFileId;

      // 새 이미지가 선택된 경우 업로드
      if (selectedImage) {
        try {
          const uploaded = await uploadImage(
            selectedImage,
            "MEMBER_PROFILE_IMG",
            "PUBLIC"
          );
          finalFileId = uploaded.fileId;
        } catch (uploadError) {
          console.error("이미지 업로드 실패:", uploadError);
          Alert.alert("오류", "이미지 업로드에 실패했습니다. 다시 시도해주세요.");
          setSaving(false);
          return;
        }
      }

      // 프로필 업데이트 API 호출
      await updateMyProfile({
        name,
        profileImgFileId: finalFileId,
      });

      // AuthContext 업데이트
      updateUser({
        name,
        profileImage: selectedImage?.uri || profileImgUrl || undefined,
      });

      Alert.alert("저장 완료", "프로필이 업데이트되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      Alert.alert("오류", "프로필 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    Alert.alert("프로필 사진 변경", "사진을 선택해주세요", [
      {
        text: "카메라",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("권한 필요", "카메라 접근 권한이 필요합니다.");
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedImage({
              uri: asset.uri,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              fileSize: asset.fileSize,
              width: asset.width,
              height: asset.height,
            });
          }
        },
      },
      {
        text: "앨범에서 선택",
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("권한 필요", "앨범 접근 권한이 필요합니다.");
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setSelectedImage({
              uri: asset.uri,
              fileName: asset.fileName,
              mimeType: asset.mimeType,
              fileSize: asset.fileSize,
              width: asset.width,
              height: asset.height,
            });
          }
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원탈퇴",
      "정말로 탈퇴하시겠습니까?\n\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setDeleting(true);
      await deleteMyAccount();
      Alert.alert("탈퇴 완료", "그동안 이용해 주셔서 감사합니다.", [
        {
          text: "확인",
          onPress: () => signOut(),
        },
      ]);
    } catch (error) {
      console.error("회원탈퇴 실패:", error);
      Alert.alert("오류", "회원탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  };

  // 표시할 프로필 이미지 (선택된 이미지 > 기존 이미지 > 기본 이미지)
  const displayImage = selectedImage?.uri || profileImgUrl || "https://i.pravatar.cc/200?img=10";

  if (loading) {
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
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ padding: 8 }}
          disabled={saving}
        >
          <X size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: Typography.fontSize.lg,
            fontWeight: "700",
            color: Colors.neutral[900],
          }}
        >
          프로필 편집
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} />
          ) : (
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontWeight: "600",
                color: Colors.primary[500],
              }}
            >
              저장
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 프로필 사진 */}
        <View style={{ alignItems: "center", paddingVertical: Spacing.xl }}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            style={{ position: "relative" }}
            disabled={saving}
          >
            <Image
              source={{ uri: displayImage }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.primary[500],
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: Colors.neutral[50],
              }}
            >
              <Camera size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.7}
            disabled={saving}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: Colors.primary[500],
                marginTop: Spacing.md,
              }}
            >
              사진 변경
            </Text>
          </TouchableOpacity>
        </View>

        {/* 입력 필드들 */}
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {/* 이름 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: Colors.neutral[600],
                marginBottom: Spacing.xs,
              }}
            >
              이름
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              editable={!saving}
              style={{
                backgroundColor: Colors.neutral[0],
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[900],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
              }}
              placeholder="이름을 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
              maxLength={20}
            />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[400],
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {name.length}/20
            </Text>
          </View>
        </View>

        {/* 회원탈퇴 */}
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            marginTop: Spacing["3xl"],
            paddingTop: Spacing.xl,
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
          }}
        >
          <TouchableOpacity
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={saving || deleting}
            style={{
              paddingVertical: Spacing.md,
              alignItems: "center",
            }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.error.main} />
            ) : (
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: "500",
                  color: Colors.error.main,
                }}
              >
                회원탈퇴
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
