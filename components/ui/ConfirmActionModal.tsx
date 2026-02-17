import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { BorderRadius, Colors } from "@/constants/design-system";

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  description?: string;
  targetName?: string;
  icon?: React.ReactNode;
  confirmText?: string;
  confirmLoadingText?: string;
  cancelText?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionModal({
  visible,
  title,
  description,
  targetName,
  icon,
  confirmText = "삭제",
  confirmLoadingText = "삭제 중...",
  cancelText = "취소",
  loading = false,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => {
          if (loading) return;
          onClose();
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
              backgroundColor: Colors.error.light,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            {icon || <AlertCircle size={24} color={Colors.error.main} />}
          </View>

          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: Colors.neutral[900],
              textAlign: "center",
            }}
          >
            {title}
          </Text>

          {targetName ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: Colors.neutral[500],
                marginTop: 6,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {targetName}
            </Text>
          ) : null}

          {description ? (
            <Text
              style={{
                fontSize: 13,
                color: Colors.neutral[400],
                textAlign: "center",
                lineHeight: 18,
                marginTop: 6,
              }}
            >
              {description}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 20,
              width: "100%",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: Colors.neutral[100],
                paddingVertical: 13,
                borderRadius: BorderRadius.lg,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.neutral[600],
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: loading ? Colors.neutral[300] : Colors.error.main,
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
                {loading ? confirmLoadingText : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
