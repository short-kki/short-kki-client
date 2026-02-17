import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, Trash2 } from "lucide-react-native";
import { BorderRadius, Colors } from "@/constants/design-system";

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  description: string;
  targetName?: string;
  targetMeta?: string;
  targetIcon?: React.ReactNode;
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
  targetMeta,
  targetIcon,
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
              backgroundColor: Colors.error.light,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={36} color={Colors.error.main} />
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: Colors.neutral[900],
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          {targetName && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.neutral[100],
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                marginBottom: 12,
                width: "100%",
                justifyContent: "center",
              }}
            >
              {targetIcon}
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.neutral[800],
                  marginLeft: 8,
                }}
                numberOfLines={1}
              >
                {targetName}
              </Text>
              {targetMeta ? (
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.neutral[500],
                    marginLeft: 8,
                  }}
                >
                  {targetMeta}
                </Text>
              ) : null}
            </View>
          )}

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

          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 24,
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
                paddingVertical: 14,
                borderRadius: BorderRadius.lg,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.neutral[700],
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
                paddingVertical: 14,
                borderRadius: BorderRadius.lg,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Trash2 size={18} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 15,
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
