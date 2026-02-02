import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Check,
  Trash2,
  ShoppingCart,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useShoppingList } from "@/hooks";

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  // API 연동 Hook
  const { items, loading, error, refetch, deleteItem: deleteItemApi } = useShoppingList(params.groupId);

  // 로컬 체크 상태 (서버에서는 체크 상태를 저장하지 않으므로 로컬에서 관리)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setCheckedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      setIsDeleting(itemId);
      await deleteItemApi(itemId);
      // 체크 상태에서도 제거
      setCheckedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (err) {
      console.error("삭제 실패:", err);
      Alert.alert("오류", "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  const clearCheckedItems = () => {
    const checkedItemsList = items.filter((item) => checkedIds.has(item.id));
    if (checkedItemsList.length === 0) return;

    Alert.alert("완료된 항목 삭제", `체크된 ${checkedItemsList.length}개 항목을 모두 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            // 체크된 항목들을 순차적으로 삭제
            for (const item of checkedItemsList) {
              await deleteItemApi(item.id);
            }
            setCheckedIds(new Set());
          } catch (err) {
            console.error("삭제 실패:", err);
            Alert.alert("오류", "일부 항목 삭제에 실패했습니다.");
            refetch();
          }
        },
      },
    ]);
  };

  const totalItems = items.length;
  const checkedItemsCount = checkedIds.size;

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
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 8 }}
          >
            <ArrowLeft size={24} color={Colors.neutral[900]} />
          </Pressable>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.neutral[900],
              }}
            >
              장볼거리
            </Text>
            {params.groupName && (
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.neutral[500],
                  marginTop: 2,
                }}
              >
                {params.groupName}
              </Text>
            )}
          </View>
        </View>

        {checkedItemsCount > 0 && (
          <TouchableOpacity onPress={clearCheckedItems} activeOpacity={0.7}>
            <Text
              style={{
                fontSize: 14,
                color: Colors.error.main,
                fontWeight: "600",
              }}
            >
              완료 삭제
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: Colors.neutral[0],
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: Colors.neutral[600] }}>
            진행률
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.primary[500] }}>
            {checkedItemsCount}/{totalItems} 완료
          </Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: Colors.neutral[200],
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: totalItems > 0 ? `${(checkedItemsCount / totalItems) * 100}%` : "0%",
              height: "100%",
              backgroundColor: Colors.primary[500],
              borderRadius: 4,
            }}
          />
        </View>
      </View>

      {/* Shopping List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 80,
            }}
          >
            <ActivityIndicator size="large" color={Colors.primary[500]} />
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[500],
                marginTop: 12,
              }}
            >
              불러오는 중...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 80,
            }}
          >
            <ShoppingCart size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: 16,
                color: Colors.error.main,
                marginTop: 12,
              }}
            >
              불러오기 실패
            </Text>
            <TouchableOpacity onPress={refetch} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.primary[500], fontWeight: "600" }}>
                다시 시도
              </Text>
            </TouchableOpacity>
          </View>
        ) : items.length > 0 ? (
          <View>
            {/* Items */}
            {items.map((item) => {
              const isChecked = checkedIds.has(item.id);
              const isItemDeleting = isDeleting === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleItem(item.id)}
                  disabled={isItemDeleting}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[0],
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: BorderRadius.lg,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isChecked ? Colors.primary[200] : Colors.neutral[100],
                    opacity: isItemDeleting ? 0.5 : 1,
                  }}
                >
                  {/* Checkbox */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isChecked ? Colors.primary[500] : Colors.neutral[300],
                      backgroundColor: isChecked ? Colors.primary[500] : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {isChecked && <Check size={14} color="#FFFFFF" />}
                  </View>

                  {/* Item Name */}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isChecked ? Colors.neutral[400] : Colors.neutral[900],
                      marginLeft: 12,
                      textDecorationLine: isChecked ? "line-through" : "none",
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => handleDeleteItem(item.id)}
                    disabled={isItemDeleting}
                    style={{ padding: 4 }}
                  >
                    {isItemDeleting ? (
                      <ActivityIndicator size="small" color={Colors.neutral[400]} />
                    ) : (
                      <Trash2 size={18} color={Colors.neutral[400]} />
                    )}
                  </Pressable>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 80,
            }}
          >
            <ShoppingCart size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: 16,
                color: Colors.neutral[500],
                marginTop: 12,
              }}
            >
              장볼거리가 없습니다
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.neutral[400],
                marginTop: 4,
              }}
            >
              레시피에서 재료를 추가해보세요
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 장볼거리는 레시피 상세 화면에서 재료 추가를 통해 추가됩니다 */}
    </View>
  );
}
