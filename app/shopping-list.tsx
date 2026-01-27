import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  ShoppingCart,
  X,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

// 카테고리별 장볼거리 더미 데이터
const INITIAL_SHOPPING_LIST = [
  {
    category: "채소/과일",
    items: [
      { id: "1", name: "양파 2개", checked: false },
      { id: "2", name: "대파 1단", checked: true },
      { id: "3", name: "당근 3개", checked: false },
      { id: "4", name: "감자 5개", checked: false },
    ],
  },
  {
    category: "육류/해산물",
    items: [
      { id: "5", name: "삼겹살 600g", checked: false },
      { id: "6", name: "닭가슴살 500g", checked: true },
    ],
  },
  {
    category: "유제품/계란",
    items: [
      { id: "7", name: "계란 30구", checked: false },
      { id: "8", name: "우유 1L", checked: false },
    ],
  },
  {
    category: "양념/소스",
    items: [
      { id: "9", name: "간장", checked: true },
      { id: "10", name: "고추장", checked: false },
    ],
  },
];

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const [shoppingList, setShoppingList] = useState<ShoppingCategory[]>(INITIAL_SHOPPING_LIST);
  const [newItemText, setNewItemText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("채소/과일");
  const [showAddInput, setShowAddInput] = useState(false);

  const categories = ["채소/과일", "육류/해산물", "유제품/계란", "양념/소스", "기타"];

  const toggleItem = (categoryName: string, itemId: string) => {
    setShoppingList((prev) =>
      prev.map((category) => {
        if (category.category === categoryName) {
          return {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item
            ),
          };
        }
        return category;
      })
    );
  };

  const deleteItem = (categoryName: string, itemId: string) => {
    setShoppingList((prev) =>
      prev.map((category) => {
        if (category.category === categoryName) {
          return {
            ...category,
            items: category.items.filter((item) => item.id !== itemId),
          };
        }
        return category;
      }).filter((category) => category.items.length > 0)
    );
  };

  const addItem = () => {
    if (!newItemText.trim()) {
      Alert.alert("알림", "항목 이름을 입력해주세요.");
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemText.trim(),
      checked: false,
    };

    setShoppingList((prev) => {
      const categoryExists = prev.find((c) => c.category === selectedCategory);
      if (categoryExists) {
        return prev.map((category) => {
          if (category.category === selectedCategory) {
            return {
              ...category,
              items: [...category.items, newItem],
            };
          }
          return category;
        });
      } else {
        return [...prev, { category: selectedCategory, items: [newItem] }];
      }
    });

    setNewItemText("");
    setShowAddInput(false);
  };

  const clearCheckedItems = () => {
    Alert.alert("완료된 항목 삭제", "체크된 항목을 모두 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setShoppingList((prev) =>
            prev
              .map((category) => ({
                ...category,
                items: category.items.filter((item) => !item.checked),
              }))
              .filter((category) => category.items.length > 0)
          );
        },
      },
    ]);
  };

  const totalItems = shoppingList.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = shoppingList.reduce(
    (acc, cat) => acc + cat.items.filter((item) => item.checked).length,
    0
  );

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

        {checkedItems > 0 && (
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
            {checkedItems}/{totalItems} 완료
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
              width: totalItems > 0 ? `${(checkedItems / totalItems) * 100}%` : "0%",
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
        {shoppingList.length > 0 ? (
          shoppingList.map((category) => (
            <View key={category.category} style={{ marginBottom: 24 }}>
              {/* Category Header */}
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.neutral[800],
                  marginBottom: 12,
                }}
              >
                {category.category}
              </Text>

              {/* Items */}
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => toggleItem(category.category, item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[0],
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: BorderRadius.lg,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: item.checked ? Colors.primary[200] : Colors.neutral[100],
                  }}
                >
                  {/* Checkbox */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: item.checked ? Colors.primary[500] : Colors.neutral[300],
                      backgroundColor: item.checked ? Colors.primary[500] : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {item.checked && <Check size={14} color="#FFFFFF" />}
                  </View>

                  {/* Item Name */}
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: item.checked ? Colors.neutral[400] : Colors.neutral[900],
                      marginLeft: 12,
                      textDecorationLine: item.checked ? "line-through" : "none",
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* Delete Button */}
                  <Pressable
                    onPress={() => deleteItem(category.category, item.id)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color={Colors.neutral[400]} />
                  </Pressable>
                </TouchableOpacity>
              ))}
            </View>
          ))
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
              아래 + 버튼을 눌러 추가해보세요
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Item Input */}
      {showAddInput && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.neutral[0],
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Category Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor:
                    selectedCategory === cat ? Colors.primary[500] : Colors.neutral[100],
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: selectedCategory === cat ? "#FFFFFF" : Colors.neutral[600],
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Row */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TextInput
              style={{
                flex: 1,
                height: 48,
                backgroundColor: Colors.neutral[100],
                borderRadius: BorderRadius.lg,
                paddingHorizontal: 16,
                fontSize: 15,
                color: Colors.neutral[900],
              }}
              placeholder="항목 이름 (예: 양파 2개)"
              placeholderTextColor={Colors.neutral[400]}
              value={newItemText}
              onChangeText={setNewItemText}
              returnKeyType="done"
              onSubmitEditing={addItem}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => setShowAddInput(false)}
              style={{ padding: 8 }}
            >
              <X size={24} color={Colors.neutral[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addItem}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: Colors.primary[500],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Check size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Button (FAB) */}
      {!showAddInput && (
        <TouchableOpacity
          onPress={() => setShowAddInput(true)}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            bottom: insets.bottom + 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.primary[500],
            justifyContent: "center",
            alignItems: "center",
            shadowColor: Colors.primary[500],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
