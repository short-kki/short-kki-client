import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, X } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState("요리조리");
  const [bio, setBio] = useState("자취 5년차 집밥 마스터");
  const [website, setWebsite] = useState("");

  const handleSave = () => {
    Alert.alert("저장 완료", "프로필이 업데이트되었습니다.", [
      { text: "확인", onPress: () => router.back() },
    ]);
  };

  const handleChangePhoto = () => {
    Alert.alert("프로필 사진 변경", "사진을 선택해주세요", [
      { text: "카메라", onPress: () => {} },
      { text: "앨범에서 선택", onPress: () => {} },
      { text: "취소", style: "cancel" },
    ]);
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
        <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: Colors.primary[500],
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
        {/* 프로필 사진 */}
        <View style={{ alignItems: "center", paddingVertical: Spacing.xl }}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            style={{ position: "relative" }}
          >
            <Image
              source={{ uri: "https://i.pravatar.cc/200?img=10" }}
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
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
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
            />
          </View>

          {/* 소개 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: Colors.neutral[600],
                marginBottom: Spacing.xs,
              }}
            >
              소개
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: Colors.neutral[0],
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[900],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="자기소개를 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
            />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                color: Colors.neutral[400],
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {bio.length}/100
            </Text>
          </View>

          {/* 웹사이트 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: "600",
                color: Colors.neutral[600],
                marginBottom: Spacing.xs,
              }}
            >
              웹사이트
            </Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
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
              placeholder="https://"
              placeholderTextColor={Colors.neutral[400]}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
