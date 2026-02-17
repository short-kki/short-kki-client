import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { BorderRadius, Colors } from "@/constants/design-system";

interface SuccessResultModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

export default function SuccessResultModal({
  visible,
  title,
  description,
  confirmText = "확인",
  onConfirm,
  onClose,
}: SuccessResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => onClose?.()}
      >
        <Pressable
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 28,
            marginHorizontal: 40,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
            width: "85%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.success.light,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <CheckCircle size={36} color={Colors.success.main} />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: Colors.neutral[900],
              marginBottom: description ? 10 : 0,
              textAlign: "center",
            }}
          >
            {title}
          </Text>

          {description ? (
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {description}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={onConfirm}
            activeOpacity={0.8}
            style={{
              marginTop: 24,
              width: "100%",
              backgroundColor: Colors.primary[500],
              paddingVertical: 14,
              borderRadius: BorderRadius.lg,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#FFFFFF",
              }}
            >
              {confirmText}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
