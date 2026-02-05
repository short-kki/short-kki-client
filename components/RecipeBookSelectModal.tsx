import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { usePersonalRecipeBooks, useGroupRecipeBooks } from "@/hooks";

interface RecipeBookSelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (bookId: string, bookName: string) => Promise<void>;
    currentBookId?: string; // 현재 레시피북 ID (이동 시 제외)
    title?: string; // 모달 제목
}

export default function RecipeBookSelectModal({
    visible,
    onClose,
    onSelect,
    currentBookId,
    title = "저장 위치",
}: RecipeBookSelectModalProps) {
    const insets = useSafeAreaInsets();
    const [selectedTab, setSelectedTab] = useState<"personal" | "group">("personal");

    const { recipeBooks: personalBooks = [] } = usePersonalRecipeBooks();
    const { recipeBooks: groupBooks = [] } = useGroupRecipeBooks();

    const handleBookSelect = async (bookId: string, bookName: string) => {
        onClose();
        try {
            await onSelect(bookId, bookName);
        } catch (error) {
            console.error("레시피북 선택 실패:", error);
            Alert.alert("오류", "레시피북 선택에 실패했습니다.");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    justifyContent: "flex-end",
                }}
                onPress={onClose}
            >
                <Pressable
                    style={{
                        backgroundColor: Colors.neutral[0],
                        borderTopLeftRadius: BorderRadius.xl,
                        borderTopRightRadius: BorderRadius.xl,
                        maxHeight: "70%",
                        paddingTop: Spacing.md,
                        paddingBottom: insets.bottom + Spacing.lg,
                    }}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* 핸들바 */}
                    <View
                        style={{
                            width: 36,
                            height: 4,
                            backgroundColor: Colors.neutral[300],
                            borderRadius: 2,
                            alignSelf: "center",
                            marginBottom: Spacing.md,
                        }}
                    />

                    {/* 제목 */}
                    <Text
                        style={{
                            fontSize: Typography.fontSize.lg,
                            fontWeight: "700",
                            color: Colors.neutral[900],
                            paddingHorizontal: Spacing.xl,
                            marginBottom: Spacing.md,
                        }}
                    >
                        {title}
                    </Text>

                    {/* 탭 */}
                    <View
                        style={{
                            flexDirection: "row",
                            paddingHorizontal: Spacing.xl,
                            marginBottom: Spacing.sm,
                            gap: 12,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedTab("personal")}
                            style={{
                                paddingVertical: 8,
                                borderBottomWidth: 2,
                                borderBottomColor: selectedTab === "personal" ? Colors.primary[500] : "transparent",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Typography.fontSize.base,
                                    fontWeight: selectedTab === "personal" ? "600" : "400",
                                    color: selectedTab === "personal" ? Colors.neutral[900] : Colors.neutral[400],
                                }}
                            >
                                개인
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedTab("group")}
                            style={{
                                paddingVertical: 8,
                                borderBottomWidth: 2,
                                borderBottomColor: selectedTab === "group" ? Colors.primary[500] : "transparent",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Typography.fontSize.base,
                                    fontWeight: selectedTab === "group" ? "600" : "400",
                                    color: selectedTab === "group" ? Colors.neutral[900] : Colors.neutral[400],
                                }}
                            >
                                그룹
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 레시피북 리스트 */}
                    <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingHorizontal: Spacing.xl }}>
                        {selectedTab === "personal"
                            ? personalBooks
                                .filter((book) => book.id !== currentBookId)
                                .map((book) => (
                                    <TouchableOpacity
                                        key={book.id}
                                        onPress={() => handleBookSelect(book.id, book.name)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: Spacing.md,
                                            borderBottomWidth: 1,
                                            borderBottomColor: Colors.neutral[200],
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: BorderRadius.md,
                                                backgroundColor: Colors.neutral[100],
                                                marginRight: Spacing.md,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {book.thumbnails[0] && (
                                                <Image source={{ uri: book.thumbnails[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: Typography.fontSize.base, fontWeight: "600", color: Colors.neutral[900] }}>
                                                {book.name}
                                            </Text>
                                            <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[500], marginTop: 2 }}>
                                                {book.recipeCount}개
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            : groupBooks.map((book) => (
                                <TouchableOpacity
                                    key={book.id}
                                    onPress={() => handleBookSelect(book.id, book.name)}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingVertical: Spacing.md,
                                        borderBottomWidth: 1,
                                        borderBottomColor: Colors.neutral[200],
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: BorderRadius.md,
                                            backgroundColor: Colors.neutral[100],
                                            marginRight: Spacing.md,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {book.thumbnails[0] && (
                                            <Image source={{ uri: book.thumbnails[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: Typography.fontSize.base, fontWeight: "600", color: Colors.neutral[900] }}>
                                            {book.name}
                                        </Text>
                                        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.neutral[500], marginTop: 2 }}>
                                            {book.groupName} • {book.recipeCount}개
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>

                    {/* 취소 버튼 */}
                    <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: Colors.neutral[100],
                                borderRadius: BorderRadius.lg,
                                paddingVertical: Spacing.md,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontSize: Typography.fontSize.base, fontWeight: "600", color: Colors.neutral[900] }}>
                                취소
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
