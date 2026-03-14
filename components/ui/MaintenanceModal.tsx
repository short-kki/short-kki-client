import React from "react";
import { Modal, Text, View } from "react-native";
import { Wrench } from "lucide-react-native";
import { Colors, Typography } from "@/constants/design-system";

interface MaintenanceModalProps {
  visible: boolean;
  message: string;
}

export default function MaintenanceModal({ visible, message }: MaintenanceModalProps) {
  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFBF7",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: Colors.primary[100],
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Wrench size={36} color={Colors.primary[500]} />
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: Colors.neutral[900],
            marginBottom: 12,
            textAlign: "center",
            letterSpacing: Typography.letterSpacing.tight,
          }}
        >
          서비스 점검 중
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: Colors.neutral[500],
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {message || "더 나은 서비스를 위해 점검 중입니다.\n잠시 후 다시 이용해주세요."}
        </Text>
      </View>
    </Modal>
  );
}
