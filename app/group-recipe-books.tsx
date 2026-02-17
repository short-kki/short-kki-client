import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Folder, Book } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useGroupRecipeBooksById } from "@/hooks";
import { API_BASE_URL } from "@/constants/oauth";

export default function GroupRecipeBooksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const { recipeBooks, loading, error, refetch } = useGroupRecipeBooksById(params.groupId);

  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    if (url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // 화면에 포커스될 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleBookPress = (bookId: string, bookName?: string) => {
    router.push({
      pathname: "/recipe-book-detail",
      params: { bookId, ...(bookName ? { bookName } : {}) },
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          backgroundColor: Colors.neutral[0],
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ArrowLeft size={24} color={Colors.neutral[900]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.neutral[900],
            }}
          >
            {params.groupName || "그룹"} 레시피북
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: 40,
        }}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingVertical: Spacing["4xl"] }}>
            <Text style={{ color: Colors.error.main }}>
              데이터를 불러오는데 실패했습니다.
            </Text>
          </View>
        ) : recipeBooks.length > 0 ? (
          recipeBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              onPress={() => handleBookPress(book.id, book.name)}
              activeOpacity={0.8}
              style={{
                backgroundColor: Colors.neutral[0],
                borderRadius: BorderRadius.xl,
                marginBottom: Spacing.lg,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: Colors.neutral[100],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Thumbnail grid */}
              <View
                style={{
                  height: 140,
                  flexDirection: "row",
                  backgroundColor: Colors.neutral[100],
                }}
              >
                {book.thumbnails.length > 0 ? (
                  <>
                    <View style={{ flex: 1, marginRight: 2 }}>
                      <Image
                        source={{ uri: getImageUrl(book.thumbnails[0]) }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </View>
                    <View style={{ width: 90, gap: 2 }}>
                      {book.thumbnails.slice(1, 3).map((thumb, index) => (
                        <View key={index} style={{ flex: 1 }}>
                          <Image
                            source={{ uri: getImageUrl(thumb) }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        </View>
                      ))}
                      {book.thumbnails.length <= 1 && (
                        <View style={{ flex: 1, backgroundColor: Colors.neutral[200] }} />
                      )}
                      {book.thumbnails.length <= 2 && book.thumbnails.length > 1 && (
                        <View style={{ flex: 1, backgroundColor: Colors.neutral[200] }} />
                      )}
                    </View>
                  </>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: Colors.neutral[100],
                    }}
                  >
                    <Folder size={40} color={Colors.neutral[300]} />
                  </View>
                )}

                {/* Recipe count badge */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
                    {book.recipeCount}개
                  </Text>
                </View>
              </View>

              {/* Info */}
              <View style={{ padding: Spacing.lg }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: "700",
                    color: Colors.neutral[900],
                  }}
                  numberOfLines={1}
                >
                  {book.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing["4xl"],
            }}
          >
            <Book size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginTop: Spacing.md,
              }}
            >
              레시피북이 없어요
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                marginTop: Spacing.xs,
                textAlign: "center",
              }}
            >
              그룹에 레시피를 추가하면 레시피북이 생성됩니다
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
