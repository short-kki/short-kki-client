import React, { useState, useRef, useCallback } from "react";
import {
  Modal,
  Pressable,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors, BorderRadius } from "@/constants/design-system";
import { usePersonalRecipeBooks } from "@/hooks";

interface CreateRecipeBookModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (bookId: string, bookName: string) => void;
}

export default function CreateRecipeBookModal({
  visible,
  onClose,
  onCreated,
}: CreateRecipeBookModalProps) {
  const [bookName, setBookName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { createRecipeBook } = usePersonalRecipeBooks({ enabled: false });

  const handleClose = useCallback(() => {
    setBookName("");
    onClose();
  }, [onClose]);

  const handleCreate = useCallback(async () => {
    const trimmed = bookName.trim();
    if (!trimmed) {
      Alert.alert("알림", "레시피북 이름을 입력해주세요.");
      return;
    }

    setIsCreating(true);
    const newBookId = await createRecipeBook(trimmed);
    setIsCreating(false);

    if (newBookId) {
      setBookName("");
      onCreated(newBookId, trimmed);
    } else {
      Alert.alert("오류", "레시피북 생성에 실패했습니다. 다시 시도해주세요.");
    }
  }, [bookName, createRecipeBook, onCreated]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 100)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={handleClose}
      >
        <Pressable
          style={{
            width: "85%",
            backgroundColor: "#FFFFFF",
            borderRadius: BorderRadius.lg,
            paddingTop: 24,
            paddingHorizontal: 22,
            paddingBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 12,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: Colors.neutral[900],
              marginBottom: 4,
            }}
          >
            새 레시피북
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.neutral[400],
              marginBottom: 18,
            }}
          >
            레시피를 모아둘 새 레시피북을 만들어보세요
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: Colors.neutral[500],
              marginBottom: 8,
            }}
          >
            레시피북 이름
          </Text>
          <TextInput
            ref={inputRef}
            style={{
              backgroundColor: Colors.neutral[50],
              borderWidth: 1.5,
              borderColor: Colors.neutral[200],
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: Colors.neutral[900],
            }}
            placeholder="예) 다이어트 레시피, 주말 브런치"
            placeholderTextColor={Colors.neutral[300]}
            value={bookName}
            onChangeText={setBookName}
            maxLength={20}
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 20 }}>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor: Colors.neutral[100],
                borderRadius: 10,
                paddingVertical: 11,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[500] }}>
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={isCreating || !bookName.trim()}
              activeOpacity={0.7}
              style={{
                flex: 1,
                backgroundColor:
                  isCreating || !bookName.trim()
                    ? Colors.neutral[200]
                    : Colors.primary[500],
                borderRadius: 10,
                paddingVertical: 11,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color:
                    isCreating || !bookName.trim()
                      ? Colors.neutral[400]
                      : "#FFFFFF",
                }}
              >
                {isCreating ? "추가 중..." : "추가"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
