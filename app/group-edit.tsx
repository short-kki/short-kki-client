import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { Image } from "expo-image";
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
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 더미 그룹 데이터
const GROUP_DATA: Record<string, {
  name: string;
  description: string;
  thumbnail: string | null;
  isPrivate: boolean;
  notificationsEnabled: boolean;
  memberCount: number;
}> = {
  "1": {
    name: "우리 가족 식단",
    description: "가족들이 함께 레시피를 공유하는 그룹입니다.",
    thumbnail: null,
    isPrivate: true,
    notificationsEnabled: true,
    memberCount: 4,
  },
  "2": {
    name: "자취생 요리 모임",
    description: "자취생들의 간단하고 맛있는 요리 공유",
    thumbnail: null,
    isPrivate: false,
    notificationsEnabled: true,
    memberCount: 12,
  },
  "3": {
    name: "다이어트 챌린지",
    description: "함께 건강한 식단을 만들어가요!",
    thumbnail: null,
    isPrivate: false,
    notificationsEnabled: false,
    memberCount: 8,
  },
};

export default function GroupEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string }>();

  const groupId = params.groupId || "1";
  const initialData = GROUP_DATA[groupId] || {
    name: "",
    description: "",
    thumbnail: null,
    isPrivate: false,
    notificationsEnabled: true,
    memberCount: 0,
  };

  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [isPrivate, setIsPrivate] = useState(initialData.isPrivate);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialData.notificationsEnabled);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = (text: string) => {
    setName(text);
    setHasChanges(true);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
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

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("알림", "그룹 이름을 입력해주세요.");
      return;
    }

    Alert.alert("저장 완료", "그룹 정보가 수정되었습니다.", [
      { text: "확인", onPress: () => router.back() },
    ]);
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
          onPress: () => {
            Alert.alert("삭제 완료", "그룹이 삭제되었습니다.", [
              { text: "확인", onPress: () => router.replace("/(tabs)/group") },
            ]);
          },
        },
      ]
    );
  };

  const handleChangePhoto = () => {
    Alert.alert("프로필 사진", "그룹 프로필 사진을 변경합니다.", [
      { text: "취소", style: "cancel" },
      { text: "카메라", onPress: () => {} },
      { text: "앨범에서 선택", onPress: () => {} },
    ]);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "변경 사항 저장",
        "저장하지 않은 변경 사항이 있습니다. 저장하시겠습니까?",
        [
          { text: "저장 안 함", style: "destructive", onPress: () => router.back() },
          { text: "취소", style: "cancel" },
          { text: "저장", onPress: handleSave },
        ]
      );
    } else {
      router.back();
    }
  };

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
            그룹 수정
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={{
            backgroundColor: hasChanges ? Colors.primary[500] : Colors.neutral[200],
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: BorderRadius.full,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: hasChanges ? "#FFF" : Colors.neutral[400],
            }}
          >
            저장
          </Text>
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
            style={{ position: "relative" }}
          >
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
              <Camera size={16} color="#FFF" />
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
            사진 변경
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
                {initialData.memberCount}명의 멤버
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
    </View>
  );
}
