import React from "react";
import { Alert, Linking, Modal, Platform, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Download } from "lucide-react-native";
import { BorderRadius, Colors } from "@/constants/design-system";

interface UpdateModalProps {
  visible: boolean;
  message: string;
}

const STORE_URL = Platform.select({
  android: "market://details?id=com.anonymous.shortkki",
  ios: "https://apps.apple.com/app/id0000000000", // TODO: App Store 등록 후 실제 ID로 교체
});

export default function UpdateModal({ visible, message }: UpdateModalProps) {
  const handleUpdate = async () => {
    if (!STORE_URL) return;
    try {
      await Linking.openURL(STORE_URL);
    } catch {
      Alert.alert("안내", "스토어를 열 수 없습니다. 직접 스토어에서 업데이트해주세요.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 20,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
            width: "80%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.primary[100],
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Download size={24} color={Colors.primary[500]} />
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: Colors.neutral[900],
              textAlign: "center",
            }}
          >
            업데이트 필요
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: Colors.neutral[400],
              textAlign: "center",
              lineHeight: 18,
              marginTop: 8,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={handleUpdate}
            activeOpacity={0.8}
            style={{
              marginTop: 20,
              width: "100%",
              backgroundColor: Colors.primary[500],
              paddingVertical: 13,
              borderRadius: BorderRadius.lg,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              업데이트
            </Text>
          </TouchableOpacity>
        </Pressable>
      </View>
    </Modal>
  );
}
